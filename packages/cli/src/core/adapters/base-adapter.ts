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
): {
  verification: MigrationVerificationStatus
  connected: boolean
  statusMap: Map<string, MigrationStatus>
  errorMessage?: string
  errorCode?: string
} {
  const statusMap = new Map<string, MigrationStatus>()
  const combined = `${stdout}\n${stderr}`

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

  // 5. Parse pending/failed migrations from output
  const lines = stdout.split('\n')
  let mode: 'none' | 'pending' | 'failed' = 'none'
  let foundKnownSections = false

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (line.includes('have not yet been applied')) {
      mode = 'pending'
      foundKnownSections = true
      continue
    }
    if (line.match(/failed to apply|rolled back|migration.*failed/i)) {
      mode = 'failed'
      foundKnownSections = true
      continue
    }
    if (line.includes('Database schema is up to date') || line.includes('No pending migrations')) {
      foundKnownSections = true
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

  if (foundKnownSections || statusMap.size > 0) {
    return {
      verification: 'verified',
      connected: true,
      statusMap,
    }
  }

  // 6. Unknown Prisma CLI failure — FAIL CLOSED!
  return {
    verification: 'unknown',
    connected: false,
    statusMap,
    errorCode: 'UNEXPECTED_CLI_FAILURE',
    errorMessage:
      stderr.trim() || stdout.trim() || 'Prisma CLI exited unexpectedly with unknown status.',
  }
}

export async function runPrismaMigrateStatus(
  cwd: string,
  schemaPath: string,
): Promise<MigrationStatusResult> {
  try {
    await execPrisma(cwd, ['migrate', 'status', '--schema', schemaPath], {
      timeout: 30_000,
    })
    // Exit 0: All applied
    return {
      verification: 'verified',
      connected: true,
      statusMap: new Map(),
    }
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message?: string }
    const stdout = error.stdout ?? ''
    const stderr = error.stderr ?? ''
    logger.debug({ stdout, stderr }, 'prisma migrate status returned non-zero')
    return parseStatusOutput(stdout, stderr)
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
