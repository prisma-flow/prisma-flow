import type {
  DriftItem,
  DriftRecoverySuggestion,
  DriftRepairPlan,
  DriftRepairStrategy,
  RiskLevel,
} from '@prisma-flow/shared'

// ─────────────────────────────────────────────────────────────────────────────
// Suggestion generation (Plan-Only)
// ─────────────────────────────────────────────────────────────────────────────

function pickStrategy(item: DriftItem): DriftRepairStrategy {
  switch (item.type) {
    case 'missing_migration':
    case 'modified_migration':
      return 'reconcile_history'
    case 'extra_table':
    case 'extra_column':
    case 'table-missing':
    case 'table-extra':
    case 'column-mismatch':
      return 'manual_migration'
    case 'index-change':
    case 'constraint-change':
      return 'manual_sql'
    default:
      return 'review_only'
  }
}

function describeStrategy(item: DriftItem, strategy: DriftRepairStrategy): string {
  const target = item.migrationName ?? item.identifier ?? 'detected change'
  switch (strategy) {
    case 'reconcile_history':
      return `Reconcile migration history record for "${target}". Note: this updates the _prisma_migrations table only and does NOT execute migration SQL.`
    case 'manual_migration':
      return `Author a new Prisma migration or update schema.prisma to reflect the "${target}" change.`
    case 'manual_sql':
      return `Review and apply manual SQL adjustments for "${target}" after verifying database constraints and indexes.`
    default:
      return `Manually inspect "${target}" — automated analysis cannot determine safe resolution.`
  }
}

function generateGuidanceSql(item: DriftItem, strategy: DriftRepairStrategy): string | undefined {
  if (strategy === 'reconcile_history' && item.migrationName) {
    return `-- Manual history reconciliation only (does NOT run SQL):\n-- npx prisma migrate resolve --applied "${item.migrationName}"`
  }

  if (
    strategy === 'manual_migration' &&
    (item.type === 'extra_table' || item.type === 'table-extra')
  ) {
    return `-- Extra table detected. To incorporate into Prisma schema:\n-- 1. Add model to prisma/schema.prisma\n-- 2. Run: npx prisma migrate dev --name sync_${item.identifier ?? 'table'}`
  }

  if (
    strategy === 'manual_migration' &&
    (item.type === 'extra_column' || item.type === 'column-mismatch')
  ) {
    return `-- Schema difference detected on ${item.identifier ?? 'column'}.\n-- Update prisma/schema.prisma and generate a migration with: npx prisma migrate dev`
  }

  if (item.sql) {
    return `-- Suggested SQL for operator review (do NOT apply without verification):\n${item.sql}`
  }

  return undefined
}

function assessRisk(item: DriftItem): RiskLevel {
  if (item.type === 'modified_migration' || item.type === 'table-missing') return 'high'
  if (item.type === 'extra_table' || item.type === 'column-mismatch') return 'medium'
  if (item.type === 'extra_column' || item.type === 'missing_migration') return 'medium'
  if (item.type === 'index-change') return 'low'
  return 'medium'
}

function generateWarnings(item: DriftItem, strategy: DriftRepairStrategy): string[] {
  const warnings: string[] = []

  if (strategy === 'reconcile_history') {
    warnings.push(
      'prisma migrate resolve only updates the migration record; it does NOT execute migration SQL statements on the database.',
    )
  }

  if (item.type === 'table-missing') {
    warnings.push(
      'The database is missing a table expected by Prisma schema. Queries may fail immediately.',
    )
  }

  if (item.type === 'modified_migration') {
    warnings.push(
      'Migration file contents differ from what was applied. Manual schema verification required.',
    )
  }

  return warnings
}

/**
 * Generate plan-only repair suggestions for a list of drift items.
 */
export function generateRepairSuggestions(
  driftItems: DriftItem[],
  _migrationsDir?: string,
): DriftRecoverySuggestion[] {
  const suggestions: DriftRecoverySuggestion[] = []

  for (const item of driftItems) {
    const strategy = pickStrategy(item)
    const sql = generateGuidanceSql(item, strategy)
    const warnings = generateWarnings(item, strategy)

    suggestions.push({
      driftItem: item,
      strategy,
      description: describeStrategy(item, strategy),
      ...(sql !== undefined ? { sql } : {}),
      automated: false,
      risk: assessRisk(item),
      warnings,
    })
  }

  return suggestions
}

/**
 * Build a complete, plan-only DriftRepairPlan.
 */
export function buildDriftRepairPlan(
  driftItems: DriftItem[],
  migrationsDir?: string,
): DriftRepairPlan {
  const suggestions = generateRepairSuggestions(driftItems, migrationsDir)
  return {
    generatedAt: new Date().toISOString(),
    driftCount: driftItems.length,
    suggestions,
    isMutatingDisabled: true,
  }
}
