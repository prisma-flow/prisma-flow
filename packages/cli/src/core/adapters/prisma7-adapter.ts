import type { DatabaseProvider } from '@prisma-flow/shared'
import { logger } from '../../logger.js'
import { execPrisma } from '../prisma-cli.js'
import { parseDriftOutput, runPrismaMigrateStatus } from './base-adapter.js'
import type {
  DriftDetectionResult,
  MigrationStatusResult,
  PrismaAdapter,
  PrismaCapabilities,
} from './types.js'

export class Prisma7Adapter implements PrismaAdapter {
  readonly generation = 'prisma7' as const

  constructor(readonly version: string | null) {}

  getCapabilities(): PrismaCapabilities {
    return {
      supportsClassicMigrationSql: true,
      supportsStructuredMigrationPlan: false,
      supportsContractModel: false,
      supportsDrift: true,
      supportsRollbackPlanning: true,
      supportsExecutedSimulation: true,
      supportsMigrationHistory: true,
      isProductionSupported: true,
      isExperimental: false,
    }
  }

  async getMigrationStatus(cwd: string, schemaPath: string): Promise<MigrationStatusResult> {
    return runPrismaMigrateStatus(cwd, schemaPath)
  }

  async detectDrift(
    cwd: string,
    schemaPath: string,
    databaseUrl?: string,
    _provider?: DatabaseProvider | null,
  ): Promise<DriftDetectionResult> {
    try {
      const env = databaseUrl ? { ...process.env, DATABASE_URL: databaseUrl } : process.env
      // Prisma 7 uses --from-schema and --to-config-datasource
      const { stdout } = await execPrisma(
        cwd,
        ['migrate', 'diff', '--from-schema', schemaPath, '--to-config-datasource', '--script'],
        { env, timeout: 30_000 },
      )

      const items = parseDriftOutput(stdout)
      return { items, status: items.length > 0 ? 'drifted' : 'clean' }
    } catch (err: unknown) {
      const error = err as { stderr?: string; message?: string }
      const stderr = error.stderr ?? ''
      if (
        stderr.includes('P1001') ||
        stderr.includes("Can't reach database server") ||
        stderr.includes('Connection refused')
      ) {
        logger.debug('Drift detection skipped: database unreachable')
        return { items: [], status: 'error', errorMessage: 'Database unreachable' }
      }
      const message = error instanceof Error ? error.message : String(error)
      logger.warn({ err }, 'Prisma 7 drift detection failed')
      return { items: [], status: 'error', errorMessage: message }
    }
  }
}
