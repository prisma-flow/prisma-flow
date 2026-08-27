import type {
  DeploymentReadiness,
  DeploymentReadinessCheck,
  DriftDetectionStatus,
  MigrationVerificationStatus,
} from '@prisma-flow/shared'

export interface ReadinessInput {
  connected: boolean
  migrationVerification: MigrationVerificationStatus
  migrationsApplied: number
  migrationsPending: number
  migrationsFailed: number
  migrationsUnknown: number
  driftStatus: DriftDetectionStatus
  driftCount: number
  maxRiskScore: number
  hasCriticalRisk: boolean
  errorMessage?: string | undefined
}

export function calculateHealthScore(input: ReadinessInput): number {
  if (!input.connected || input.migrationVerification === 'error') {
    return 0
  }

  if (input.migrationVerification === 'unknown') {
    return 30
  }

  let score = 100

  score -= Math.min(35, input.migrationsFailed * 35)
  score -= Math.min(25, input.driftCount * 10)
  score -= Math.min(15, input.migrationsPending * 5)
  score -= Math.min(30, input.migrationsUnknown * 15)

  if (input.driftStatus === 'error') score -= 25

  if (input.hasCriticalRisk || input.maxRiskScore >= 75) score -= 25
  else if (input.maxRiskScore >= 50) score -= 15
  else if (input.maxRiskScore >= 20) score -= 5

  return Math.max(0, Math.min(100, Math.round(score)))
}

export function evaluateDeploymentReadiness(input: ReadinessInput): DeploymentReadiness {
  const healthScore = calculateHealthScore(input)
  const hasCriticalRisk = input.hasCriticalRisk || input.maxRiskScore >= 75
  const isVerified = input.migrationVerification === 'verified' && input.migrationsUnknown === 0

  const checks: DeploymentReadinessCheck[] = [
    {
      id: 'database',
      label: 'Database reachable',
      passed: input.connected,
      message: input.connected
        ? 'PrismaFlow can reach the configured datasource.'
        : input.errorMessage || 'Check DATABASE_URL and database network access before deploying.',
    },
    {
      id: 'migration-verification',
      label: 'Migration state verified',
      passed: isVerified,
      message: isVerified
        ? 'Migration history successfully verified against the database.'
        : input.errorMessage ||
          'Migration state is unknown or unverified. Database state cannot be proven safe.',
    },
    {
      id: 'drift',
      label:
        input.driftStatus === 'drifted'
          ? 'Schema drift detected'
          : input.driftStatus === 'error'
            ? 'Schema drift unavailable'
            : input.driftStatus === 'not_checked'
              ? 'Drift check pending'
              : 'No schema drift',
      passed: input.driftStatus === 'clean' && input.driftCount === 0,
      message:
        input.driftStatus === 'clean'
          ? 'The live database matches the Prisma schema.'
          : input.driftStatus === 'drifted'
            ? `${input.driftCount} drift item${input.driftCount === 1 ? '' : 's'} must be reviewed.`
            : input.driftStatus === 'error'
              ? 'Drift detection failed. Schema differences cannot be verified.'
              : 'Drift check not performed (database disconnected or pending migrations exist).',
    },
    {
      id: 'failed-migrations',
      label: input.migrationsFailed > 0 ? 'Failed migrations detected' : 'No failed migrations',
      passed: isVerified && input.migrationsFailed === 0,
      message: !isVerified
        ? 'Cannot verify failed migration state (verification unproven).'
        : input.migrationsFailed === 0
          ? 'Migration history has no failed entries.'
          : `${input.migrationsFailed} failed migration${input.migrationsFailed === 1 ? '' : 's'} need recovery.`,
    },
    {
      id: 'pending-migrations',
      label: !isVerified
        ? 'Pending migrations unknown'
        : input.migrationsPending > 0
          ? 'Pending migrations detected'
          : 'No pending migrations',
      passed: isVerified && input.migrationsPending === 0,
      message: !isVerified
        ? 'Cannot verify pending migration state (verification unproven).'
        : input.migrationsPending === 0
          ? 'All local migrations are applied.'
          : `${input.migrationsPending} migration${input.migrationsPending === 1 ? '' : 's'} still pending.`,
    },
    {
      id: 'critical-risks',
      label: hasCriticalRisk ? 'Critical migration risks detected' : 'No critical migration risks',
      passed: !hasCriticalRisk,
      message: hasCriticalRisk
        ? 'At least one migration contains a critical data-loss operation.'
        : 'No critical data-loss operations were detected.',
    },
  ]

  // Blocker checks: database unreachable, unverified migrations, drift errors/drifted, failed migrations, critical risk
  const blockers = checks.filter(
    (check) =>
      !check.passed &&
      ['database', 'migration-verification', 'failed-migrations', 'critical-risks'].includes(
        check.id,
      ),
  )

  const hasDriftBlocker =
    !checks.find((c) => c.id === 'drift')?.passed &&
    (input.driftStatus === 'drifted' || input.driftStatus === 'error')

  const warnings = checks.filter((check) => !check.passed)

  if (blockers.length > 0 || hasDriftBlocker) {
    const summary = !input.connected
      ? 'Blocked: database is unreachable'
      : !isVerified
        ? 'Blocked: migration verification is unknown or failed'
        : input.migrationsFailed > 0
          ? 'Blocked: failed migrations must be resolved'
          : hasDriftBlocker
            ? 'Blocked: schema drift detected or drift check failed'
            : 'Blocked: critical migration risks detected'

    return {
      status: 'blocked',
      score: healthScore,
      summary,
      checks,
    }
  }

  if (warnings.length > 0) {
    const summary =
      input.migrationsPending > 0
        ? 'Attention: pending migrations to review before deploying'
        : 'Attention: review warnings before deploying'

    return {
      status: 'attention',
      score: healthScore,
      summary,
      checks,
    }
  }

  return {
    status: 'ready',
    score: healthScore,
    summary: 'Ready for deployment',
    checks,
  }
}
