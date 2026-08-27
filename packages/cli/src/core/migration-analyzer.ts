import fs from 'node:fs/promises'
import type {
  MigrationRiskScore,
  MigrationStatus,
  ProjectStatus,
  RiskFactor,
  RiskLevel,
} from '@prisma-flow/shared'
import { getPrismaAdapter } from './adapters/index.js'
import { type DriftDetectionResult, detectDrift } from './drift-detector.js'
import { type Migration, detectPrismaProject } from './prisma-detector.js'
import { evaluateDeploymentReadiness } from './readiness.js'

export type { DriftDetectionResult }

// ─── Heuristic Migration Risk Engine ─────────────────────────────────────────

interface RiskPattern {
  pattern: RegExp
  label: string
  severity: RiskLevel
  description: string
  recommendation: string
  weight: number
}

const RISK_PATTERNS: RiskPattern[] = [
  {
    pattern: /DROP\s+TABLE/i,
    label: 'Drops table — irreversible data loss',
    severity: 'critical',
    description: 'Drops an entire table and all its data permanently.',
    recommendation: 'Ensure data has been migrated or backed up before applying.',
    weight: 75,
  },
  {
    pattern: /TRUNCATE\s+TABLE|TRUNCATE\s+\w+/i,
    label: 'Truncates table — full data loss',
    severity: 'critical',
    description: 'Removes all rows from a table. Cannot be rolled back with standard SQL.',
    recommendation: 'Export table data before applying this migration.',
    weight: 65,
  },
  {
    pattern: /DROP\s+COLUMN/i,
    label: 'Drops column — potential data loss',
    severity: 'critical',
    description: 'Removes a column and all data stored in it.',
    recommendation: 'Verify no application code reads this column before deploying.',
    weight: 60,
  },
  {
    pattern: /ALTER\s+COLUMN.+NOT\s+NULL|ALTER\s+TABLE.+ADD\s+COLUMN.+NOT\s+NULL/i,
    label: 'Adds NOT NULL constraint',
    severity: 'high',
    description: 'Adding a NOT NULL constraint will fail if any existing rows have NULL values.',
    recommendation: 'Backfill NULL values before adding the constraint.',
    weight: 25,
  },
  {
    pattern: /ALTER\s+TABLE.+TYPE|ALTER\s+COLUMN.+TYPE/i,
    label: 'Changes column type',
    severity: 'high',
    description: 'Changing a column type can cause data loss or conversion failures.',
    recommendation: 'Test type conversion on a staging database first.',
    weight: 25,
  },
  {
    pattern: /DELETE\s+FROM/i,
    label: 'Bulk data deletion',
    severity: 'medium',
    description: 'Deletes rows from a table. Scope depends on the WHERE clause.',
    recommendation: 'Review the WHERE clause carefully and test on staging first.',
    weight: 20,
  },
  {
    pattern: /DROP\s+CONSTRAINT/i,
    label: 'Removes constraint — may allow invalid data',
    severity: 'medium',
    description: 'Removing a constraint allows data that was previously rejected.',
    recommendation: 'Audit existing data for constraint violations after applying.',
    weight: 15,
  },
  {
    pattern: /DROP\s+INDEX/i,
    label: 'Removes index — may impact performance',
    severity: 'low',
    description: 'Dropping an index can degrade query performance on the affected table.',
    recommendation: 'Monitor query performance after applying in production.',
    weight: 10,
  },
  {
    pattern: /ALTER\s+TABLE/i,
    label: 'Alters table structure',
    severity: 'low',
    description: 'Modifies table structure. Long-running on large tables.',
    recommendation: 'Consider table size and run during low-traffic windows.',
    weight: 8,
  },
]

/** Extract a table name from a SQL statement (best-effort heuristic). */
function extractTableName(sql: string): string | undefined {
  const match = sql.match(/(?:DROP|TRUNCATE|ALTER)\s+TABLE\s+(?:"?(\w+)"?\.)?"?(\w+)"?/i)
  return match?.[2]
}

export function analyzeMigrationRisks(sql: string): string[] {
  return RISK_PATTERNS.filter(({ pattern }) => pattern.test(sql)).map(({ label }) => label)
}

export function scoreMigrationRisk(sql: string): MigrationRiskScore {
  const matchedPatterns = RISK_PATTERNS.filter(({ pattern }) => pattern.test(sql))

  const factors: RiskFactor[] = matchedPatterns.map((p) => {
    const affectedTable = extractTableName(sql)
    return {
      pattern: p.pattern.source,
      severity: p.severity,
      description: p.description,
      ...(affectedTable !== undefined ? { affectedTable } : {}),
      recommendation: p.recommendation,
    }
  })

  const rawScore = matchedPatterns.reduce((acc, p) => acc + p.weight, 0)
  const score = Math.min(100, rawScore)

  const hasCriticalFactor = matchedPatterns.some((pattern) => pattern.severity === 'critical')

  let level: RiskLevel = 'low'
  if (hasCriticalFactor || score >= 75) level = 'critical'
  else if (score >= 50) level = 'high'
  else if (score >= 20) level = 'medium'

  return { score, level, factors }
}

