import type { DriftItem } from '@prisma-flow/shared'
import { describe, expect, it } from 'vitest'
import { buildDriftRepairPlan, generateRepairSuggestions } from '../core/drift-recovery.js'

describe('Drift Recovery (Issue #34: Plan-Only V1)', () => {
  const driftItems: DriftItem[] = [
    {
      sql: 'CREATE TABLE "User" (id INT);',
      type: 'table-missing',
      description: 'Table missing in database',
    },
    {
      sql: 'DROP TABLE "Legacy";',
      type: 'table-extra',
      description: 'Table exists in database but not in schema',
    },
    {
      sql: '',
      type: 'missing_migration',
      migrationName: '20260701000000_missing',
      description: 'Migration applied to DB but missing from history',
    },
  ]

  it('generates recovery suggestions marked strictly automated=false (manual only)', () => {
    const suggestions = generateRepairSuggestions(driftItems)

    expect(suggestions).toHaveLength(3)
    expect(suggestions.every((s) => s.automated === false)).toBe(true)
  })

  it('describes history reconciliation without claiming to run SQL', () => {
    const suggestions = generateRepairSuggestions([
      {
        sql: '',
        type: 'missing_migration',
        migrationName: '20260701000000_missing',
        description: 'Migration history divergence',
      },
    ])

    const historySuggestion = suggestions[0]
    expect(historySuggestion?.strategy).toBe('reconcile_history')
    expect(historySuggestion?.description).toContain('does NOT execute migration SQL')
    expect(
      historySuggestion?.warnings.some((w) => w.includes('does NOT execute migration SQL')),
    ).toBe(true)
  })

  it('builds a DriftRepairPlan with isMutatingDisabled=true', () => {
    const plan = buildDriftRepairPlan(driftItems)

    expect(plan.isMutatingDisabled).toBe(true)
    expect(plan.driftCount).toBe(3)
    expect(plan.suggestions).toHaveLength(3)
  })
})
