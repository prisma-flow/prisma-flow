import {
  DeploymentPlanSchema,
  DriftRepairPlanSchema,
  MigrationSchema,
  ProjectStatusSchema,
  SchemaDatamodelSchema,
  SimulationResultSchema,
} from '@prisma-flow/shared'
import { describe, expect, it } from 'vitest'

describe('Canonical Domain Schemas & Contracts (Issue #36)', () => {
  it('validates canonical MigrationSchema with all status states including unknown', () => {
    const valid = {
      name: '20260701000000_init',
      timestamp: '2026-07-01T00:00:00.000Z',
      status: 'unknown',
      sqlPath: '/project/prisma/migrations/20260701000000_init/migration.sql',
    }
    expect(MigrationSchema.parse(valid)).toEqual(valid)
  })

  it('rejects invalid migration status values', () => {
    const invalid = {
      name: '20260701000000_init',
      timestamp: '2026-07-01T00:00:00.000Z',
      status: 'in_progress', // invalid
      sqlPath: '/path',
    }
    expect(() => MigrationSchema.parse(invalid)).toThrow()
  })

  it('validates SimulationResultSchema with verification and outcome distinctions', () => {
    const staticResult = {
      migrationName: '20260701000000_drop_table',
      verification: 'static-analysis',
      outcome: 'unknown',
      statements: [
        {
          index: 0,
          sql: 'DROP TABLE "Users"',
          type: 'DROP_TABLE',
          isDestructive: true,
          warnings: ['Drops a table — all data will be lost'],
        },
      ],
      destructiveStatements: 1,
      warnings: ['Drops a table — all data will be lost'],
      simulatedAt: '2026-07-01T00:00:00.000Z',
    }
    const parsed = SimulationResultSchema.parse(staticResult)
    expect(parsed.verification).toBe('static-analysis')
    expect(parsed.outcome).toBe('unknown')
  })

  it('validates DriftRepairPlanSchema enforcing plan-only guarantees', () => {
    const plan = {
      generatedAt: '2026-07-01T00:00:00.000Z',
      driftCount: 1,
      suggestions: [
        {
          driftItem: {
            sql: 'DROP TABLE "Legacy"',
            type: 'table-extra',
            description: 'Extra table in database',
          },
          strategy: 'manual_migration',
          description: 'Author a new migration',
          automated: false,
          risk: 'medium',
          warnings: [],
        },
      ],
      isMutatingDisabled: true,
    }
    const parsed = DriftRepairPlanSchema.parse(plan)
    expect(parsed.isMutatingDisabled).toBe(true)
    expect(parsed.suggestions[0]?.automated).toBe(false)
  })

  it('validates ProjectStatusSchema including migrationVerification field', () => {
    const status = {
      connected: true,
      migrationVerification: 'verified',
      migrationsApplied: 5,
      migrationsPending: 0,
      migrationsFailed: 0,
      migrationsUnknown: 0,
      driftDetected: false,
      driftCount: 0,
      driftStatus: 'clean',
      riskLevel: 'low',
      healthScore: 100,
      deploymentReadiness: {
        status: 'ready',
        score: 100,
        summary: 'Ready for deployment',
        checks: [
          {
            id: 'database',
            label: 'Database reachable',
            passed: true,
            message: 'Connected',
          },
        ],
      },
      lastSync: '2026-07-01T00:00:00.000Z',
    }
    const parsed = ProjectStatusSchema.parse(status)
    expect(parsed.migrationVerification).toBe('verified')
    expect(parsed.deploymentReadiness.status).toBe('ready')
  })

  it('validates DeploymentPlanSchema structure consumed by dashboard', () => {
    const planPayload = {
      schemaVersion: 'prismaflow-plan/v1' as const,
      generatedAt: '2026-07-01T00:00:00.000Z',
      decision: 'ready' as const,
      score: 100,
      summary: 'Deployment ready',
      project: {
        schemaPath: '/project/prisma/schema.prisma',
        migrationsPath: '/project/prisma/migrations',
        hasDatabaseUrl: true,
      },
      checks: [
        {
          id: 'database' as const,
          label: 'Database reachable',
          passed: true,
          message: 'Connected',
        },
      ],
      migrations: {
        total: 1,
        applied: 1,
        pending: 0,
        failed: 0,
        unknown: 0,
        verification: 'verified' as const,
        pendingNames: [],
        failedNames: [],
      },
      drift: {
        status: 'clean' as const,
        detected: false,
        count: 0,
      },
      actions: [],
      commands: [],
      valueHighlights: ['Safe deployment'],
    }
    const parsed = DeploymentPlanSchema.parse(planPayload)
    expect(parsed.decision).toBe('ready')
    expect(parsed.score).toBe(100)
  })

  it('validates SchemaDatamodelSchema consumed by Schema Explorer view', () => {
    const datamodel = {
      models: [
        {
          name: 'User',
          dbName: null,
          fields: [
            {
              name: 'id',
              type: 'Int',
              kind: 'scalar',
              isId: true,
              isRequired: true,
              isList: false,
              isUnique: false,
              hasDefaultValue: false,
            },
          ],
          primaryKey: null,
          uniqueFields: [],
          uniqueIndexes: [],
        },
      ],
      enums: [],
      types: [],
    }
    const parsed = SchemaDatamodelSchema.parse(datamodel)
    expect(parsed.models[0]?.name).toBe('User')
  })
})
