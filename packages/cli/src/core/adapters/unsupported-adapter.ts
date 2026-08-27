import type { DatabaseProvider } from '@prisma-flow/shared'
import type {
  DriftDetectionResult,
  MigrationStatusResult,
  PrismaAdapter,
  PrismaCapabilities,
} from './types.js'

export class UnsupportedPrismaAdapter implements PrismaAdapter {
  readonly generation = 'unknown' as const

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
      isExperimental: false,
    }
  }

  async getMigrationStatus(_cwd: string, _schemaPath: string): Promise<MigrationStatusResult> {
    return {
      verification: 'unknown',
      connected: false,
      statusMap: new Map(),
      errorCode: 'UNSUPPORTED_PRISMA_VERSION',
      errorMessage: this.version
        ? `Prisma version "${this.version}" is not supported. Supported versions: Prisma 5, 6, and 7.`
        : 'Prisma version could not be detected or is not supported. Supported versions: Prisma 5, 6, and 7.',
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
      errorMessage: this.version
        ? `Drift detection is not supported for Prisma version "${this.version}".`
        : 'Drift detection requires a supported Prisma version (5, 6, or 7).',
    }
  }
}
