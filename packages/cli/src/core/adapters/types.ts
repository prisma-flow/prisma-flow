import type {
  DatabaseProvider,
  DriftDetectionStatus,
  DriftItem,
  MigrationStatus,
  MigrationVerificationStatus,
} from '@prisma-flow/shared'

export interface DriftDetectionResult {
  items: DriftItem[]
  status: DriftDetectionStatus
  errorMessage?: string
}

export interface PrismaCapabilities {
  supportsClassicMigrationSql: boolean
  supportsStructuredMigrationPlan: boolean
  supportsContractModel: boolean
  supportsDrift: boolean
  supportsRollbackPlanning: boolean
  supportsExecutedSimulation: boolean
  supportsMigrationHistory: boolean
  isProductionSupported: boolean
  isExperimental: boolean
}

export interface MigrationStatusResult {
  verification: MigrationVerificationStatus
  connected: boolean
  statusMap: Map<string, MigrationStatus>
  errorMessage?: string
  errorCode?: string
}

export interface PrismaAdapter {
  readonly version: string | null
  readonly generation: 'legacy' | 'prisma7' | 'prisma8' | 'unknown'
  getCapabilities(): PrismaCapabilities
  getMigrationStatus(cwd: string, schemaPath: string): Promise<MigrationStatusResult>
  detectDrift(
    cwd: string,
    schemaPath: string,
    databaseUrl?: string,
    provider?: DatabaseProvider | null,
  ): Promise<DriftDetectionResult>
}