// ─── Public Migration and Status APIs ────────────────────────────────────────

export async function getMigrationDetails(cwd: string, name: string) {
  const project = await detectPrismaProject(cwd)
  if (!project) return null

  const migration = project.migrations.find((m) => m.name === name)
  if (!migration) return null

  let sql = ''
  try {
    sql = await fs.readFile(migration.sqlPath, 'utf-8')
  } catch {
    sql = '-- Could not read migration file'
  }

  const risks = analyzeMigrationRisks(sql)
  const riskScore = scoreMigrationRisk(sql)

  return { ...migration, sql, risks, riskScore }
}

export async function getMigrations(
  cwd: string,
): Promise<(Migration & { risks: string[]; riskScore: MigrationRiskScore })[]> {
  const project = await detectPrismaProject(cwd)
  if (!project) return []

  const adapter = getPrismaAdapter(project.prismaVersion)
  const statusResult = await adapter.getMigrationStatus(project.projectRoot, project.schemaPath)

  return Promise.all(
    project.migrations.map(async (m) => {
      let status: MigrationStatus = 'unknown'
      if (statusResult.verification === 'verified') {
        status = statusResult.statusMap.get(m.name) ?? 'applied'
      } else {
        status = statusResult.statusMap.get(m.name) ?? 'unknown'
      }

      let sql = ''
      try {
        sql = await fs.readFile(m.sqlPath, 'utf-8')
      } catch {
        /* ignore missing SQL read */
      }
      const risks = analyzeMigrationRisks(sql)
      const riskScore = scoreMigrationRisk(sql)
      return { ...m, status, risks, riskScore }
    }),
  )
}

export async function getProjectStatus(cwd: string): Promise<ProjectStatus> {
  const project = await detectPrismaProject(cwd)
  if (!project) throw new Error('No Prisma project found')

  const adapter = getPrismaAdapter(project.prismaVersion)
  const statusResult = await adapter.getMigrationStatus(project.projectRoot, project.schemaPath)

  const migrations = await getMigrations(cwd)
  const migrationsPending = migrations.filter((m) => m.status === 'pending').length
  const migrationsFailed = migrations.filter((m) => m.status === 'failed').length
  const migrationsUnknown = migrations.filter((m) => m.status === 'unknown').length
  const migrationsApplied = migrations.filter((m) => m.status === 'applied').length

  // Drift check: only run when database is verified connected with no pending migrations
  let driftResult: DriftDetectionResult = { items: [], status: 'not_checked' }
  if (
    statusResult.connected &&
    statusResult.verification === 'verified' &&
    migrationsPending === 0
  ) {
    driftResult = await detectDrift(project.projectRoot)
  }

  const hasDrift = driftResult.status === 'drifted'

  // Heuristic risk level calculation
  let riskLevel: RiskLevel = 'low'
  if (migrationsFailed > 0 || statusResult.verification === 'error') riskLevel = 'high'
  else if (hasDrift || statusResult.verification === 'unknown') riskLevel = 'medium'
  else if (migrationsPending > 0) riskLevel = 'low'

  const maxRiskScore = Math.max(0, ...migrations.map((m) => m.riskScore.score))
  const hasCriticalRisk = migrations.some(
    (m) =>
      m.riskScore.level === 'critical' ||
      m.riskScore.factors.some((factor) => factor.severity === 'critical'),
  )

  if (hasCriticalRisk || maxRiskScore >= 75) riskLevel = 'critical'
  else if (maxRiskScore >= 50) riskLevel = 'high'
  else if (maxRiskScore >= 20 && riskLevel === 'low') riskLevel = 'medium'

  const deploymentReadiness = evaluateDeploymentReadiness({
    connected: statusResult.connected,
    migrationVerification: statusResult.verification,
    migrationsApplied,
    migrationsPending,
    migrationsFailed,
    migrationsUnknown,
    driftStatus: driftResult.status,
    driftCount: driftResult.items.length,
    maxRiskScore,
    hasCriticalRisk,
    errorMessage: statusResult.errorMessage ?? driftResult.errorMessage,
  })

  return {
    connected: statusResult.connected,
    migrationVerification: statusResult.verification,
    // Never relabel unverified local files as pending. A database that could not
    // be queried is unknown, not evidence that every migration is outstanding.
    migrationsApplied: statusResult.verification === 'verified' ? migrationsApplied : 0,
    migrationsPending: statusResult.verification === 'verified' ? migrationsPending : 0,
    migrationsFailed,
    migrationsUnknown,
    driftDetected: hasDrift,
    driftCount: driftResult.items.length,
    driftStatus: driftResult.status,
    riskLevel,
    healthScore: deploymentReadiness.score,
    deploymentReadiness,
    lastSync: new Date().toISOString(),
    ...(project.provider ? { provider: project.provider } : {}),
    projectName: 'prisma-project',
    schemaPath: project.schemaPath,
    migrationsPath: project.migrationsPath,
    ...(project.prismaVersion ? { prismaVersion: project.prismaVersion } : {}),
    ...(project.packageManager ? { packageManager: project.packageManager } : {}),
    hasDatabaseUrl: project.databaseUrl.length > 0,
  }
}
