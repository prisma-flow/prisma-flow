import { describe, expect, it } from 'vitest'
import {
  Prisma7Adapter,
  Prisma8Adapter,
  PrismaLegacyAdapter,
  UnsupportedPrismaAdapter,
  getPrismaAdapter,
  parseDriftOutput,
  parseStatusOutput,
} from '../core/adapters/index.js'
import { evaluateDeploymentReadiness } from '../core/readiness.js'

describe('Prisma Compatibility Matrix & Scenarios (Issue #40, Blocker 1-4)', () => {
  // ─── Version Adapter Resolution & Capability Contracts ──────────────────────

  describe('Prisma Version Matrix', () => {
    it('Prisma 5 (Legacy) resolves to supported adapter', () => {
      const adapter = getPrismaAdapter('5.22.0')
      expect(adapter).toBeInstanceOf(PrismaLegacyAdapter)
      expect(adapter.generation).toBe('legacy')
      const caps = adapter.getCapabilities()
      expect(caps.isProductionSupported).toBe(true)
      expect(caps.isExperimental).toBe(false)
      expect(caps.supportsClassicMigrationSql).toBe(true)
      expect(caps.supportsStructuredMigrationPlan).toBe(false)
    })

    it('Prisma 6 (Legacy) resolves to supported adapter', () => {
      const adapter = getPrismaAdapter('^6.3.0')
      expect(adapter).toBeInstanceOf(PrismaLegacyAdapter)
      expect(adapter.generation).toBe('legacy')
      const caps = adapter.getCapabilities()
      expect(caps.isProductionSupported).toBe(true)
      expect(caps.isExperimental).toBe(false)
    })

    it('Prisma 7 resolves to supported adapter with drift support', () => {
      const adapter = getPrismaAdapter('^7.0.1')
      expect(adapter).toBeInstanceOf(Prisma7Adapter)
      expect(adapter.generation).toBe('prisma7')
      const caps = adapter.getCapabilities()
      expect(caps.isProductionSupported).toBe(true)
      expect(caps.isExperimental).toBe(false)
      expect(caps.supportsDrift).toBe(true)
    })

    it('Prisma 8 is explicitly marked experimental & not supported for readiness', () => {
      const adapter = getPrismaAdapter('8.0.0-alpha.1')
      expect(adapter).toBeInstanceOf(Prisma8Adapter)
      expect(adapter.generation).toBe('prisma8')
      const caps = adapter.getCapabilities()
      expect(caps.isProductionSupported).toBe(false)
      expect(caps.isExperimental).toBe(true)
      expect(caps.supportsContractModel).toBe(false)
      expect(caps.supportsStructuredMigrationPlan).toBe(false)
    })

    it('Unsupported Prisma versions (e.g. 4.x, 9.x, null, invalid string) fail closed', () => {
      const unsupp1 = getPrismaAdapter('4.16.2')
      expect(unsupp1).toBeInstanceOf(UnsupportedPrismaAdapter)

      const unsupp2 = getPrismaAdapter('9.0.0')
      expect(unsupp2).toBeInstanceOf(UnsupportedPrismaAdapter)

      const unsupp3 = getPrismaAdapter(null)
      expect(unsupp3).toBeInstanceOf(UnsupportedPrismaAdapter)

      const unsupp4 = getPrismaAdapter('banana')
      expect(unsupp4).toBeInstanceOf(UnsupportedPrismaAdapter)
    })
  })

  // ─── Database Provider Diff Parsing ─────────────────────────────────────────

  describe('Database Provider SQL Diff Parsing', () => {
    it('handles SQLite drift and migration status parsing', () => {
      const sqliteSql = 'CREATE TABLE "Post" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT);'
      const items = parseDriftOutput(sqliteSql)
      expect(items.length).toBe(1)
      expect(items[0]?.type).toBe('table-missing')
    })

    it('handles PostgreSQL schema, table, index and constraint diffs', () => {
      const pgSql = [
        'CREATE TABLE "public"."users" ("id" serial PRIMARY KEY, "email" text NOT NULL);',
        'CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");',
        'ALTER TABLE "public"."posts" DROP COLUMN "legacy_meta";',
        'ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");',
      ].join('\n')

      const items = parseDriftOutput(pgSql)
      expect(items.length).toBe(4)
      expect(items[0]?.type).toBe('table-missing')
      expect(items[1]?.type).toBe('index-change')
      expect(items[2]?.type).toBe('column-mismatch')
      expect(items[3]?.type).toBe('constraint-change')
    })

    it('handles MySQL table, alter, and index diffs', () => {
      const mysqlSql = [
        'CREATE TABLE `User` (`id` INT NOT NULL AUTO_INCREMENT, `email` VARCHAR(191) NOT NULL, PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4;',
        'ALTER TABLE `User` ADD COLUMN `age` INT NULL;',
        'DROP TABLE `OldLogs`;',
      ].join('\n')

      const items = parseDriftOutput(mysqlSql)
      expect(items.length).toBe(3)
      expect(items[0]?.type).toBe('table-missing')
      expect(items[1]?.type).toBe('column-mismatch')
      expect(items[2]?.type).toBe('table-extra')
    })
  })

  // ─── Non-Zero False-Green Regression Tests (Blocker 4) ───────────────────────

  describe('Non-Zero Exit & Error Parsing Regression Tests (Blocker 4)', () => {
    it('Regression 1: stdout has "No pending migrations" but stderr has engine failure (non-zero exit) -> Fail Closed', () => {
      const stdout = 'No pending migrations'
      const stderr = 'Internal Prisma engine failure: query engine crashed'
      const status = parseStatusOutput(stdout, stderr, { isExitZero: false })

      expect(status.verification).toBe('unknown')
      expect(status.connected).toBe(false)
      expect(status.errorCode).toBe('UNEXPECTED_CLI_FAILURE')

      const readiness = evaluateDeploymentReadiness({
        connected: status.connected,
        migrationVerification: status.verification,
        migrationsApplied: 0,
        migrationsPending: 0,
        migrationsFailed: 0,
        migrationsUnknown: 1,
        driftStatus: 'not_checked',
        driftCount: 0,
        maxRiskScore: 0,
        hasCriticalRisk: false,
        errorMessage: status.errorMessage,
      })

      expect(readiness.status).toBe('blocked')
      expect(readiness.score).toBe(0)
    })

    it('Regression 2: stdout has "Database schema is up to date" but stderr has segmentation fault -> Fail Closed', () => {
      const stdout = 'Database schema is up to date'
      const stderr = 'Segmentation fault (core dumped)'
      const status = parseStatusOutput(stdout, stderr, { isExitZero: false })

      expect(status.verification).toBe('unknown')
      expect(status.connected).toBe(false)
      expect(status.errorCode).toBe('UNEXPECTED_CLI_FAILURE')

      const readiness = evaluateDeploymentReadiness({
        connected: status.connected,
        migrationVerification: status.verification,
        migrationsApplied: 0,
        migrationsPending: 0,
        migrationsFailed: 0,
        migrationsUnknown: 1,
        driftStatus: 'not_checked',
        driftCount: 0,
        maxRiskScore: 0,
        hasCriticalRisk: false,
        errorMessage: status.errorMessage,
      })

      expect(readiness.status).toBe('blocked')
      expect(readiness.score).toBe(0)
    })

    it('Regression 3: Known pending output on non-zero exit parses correctly as verified pending', () => {
      const stdout = [
        'The following migrations have not yet been applied:',
        '  20260101000000_add_users',
      ].join('\n')
      const stderr = ''
      const status = parseStatusOutput(stdout, stderr, { isExitZero: false })

      expect(status.verification).toBe('verified')
      expect(status.connected).toBe(true)
      expect(status.statusMap.get('20260101000000_add_users')).toBe('pending')
    })
  })

  // ─── Required Failure & Edge Case Scenarios ──────────────────────────────────

  describe('Scenario Matrix', () => {
    it('Scenario 1: Clean State (0 pending, 0 failed, clean drift, verified)', () => {
      const readiness = evaluateDeploymentReadiness({
        connected: true,
        migrationVerification: 'verified',
        migrationsApplied: 5,
        migrationsPending: 0,
        migrationsFailed: 0,
        migrationsUnknown: 0,
        driftStatus: 'clean',
        driftCount: 0,
        maxRiskScore: 10,
        hasCriticalRisk: false,
      })

      expect(readiness.status).toBe('ready')
      expect(readiness.score).toBe(100)
    })

    it('Scenario 2: Pending Migrations (blocks or cautions deployment)', () => {
      const readiness = evaluateDeploymentReadiness({
        connected: true,
        migrationVerification: 'verified',
        migrationsApplied: 4,
        migrationsPending: 2,
        migrationsFailed: 0,
        migrationsUnknown: 0,
        driftStatus: 'clean',
        driftCount: 0,
        maxRiskScore: 20,
        hasCriticalRisk: false,
      })

      expect(readiness.status).toBe('attention')
      expect(readiness.score).toBeLessThan(100)
    })

    it('Scenario 3: Schema Drift Detected (blocks deployment)', () => {
      const readiness = evaluateDeploymentReadiness({
        connected: true,
        migrationVerification: 'verified',
        migrationsApplied: 5,
        migrationsPending: 0,
        migrationsFailed: 0,
        migrationsUnknown: 0,
        driftStatus: 'drifted',
        driftCount: 2,
        maxRiskScore: 0,
        hasCriticalRisk: false,
      })

      expect(readiness.status).toBe('blocked')
      expect(readiness.summary).toMatch(/schema drift detected/i)
    })

    it('Scenario 4: Invalid Credentials (P1000 Authentication Failed) -> Fail Closed', () => {
      const stderr =
        'Error: P1000: Authentication failed against database server at `localhost:5432`'
      const status = parseStatusOutput('', stderr)
      expect(status.connected).toBe(false)
      expect(status.verification).toBe('error')
      expect(status.errorCode).toBe('AUTHENTICATION_FAILED')

      const readiness = evaluateDeploymentReadiness({
        connected: status.connected,
        migrationVerification: status.verification,
        migrationsApplied: 0,
        migrationsPending: 0,
        migrationsFailed: 0,
        migrationsUnknown: 0,
        driftStatus: 'not_checked',
        driftCount: 0,
        maxRiskScore: 0,
        hasCriticalRisk: false,
        errorMessage: status.errorMessage,
      })

      expect(readiness.status).toBe('blocked')
      expect(readiness.score).toBe(0)
    })

    it('Scenario 5: Malformed Schema (P1012 Validation Error) -> Fail Closed', () => {
      const stderr =
        'Error: P1012: Schema validation error: Field `email` is missing a type in model `User`.'
      const status = parseStatusOutput('', stderr)
      expect(status.connected).toBe(false)
      expect(status.verification).toBe('error')
      expect(status.errorCode).toBe('MALFORMED_SCHEMA')

      const readiness = evaluateDeploymentReadiness({
        connected: status.connected,
        migrationVerification: status.verification,
        migrationsApplied: 0,
        migrationsPending: 0,
        migrationsFailed: 0,
        migrationsUnknown: 0,
        driftStatus: 'not_checked',
        driftCount: 0,
        maxRiskScore: 0,
        hasCriticalRisk: false,
        errorMessage: status.errorMessage,
      })

      expect(readiness.status).toBe('blocked')
      expect(readiness.score).toBe(0)
    })

    it('Scenario 6: Database Unreachable (P1001 / Connection Refused) -> Fail Closed', () => {
      const stderr = "Error: P1001: Can't reach database server at `postgres:5432`"
      const status = parseStatusOutput('', stderr)
      expect(status.connected).toBe(false)
      expect(status.verification).toBe('error')
      expect(status.errorCode).toBe('DATABASE_UNREACHABLE')
    })

    it('Scenario 7: Modified / Unapplied Migration History -> Fail Closed', () => {
      const stdout = [
        'The database schema is not in sync with the migration history.',
        'The following migrations are recorded in the database but missing locally: 20260101000000_old',
      ].join('\n')

      const status = parseStatusOutput(stdout, '')
      expect(status.verification).toBe('unknown')

      const readiness = evaluateDeploymentReadiness({
        connected: status.connected,
        migrationVerification: status.verification,
        migrationsApplied: 0,
        migrationsPending: 0,
        migrationsFailed: 0,
        migrationsUnknown: 1,
        driftStatus: 'not_checked',
        driftCount: 0,
        maxRiskScore: 0,
        hasCriticalRisk: false,
      })

      expect(readiness.status).toBe('blocked')
    })

    it('Scenario 8: Unsupported Layout / Unknown CLI Exit -> Fail Closed', () => {
      const stderr = 'Unknown flag: --experimental-schema-layout'
      const status = parseStatusOutput('', stderr)
      expect(status.verification).toBe('unknown')
      expect(status.connected).toBe(false)
      expect(status.errorCode).toBe('UNEXPECTED_CLI_FAILURE')
    })
  })
})
