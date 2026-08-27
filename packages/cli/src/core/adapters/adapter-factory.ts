import { PrismaLegacyAdapter } from './legacy-adapter.js'
import { Prisma7Adapter } from './prisma7-adapter.js'
import { Prisma8Adapter } from './prisma8-adapter.js'
import type { PrismaAdapter } from './types.js'
import { UnsupportedPrismaAdapter } from './unsupported-adapter.js'

/**
 * Resolve the appropriate PrismaAdapter based on the detected Prisma version string.
 *
 * Supported:
 *   Prisma 5.x -> PrismaLegacyAdapter
 *   Prisma 6.x -> PrismaLegacyAdapter
 *   Prisma 7.x -> Prisma7Adapter
 *   Prisma 8.x -> Prisma8Adapter (experimental)
 *
 * Everything else (Prisma 4 or earlier, Prisma 9+, unparseable strings, null/undefined, empty)
 * resolves to UnsupportedPrismaAdapter and fails closed.
 */
export function getPrismaAdapter(version: string | null | undefined): PrismaAdapter {
  if (!version || typeof version !== 'string' || !version.trim()) {
    return new UnsupportedPrismaAdapter(version ?? null)
  }

  const clean = version.trim().replace(/^[\^~>=<v\s]+/, '')
  const firstPart = clean.split('.')[0] ?? ''
  const major = Number.parseInt(firstPart, 10)

  if (Number.isNaN(major)) {
    return new UnsupportedPrismaAdapter(version)
  }

  if (major === 5 || major === 6) {
    return new PrismaLegacyAdapter(version)
  }

  if (major === 7) {
    return new Prisma7Adapter(version)
  }

  if (major === 8) {
    return new Prisma8Adapter(version)
  }

  return new UnsupportedPrismaAdapter(version)
}
