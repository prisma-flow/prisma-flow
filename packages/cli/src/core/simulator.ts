/**
 * Migration Simulator — dry-runs SQL statements in a temporary shadow database
 * or parses them statically to predict risk factors without mutating production data.
 *
 * Safety & Trust Model:
 *  - Executed verification is currently supported for SQLite via shadow database replication.
 *  - For PostgreSQL, MySQL, and other providers, or when shadow execution cannot run,
 *    static analysis is performed.
 *  - STATIC ANALYSIS NEVER CLAIMS "SUCCESS" OR THAT A MIGRATION "WOULD SUCCEED".
 *    Static analysis has outcome 'unknown' and verification 'static-analysis'.
 */

import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import type {
  DatabaseProvider,
  SimulationResult,
  SimulationStatement,
  SimulationStatementType,
} from '@prisma-flow/shared'
import { SimulationError } from '@prisma-flow/shared'

const execAsync = promisify(execFile)

// ─────────────────────────────────────────────────────────────────────────────
// Static analysis helpers
// ─────────────────────────────────────────────────────────────────────────────

const DESTRUCTIVE_PATTERNS: Array<{ pattern: RegExp; warning: string }> = [
  {
    pattern: /drop\s+table/i,
    warning: 'Drops a table — all data will be lost',
  },
  {
    pattern: /truncate\s+table|truncate\s+\w+/i,
    warning: 'Truncates a table — all rows will be deleted',
  },
  {
    pattern: /drop\s+column/i,
    warning: 'Drops a column — data in that column will be lost',
  },
  {
    pattern: /alter\s+column.*not\s+null|alter\s+table.*add\s+column.*not\s+null/i,
    warning: 'Adds NOT NULL constraint — will fail if existing rows have NULLs',
  },
  { pattern: /delete\s+from/i, warning: 'Deletes rows — data will be lost' },
  {
    pattern: /drop\s+index/i,
    warning: 'Drops an index — query performance may degrade',
  },
  {
    pattern: /drop\s+constraint/i,
    warning: 'Drops a constraint — data integrity may be affected',
  },
]

const DDL_TYPES: Array<{ pattern: RegExp; type: SimulationStatementType }> = [
  { pattern: /^\s*create\s+table/i, type: 'CREATE_TABLE' },
  { pattern: /^\s*alter\s+table/i, type: 'ALTER_TABLE' },
  { pattern: /^\s*drop\s+table/i, type: 'DROP_TABLE' },
  { pattern: /^\s*create\s+(unique\s+)?index/i, type: 'CREATE_INDEX' },
  { pattern: /^\s*drop\s+index/i, type: 'DROP_INDEX' },
  { pattern: /^\s*insert\s+into/i, type: 'INSERT' },
  { pattern: /^\s*update\s+/i, type: 'UPDATE' },
  { pattern: /^\s*delete\s+from/i, type: 'DELETE' },
  { pattern: /^\s*truncate/i, type: 'TRUNCATE' },
]

function classifyStatement(sql: string): SimulationStatementType {
  for (const { pattern, type } of DDL_TYPES) {
    if (pattern.test(sql)) return type
  }
  return 'OTHER'
}

