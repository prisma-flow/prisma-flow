import type { DriftItem, MigrationStatus, MigrationVerificationStatus } from '@prisma-flow/shared'
import { logger } from '../../logger.js'
import { classifyDriftSql, parseSqlStatements } from '../drift-detector.js'
import { execPrisma } from '../prisma-cli.js'
import type { MigrationStatusResult } from './types.js'

function labelDriftType(type: DriftItem['type']): string {
  const labels: Record<DriftItem['type'], string> = {
    'table-missing': 'Table missing in database',
    'table-extra': 'Table exists in database but not in schema',
    'column-mismatch': 'Column or table structure mismatch',
    'index-change': 'Index difference detected',
    'constraint-change': 'Constraint difference detected',
    unknown: 'Unknown schema change',
    missing_migration: 'Migration applied to DB but missing from history',
    extra_column: 'Extra column present in DB not in schema',
    extra_table: 'Extra table present in DB not in schema',
    modified_migration: 'Migration SQL was modified after being applied',
  }
  return labels[type]
}

export function parseStatusOutput(
  stdout: string,
  stderr: string,
  options?: { isExitZero?: boolean },
): {
  verification: MigrationVerificationStatus
  connected: boolean
  statusMap: Map<string, MigrationStatus>
  errorMessage?: string
  errorCode?: string
} {
  const statusMap = new Map<string, MigrationStatus>()
  const combined = `${stdout}\n${stderr}`
  const isExitZero = options?.isExitZero ?? false

  // 1. Connection / Reachability failures
  if (
    combined.includes('P1001') ||
    combined.includes("Can't reach database server") ||
    combined.includes('Connection refused') ||
    combined.includes('ECONNREFUSED') ||
    combined.includes('ENOTFOUND')
  ) {
    return {
      verification: 'error',
      connected: false,
      statusMap,
      errorCode: 'DATABASE_UNREACHABLE',
      errorMessage: 'Database server is unreachable. Check DATABASE_URL.',
    }
  }

  // 2. Authentication failures
  if (
    combined.includes('P1000') ||
    combined.includes('Authentication failed') ||
    combined.includes('password authentication failed')
  ) {
    return {
      verification: 'error',
      connected: false,
      statusMap,
      errorCode: 'AUTHENTICATION_FAILED',
      errorMessage: 'Database credentials failed authentication.',
    }
  }

  // 3. Schema validation failures
  if (
    combined.includes('P1012') ||
    combined.includes('Schema validation error') ||
    combined.includes('Error validating')
  ) {
    return {
      verification: 'error',
      connected: false,
      statusMap,
      errorCode: 'MALFORMED_SCHEMA',
      errorMessage: 'Prisma schema validation failed. Check schema syntax.',
    }
  }

  // 4. Invalid configuration
  if (
    combined.includes('P1013') ||
    combined.includes('Invalid configuration') ||
    combined.includes('Invalid database string')
  ) {
    return {
      verification: 'error',
      connected: false,
      statusMap,
      errorCode: 'INVALID_CONFIG',
      errorMessage: 'Invalid Prisma configuration or database URL.',
    }
  }

  // 5. Migration history divergence / conflicts (P3005, missing migrations recorded in DB)
  if (
    combined.includes('P3005') ||
    combined.includes('not in sync with the migration history') ||
    combined.includes('recorded in the database but missing locally')
  ) {
    return {
      verification: 'unknown',
      connected: true,
      statusMap,
      errorCode: 'MIGRATION_HISTORY_CONFLICT',
      errorMessage: 'Database schema is not in sync with local migration history.',
    }
  }

  // 6. Check for fatal stderr errors on non-zero exit
  const trimmedStderr = stderr.trim()
  if (!isExitZero && trimmedStderr.length > 0) {
    // If stderr has fatal error output, NEVER allow stdout text to falsely verify
    if (
      trimmedStderr.toLowerCase().includes('error') ||
      trimmedStderr.toLowerCase().includes('failure') ||
      trimmedStderr.toLowerCase().includes('fault') ||
      trimmedStderr.toLowerCase().includes('panic') ||
      trimmedStderr.toLowerCase().includes('unknown')
    ) {
      return {
        verification: 'unknown',
        connected: false,
        statusMap,
        errorCode: 'UNEXPECTED_CLI_FAILURE',
        errorMessage: trimmedStderr,
      }
    }
  }

  // 7. Parse pending/failed migrations from output
  const lines = stdout.split('\n')
  let mode: 'none' | 'pending' | 'failed' = 'none'

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (line.includes('have not yet been applied')) {
      mode = 'pending'
      continue
    }
    if (line.match(/failed to apply|rolled back|migration.*failed/i)) {
      mode = 'failed'
      continue
    }
    if (line.includes('Database schema is up to date') || line.includes('No pending migrations')) {
      // Only clean on EXIT 0. If non-zero exit happened, this cannot be safely verified.
      if (!isExitZero && trimmedStderr.length > 0) {
        return {
          verification: 'unknown',
          connected: false,
          statusMap,
          errorCode: 'UNEXPECTED_CLI_FAILURE',
          errorMessage: trimmedStderr || 'Prisma CLI exited non-zero with clean stdout.',
        }
      }
      mode = 'none'
      continue
    }
    if (line === '' || line.startsWith('─') || line.startsWith('The following')) {
      mode = 'none'
      continue
    }

    if (mode === 'none') continue

    const cleaned = line.replace(/^[•\-*]\s*/, '').trim()
    if (cleaned.match(/^\d{14}/)) {
      statusMap.set(cleaned, mode === 'pending' ? 'pending' : 'failed')
    }
  }

  // If we parsed real pending or failed migration entries without fatal errors, state is verified
  if (statusMap.size > 0) {
    return {
      verification: 'verified',
      connected: true,
      statusMap,
    }
  }

  // If exit code was 0 and no errors found, clean up to date state is verified
  if (isExitZero) {
    return {
      verification: 'verified',
      connected: true,
      statusMap,
    }
  }

  // 8. Non-zero exit with no parsed pending/failed migrations — FAIL CLOSED!
  return {
    verification: 'unknown',
    connected: false,
    statusMap,
    errorCode: 'UNEXPECTED_CLI_FAILURE',
    errorMessage:
      trimmedStderr || stdout.trim() || 'Prisma CLI exited unexpectedly with unknown status.',
  }
}

export async function runPrismaMigrateStatus(
  cwd: string,
  schemaPath: string,
): Promise<MigrationStatusResult> {
  try {
    const { stdout, stderr } = await execPrisma(
      cwd,
      ['migrate', 'status', '--schema', schemaPath],
      {
        timeout: 30_000,
      },
    )
    return parseStatusOutput(stdout, stderr, { isExitZero: true })
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message?: string }
    const stdout = error.stdout ?? ''
    const stderr = error.stderr ?? ''
    logger.debug({ stdout, stderr }, 'prisma migrate status returned non-zero')
    return parseStatusOutput(stdout, stderr, { isExitZero: false })
  }
}

export function parseDriftOutput(stdout: string): DriftItem[] {
  const output = stdout.trim()
  if (!output) return []

  return parseSqlStatements(output)
    .filter((s) => !s.toUpperCase().trimStart().startsWith('--'))
    .map((sql) => {
      const type = classifyDriftSql(sql)
      return { sql, type, description: labelDriftType(type) }
    })
}
