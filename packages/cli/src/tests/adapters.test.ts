import { describe, expect, it } from 'vitest'
import {
  Prisma7Adapter,
  Prisma8Adapter,
  PrismaLegacyAdapter,
  UnsupportedPrismaAdapter,
  getPrismaAdapter,
} from '../core/adapters/index.js'

describe('Prisma Version Adapters & Capabilities (Issue #40, Blocker 2 & 3)', () => {
  it('resolves PrismaLegacyAdapter for Prisma 5 and 6 versions', () => {
    const adapter5 = getPrismaAdapter('^5.22.0')
    expect(adapter5).toBeInstanceOf(PrismaLegacyAdapter)
    expect(adapter5.generation).toBe('legacy')

    const adapter6 = getPrismaAdapter('~6.1.0')
    expect(adapter6).toBeInstanceOf(PrismaLegacyAdapter)
    expect(adapter6.generation).toBe('legacy')

    const caps = adapter5.getCapabilities()
    expect(caps.supportsClassicMigrationSql).toBe(true)
    expect(caps.supportsStructuredMigrationPlan).toBe(false)
    expect(caps.isProductionSupported).toBe(true)
    expect(caps.isExperimental).toBe(false)
  })

  it('resolves Prisma7Adapter for Prisma 7 versions', () => {
    const adapter7 = getPrismaAdapter('^7.0.0')
    expect(adapter7).toBeInstanceOf(Prisma7Adapter)
    expect(adapter7.generation).toBe('prisma7')

    const caps = adapter7.getCapabilities()
    expect(caps.supportsClassicMigrationSql).toBe(true)
    expect(caps.supportsDrift).toBe(true)
    expect(caps.isProductionSupported).toBe(true)
    expect(caps.isExperimental).toBe(false)
  })

  it('resolves Prisma8Adapter for Prisma 8 with conservative experimental status', async () => {
    const adapter8 = getPrismaAdapter('8.0.0-beta.1')
    expect(adapter8).toBeInstanceOf(Prisma8Adapter)
    expect(adapter8.generation).toBe('prisma8')

    const caps = adapter8.getCapabilities()
    expect(caps.supportsContractModel).toBe(false)
    expect(caps.supportsStructuredMigrationPlan).toBe(false)
    expect(caps.isProductionSupported).toBe(false)
    expect(caps.isExperimental).toBe(true)

    // Prisma 8 must fail closed for deployment verification
    const status = await adapter8.getMigrationStatus('/tmp', '/tmp/schema.prisma')
    expect(status.verification).toBe('unknown')
    expect(status.connected).toBe(false)
    expect(status.errorCode).toBe('PRISMA8_EXPERIMENTAL_UNSUPPORTED')

    const drift = await adapter8.detectDrift('/tmp', '/tmp/schema.prisma')
    expect(drift.status).toBe('not_checked')
  })

  it('resolves UnsupportedPrismaAdapter and fails closed for invalid or unsupported versions', async () => {
    const testCases = [null, undefined, '', '   ', '4.16.2', 'banana', '9.0.0', '>=3.0.0']

    for (const v of testCases) {
      const adapter = getPrismaAdapter(v)
      expect(adapter).toBeInstanceOf(UnsupportedPrismaAdapter)
      expect(adapter.generation).toBe('unknown')

      const caps = adapter.getCapabilities()
      expect(caps.isProductionSupported).toBe(false)
      expect(caps.isExperimental).toBe(false)
      expect(caps.supportsClassicMigrationSql).toBe(false)
      expect(caps.supportsDrift).toBe(false)

      const status = await adapter.getMigrationStatus('/tmp', '/tmp/schema.prisma')
      expect(status.verification).toBe('unknown')
      expect(status.connected).toBe(false)
      expect(status.errorCode).toBe('UNSUPPORTED_PRISMA_VERSION')

      const drift = await adapter.detectDrift('/tmp', '/tmp/schema.prisma')
      expect(drift.status).toBe('not_checked')
    }
  })
})
