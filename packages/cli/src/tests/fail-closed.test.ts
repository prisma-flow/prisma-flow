import type { DriftDetectionStatus, MigrationVerificationStatus } from '@prisma-flow/shared'
import { describe, expect, it } from 'vitest'
import { parseStatusOutput } from '../core/adapters/base-adapter.js'
import { evaluateDeploymentReadiness } from '../core/readiness.js'

describe('Fail-Closed Verification Semantics (UNKNOWN != SAFE)', () => {
  describe('parseStatusOutput()', () => {
    it('classifies P1001 database reachability error as connected=false, verification=error', () => {
      const stderr = "Error: P1001: Can't reach database server at `localhost:5432`"
      const res = parseStatusOutput('', stderr)

      expect(res.connected).toBe(false)
      expect(res.verification).toBe('error')
      expect(res.errorCode).toBe('DATABASE_UNREACHABLE')
    })

    it('classifies P1000 authentication error as connected=false, verification=error', () => {
      const stderr =
        'Error: P1000: Authentication failed against database server at `localhost:5432`'
      const res = parseStatusOutput('', stderr)

      expect(res.connected).toBe(false)
      expect(res.verification).toBe('error')
      expect(res.errorCode).toBe('AUTHENTICATION_FAILED')
    })

    it('classifies P1012 schema validation error as verification=error', () => {
      const stderr = 'Error: P1012: Schema validation error - missing type on field'
      const res = parseStatusOutput('', stderr)

      expect(res.connected).toBe(false)
      expect(res.verification).toBe('error')
      expect(res.errorCode).toBe('MALFORMED_SCHEMA')
    })

    it('classifies unclassified / unexpected CLI failure as verification=unknown (FAIL CLOSED)', () => {
      const stderr = 'Segmentation fault (core dumped)'
      const res = parseStatusOutput('', stderr)

      expect(res.connected).toBe(false)
      expect(res.verification).toBe('unknown')
      expect(res.errorCode).toBe('UNEXPECTED_CLI_FAILURE')
      expect(res.statusMap.size).toBe(0)
    })

    it('correctly parses pending migrations when output contains pending section', () => {
      const stdout = [
        'Following migrations have not yet been applied:',
        '20260701000000_init',
        '20260702000000_add_users',
      ].join('\n')
      const res = parseStatusOutput(stdout, '')

      expect(res.connected).toBe(true)
      expect(res.verification).toBe('verified')
      expect(res.statusMap.get('20260701000000_init')).toBe('pending')
      expect(res.statusMap.get('20260702000000_add_users')).toBe('pending')
    })

    it('correctly parses failed migrations when output contains failed section', () => {
      const stdout = ['The following migration(s) failed to apply:', '20260701000000_broken'].join(
        '\n',
      )
      const res = parseStatusOutput(stdout, '')

      expect(res.connected).toBe(true)
      expect(res.verification).toBe('verified')
      expect(res.statusMap.get('20260701000000_broken')).toBe('failed')
    })
  })

  describe('evaluateDeploymentReadiness()', () => {
    const baseInput = {
      connected: true,
      migrationVerification: 'verified' as MigrationVerificationStatus,
      migrationsApplied: 3,
      migrationsPending: 0,
      migrationsFailed: 0,
      migrationsUnknown: 0,
      driftStatus: 'clean' as DriftDetectionStatus,
      driftCount: 0,
      maxRiskScore: 0,
      hasCriticalRisk: false,
    }

    it('returns READY when all checks pass on a verified clean database', () => {
      const readiness = evaluateDeploymentReadiness(baseInput)
      expect(readiness.status).toBe('ready')
      expect(readiness.score).toBe(100)
      expect(readiness.checks.every((c) => c.passed)).toBe(true)
    })

    it('blocks deployment when database is unreachable', () => {
      const readiness = evaluateDeploymentReadiness({
        ...baseInput,
        connected: false,
        migrationVerification: 'error',
        errorMessage: 'Database unreachable',
      })

      expect(readiness.status).toBe('blocked')
      expect(readiness.score).toBe(0)
      const dbCheck = readiness.checks.find((c) => c.id === 'database')
      expect(dbCheck?.passed).toBe(false)
    })

    it('blocks deployment when migration verification is unknown', () => {
      const readiness = evaluateDeploymentReadiness({
        ...baseInput,
        migrationVerification: 'unknown',
        migrationsUnknown: 2,
      })

      expect(readiness.status).toBe('blocked')
      const verCheck = readiness.checks.find((c) => c.id === 'migration-verification')
      expect(verCheck?.passed).toBe(false)
    })

    it('blocks deployment when drift detection fails with an error', () => {
      const readiness = evaluateDeploymentReadiness({
        ...baseInput,
        driftStatus: 'error',
      })

      expect(readiness.status).toBe('blocked')
      const driftCheck = readiness.checks.find((c) => c.id === 'drift')
      expect(driftCheck?.passed).toBe(false)
    })

    it('blocks deployment when schema drift is detected', () => {
      const readiness = evaluateDeploymentReadiness({
        ...baseInput,
        driftStatus: 'drifted',
        driftCount: 2,
      })

      expect(readiness.status).toBe('blocked')
      const driftCheck = readiness.checks.find((c) => c.id === 'drift')
      expect(driftCheck?.passed).toBe(false)
    })

    it('blocks deployment when failed migrations exist', () => {
      const readiness = evaluateDeploymentReadiness({
        ...baseInput,
        migrationsFailed: 1,
      })

      expect(readiness.status).toBe('blocked')
      const failedCheck = readiness.checks.find((c) => c.id === 'failed-migrations')
      expect(failedCheck?.passed).toBe(false)
    })

    it('blocks deployment when critical risk operations are present', () => {
      const readiness = evaluateDeploymentReadiness({
        ...baseInput,
        hasCriticalRisk: true,
        maxRiskScore: 85,
      })

      expect(readiness.status).toBe('blocked')
      const riskCheck = readiness.checks.find((c) => c.id === 'critical-risks')
      expect(riskCheck?.passed).toBe(false)
    })

    it('returns ATTENTION (not blocked, not ready) when only pending migrations exist', () => {
      const readiness = evaluateDeploymentReadiness({
        ...baseInput,
        migrationsPending: 2,
      })

      expect(readiness.status).toBe('attention')
      expect(readiness.checks.find((c) => c.id === 'pending-migrations')?.passed).toBe(false)
      expect(readiness.checks.find((c) => c.id === 'database')?.passed).toBe(true)
    })
  })
})
