import { PrismaLegacyAdapter } from './legacy-adapter.js'
import { Prisma7Adapter } from './prisma7-adapter.js'
import { Prisma8Adapter } from './prisma8-adapter.js'
import type { PrismaAdapter } from './types.js'

/**
 * Resolve the appropriate PrismaAdapter based on the detected Prisma version string.
 *
 * Examples:
 *   '^5.22.0' -> PrismaLegacyAdapter
 *   '~6.1.0'  -> PrismaLegacyAdapter
 *   '^7.0.0'  -> Prisma7Adapter
 *   '8.0.0-beta' -> Prisma8Adapter
 */
export function getPrismaAdapter(version: string | null): PrismaAdapter {
  if (!version) {
    // Default to legacy adapter when version cannot be detected from package.json
    return new PrismaLegacyAdapter(null)
  }

  const clean = version.replace(/^[\^~>=<v\s]+/, '')
  const major = Number.parseInt(clean.split('.')[0] ?? '', 10)

  if (major >= 8) {
    return new Prisma8Adapter(version)
  }

  if (major === 7) {
    return new Prisma7Adapter(version)
  }

  // Prisma 5, 6 or unspecified
  return new PrismaLegacyAdapter(version)
}
