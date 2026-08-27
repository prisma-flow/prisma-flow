import { describe, expect, it } from 'vitest'
import {
  Prisma7Adapter,
  Prisma8Adapter,
  PrismaLegacyAdapter,
  getPrismaAdapter,
} from '../core/adapters/index.js'

describe('Prisma Version Adapters & Capabilities (Issue #40)', () => {
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
  })

  it('resolves Prisma7Adapter for Prisma 7 versions', () => {
    const adapter7 = getPrismaAdapter('^7.0.0')
    expect(adapter7).toBeInstanceOf(Prisma7Adapter)
    expect(adapter7.generation).toBe('prisma7')

    const caps = adapter7.getCapabilities()
    expect(caps.supportsClassicMigrationSql).toBe(true)
    expect(caps.supportsDrift).toBe(true)
  })

  it('resolves Prisma8Adapter for Prisma 8 versions with contract modeling', () => {
    const adapter8 = getPrismaAdapter('8.0.0-beta.1')
    expect(adapter8).toBeInstanceOf(Prisma8Adapter)
    expect(adapter8.generation).toBe('prisma8')

    const caps = adapter8.getCapabilities()
    expect(caps.supportsContractModel).toBe(true)
    expect(caps.supportsStructuredMigrationPlan).toBe(true)
  })

  it('falls back gracefully to legacy adapter when version is null', () => {
    const adapter = getPrismaAdapter(null)
    expect(adapter).toBeInstanceOf(PrismaLegacyAdapter)
  })
})
