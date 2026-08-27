import type { DriftDetectionStatus, DriftItem, DriftType } from '@prisma-flow/shared'
import { getPrismaAdapter } from './adapters/index.js'
import { detectPrismaProject } from './prisma-detector.js'

export type { DriftItem, DriftType }

export interface DriftDetectionResult {
  items: DriftItem[]
  status: DriftDetectionStatus
  errorMessage?: string
}

export function classifyDriftSql(sql: string): DriftType {
  const upper = sql.toUpperCase().trimStart()
  if (upper.startsWith('CREATE TABLE')) return 'table-missing'
  if (upper.startsWith('DROP TABLE')) return 'table-extra'
  if (
    upper.startsWith('CREATE INDEX') ||
    upper.startsWith('CREATE UNIQUE INDEX') ||
    upper.startsWith('DROP INDEX')
  ) {
    return 'index-change'
  }
  if (upper.startsWith('ALTER INDEX')) return 'index-change'
  if (upper.includes('CONSTRAINT')) return 'constraint-change'
  if (upper.startsWith('ALTER TABLE')) return 'column-mismatch'
  return 'unknown'
}

/**
 * Parse SQL diff output into individual statements, correctly handling
 * semicolons inside string literals and line/block comments.
 */
export function parseSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let inSingleQuote = false
  let inLineComment = false
  let inBlockComment = false
  let i = 0

  while (i < sql.length) {
    // biome-ignore lint/style/noNonNullAssertion: guaranteed by loop condition
    const ch = sql[i]!
    const next = sql[i + 1] ?? ''

    if (inLineComment) {
      if (ch === '\n') inLineComment = false
      i++
      continue
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false
        i += 2
      } else i++
      continue
    }
    if (!inSingleQuote && ch === '-' && next === '-') {
      inLineComment = true
      i += 2
      continue
    }
    if (!inSingleQuote && ch === '/' && next === '*') {
      inBlockComment = true
      i += 2
      continue
    }
    if (ch === "'" && !inBlockComment && !inLineComment) inSingleQuote = !inSingleQuote

    if (ch === ';' && !inSingleQuote) {
      const trimmed = current.trim()
      if (trimmed.length > 0) statements.push(trimmed)
      current = ''
      i++
      continue
    }
    current += ch
    i++
  }

  const trimmed = current.trim()
  if (trimmed.length > 0) statements.push(trimmed)
  return statements
}

/**
 * Detect schema drift by comparing the local Prisma schema model against the
 * live database datasource using the appropriate Prisma version adapter.
 */
export async function detectDrift(cwd: string): Promise<DriftDetectionResult> {
  const project = await detectPrismaProject(cwd)
  if (!project) {
    return {
      items: [],
      status: 'error',
      errorMessage: 'No Prisma project found',
    }
  }

  const adapter = getPrismaAdapter(project.prismaVersion)
  return adapter.detectDrift(cwd, project.schemaPath, project.databaseUrl, project.provider)
}
