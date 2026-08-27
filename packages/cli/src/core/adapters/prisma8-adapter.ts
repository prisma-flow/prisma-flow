import type { DatabaseProvider } from '@prisma-flow/shared'
import type {
  DriftDetectionResult,
  MigrationStatusResult,
  PrismaAdapter,
  PrismaCapabilities,
} from './types.js'

export class Prisma8Adapter implements PrismaAdapter {
  readonly generation = 'prisma8' as const

  constructor(readonly version: string | null) {}

  getCapabilities(): PrismaCapabilities {
    return {
      supportsClassicMigrationSql: false,
      supportsStructuredMigrationPlan: false,
      supportsContractModel: false,
      supportsDrift: false,
      supportsRollbackPlanning: false,
      supportsExecutedSimulation: false,
      supportsMigrationHistory: false,
      isProductionSupported: false,
      isExperimental: true,
    }
  }

  async getMigrationStatus(_cwd: string, _schemaPath: string): Promise<MigrationStatusResult> {
    return {
      verification: 'unknown',
      connected: false,
      statusMap: new Map(),
      errorCode: 'PRISMA8_EXPERIMENTAL_UNSUPPORTED',
      errorMessage:
        'Prisma 8 migration verification is experimental and not supported for deployment readiness yet.',
    }
  }

  async detectDrift(
    _cwd: string,
    _schemaPath: string,
    _databaseUrl?: string,
    _provider?: DatabaseProvider | null,
  ): Promise<DriftDetectionResult> {
    return {
      items: [],
      status: 'not_checked',
      errorMessage:
        'Prisma 8 drift detection is experimental and not supported for deployment readiness yet.',
    }
  }
}