function estimateRowsAffected(sql: string): number | undefined {
  if (/delete\s+from.*where/i.test(sql)) return undefined
  if (/delete\s+from\s+\w+\s*;?\s*$/i.test(sql)) return Number.POSITIVE_INFINITY
  if (/truncate/i.test(sql)) return Number.POSITIVE_INFINITY
  return undefined
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Split a SQL migration file into individual statements.
 * Handles standard semicolon delimiters and skips comment-only blocks.
 */
export function splitStatements(sql: string): string[] {
  const withoutComments = sql
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n')

  return withoutComments
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * Statically analyse a list of SQL statements and return a SimulationResult.
 * Does not execute SQL.
 * Canonical verification: 'static-analysis'
 * Canonical outcome: 'unknown' (NEVER 'success')
 */
export function analyseStatically(migrationName: string, statements: string[]): SimulationResult {
  const parsed: SimulationStatement[] = statements.map((sql, index) => {
    const warnings: string[] = []
    for (const { pattern, warning } of DESTRUCTIVE_PATTERNS) {
      if (pattern.test(sql)) warnings.push(warning)
    }

    const rowsEst = estimateRowsAffected(sql)
    return {
      index,
      sql,
      type: classifyStatement(sql),
      isDestructive: warnings.length > 0,
      warnings,
      ...(rowsEst !== undefined ? { estimatedRowsAffected: rowsEst } : {}),
    }
  })

  const destructive = parsed.filter((s) => s.isDestructive)
  const allWarnings = destructive.flatMap((s) => s.warnings)

  return {
    migrationName,
    verification: 'static-analysis',
    outcome: 'unknown',
    statements: parsed,
    destructiveStatements: destructive.length,
    warnings: allWarnings,
    simulatedAt: new Date().toISOString(),
    mode: 'static',
  }
}

/**
 * Simulate a migration against a SQLite shadow copy.
 * Returns verification: 'executed' with outcome 'success' or 'failure'.
 * Falls back to static analysis if shadow database setup or sqlite3 CLI is unavailable.
 */
export async function simulateSqlite(
  migrationName: string,
  sqlFilePath: string,
  dbFilePath: string,
): Promise<SimulationResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prismaflow-sim-'))
  const shadowDb = path.join(tmpDir, 'shadow.db')

  try {
    await fs.copyFile(dbFilePath, shadowDb)

    const sql = await fs.readFile(sqlFilePath, 'utf-8')
    const statements = splitStatements(sql)

    // Apply via sqlite3 CLI against the shadow copy
    try {
      const startTime = Date.now()
      await execAsync('sqlite3', [shadowDb, sql], { timeout: 30_000 })
      const durationMs = Date.now() - startTime

      const staticAnalysis = analyseStatically(migrationName, statements)
      return {
        ...staticAnalysis,
        verification: 'executed',
        outcome: 'success',
        mode: 'shadow',
        statements: staticAnalysis.statements.map((stmt) => ({
          ...stmt,
          success: true,
          durationMs: Math.round(durationMs / Math.max(1, statements.length)),
        })),
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      const staticAnalysis = analyseStatically(migrationName, statements)
      const errorCode = (err as { code?: string }).code

      if (
        errorCode === 'ENOENT' ||
        error.message.includes('ENOENT') ||
        error.message.includes('not recognized')
      ) {
        return {
          ...staticAnalysis,
          verification: 'static-analysis',
          outcome: 'unknown',
          warnings: [
            ...staticAnalysis.warnings,
            'sqlite3 CLI is not installed; static analysis only — execution not verified.',
          ],
          mode: 'static',
        }
      }

      return {
        ...staticAnalysis,
        verification: 'executed',
        outcome: 'failure',
        error: error.message,
        mode: 'shadow',
      }
    }
  } catch {
    // DB copy failed — fallback to static analysis
    const sql = await fs.readFile(sqlFilePath, 'utf-8').catch(() => '')
    const staticAnalysis = analyseStatically(migrationName, splitStatements(sql))
    return {
      ...staticAnalysis,
      warnings: [
        ...staticAnalysis.warnings,
        'Shadow database setup failed; static analysis only — execution not verified.',
      ],
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

function isLoopbackDatabaseUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
  } catch {
    return false
  }
}

/** Execute SQL only on an explicitly supplied, loopback-only PostgreSQL shadow target. */
export async function simulatePostgres(
  migrationName: string,
  sqlFilePath: string,
  shadowDatabaseUrl: string,
  primaryDatabaseUrl?: string,
): Promise<SimulationResult> {
  const sql = await fs.readFile(sqlFilePath, 'utf-8')
  const staticAnalysis = analyseStatically(migrationName, splitStatements(sql))
  if (!isLoopbackDatabaseUrl(shadowDatabaseUrl) || shadowDatabaseUrl === primaryDatabaseUrl) {
    return {
      ...staticAnalysis,
      verification: 'not-verified',
      warnings: [
        ...staticAnalysis.warnings,
        'PostgreSQL execution requires a distinct loopback PRISMAFLOW_SHADOW_DATABASE_URL.',
      ],
    }
  }
  try {
    await execAsync('psql', [shadowDatabaseUrl, '-v', 'ON_ERROR_STOP=1', '-f', sqlFilePath], {
      timeout: 30_000,
    })
    return {
      ...staticAnalysis,
      verification: 'executed',
      outcome: 'success',
      mode: 'shadow',
      statements: staticAnalysis.statements.map((statement) => ({ ...statement, success: true })),
    }
  } catch (error: unknown) {
    return {
      ...staticAnalysis,
      verification: 'executed',
      outcome: 'failure',
      error: error instanceof Error ? error.message : String(error),
      mode: 'shadow',
    }
  }
}

/**
 * High-level simulate function — picks strategy based on provider and environment.
 */
export async function simulate(
  migrationName: string,
  sqlFilePath: string,
  dbFilePath?: string,
  provider?: DatabaseProvider | null,
  shadowDatabaseUrl = process.env.PRISMAFLOW_SHADOW_DATABASE_URL,
  primaryDatabaseUrl?: string,
): Promise<SimulationResult> {
  try {
    const sql = await fs.readFile(sqlFilePath, 'utf-8')
    const statements = splitStatements(sql)

    if (provider === 'sqlite' && dbFilePath && dbFilePath !== ':memory:') {
      try {
        await fs.access(dbFilePath)
        return await simulateSqlite(migrationName, sqlFilePath, dbFilePath)
      } catch {
        // SQLite DB file inaccessible — fall back to static analysis
      }
    }

    if (provider === 'postgresql' && shadowDatabaseUrl) {
      return simulatePostgres(migrationName, sqlFilePath, shadowDatabaseUrl, primaryDatabaseUrl)
    }

    const staticResult = analyseStatically(migrationName, statements)

    if (provider && provider !== 'sqlite') {
      return {
        ...staticResult,
        warnings: [
          ...staticResult.warnings,
          `Shadow execution is not configured for provider "${provider}"; static analysis only — execution not verified.`,
        ],
      }
    }

    return staticResult
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    throw new SimulationError(migrationName, error)
  }
}
