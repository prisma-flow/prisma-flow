/**
 * copy-dashboard.mjs
 *
 * Copies the Next.js static export (packages/dashboard/out/) into
 * packages/cli/public/ so that the Hono server can serve the dashboard.
 *
 * Runs automatically before the CLI build via the "build" npm script.
 */

import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..', '..', '..')

const src = resolve(root, 'packages', 'dashboard', 'out')
const dest = resolve(root, 'packages', 'cli', 'public')

const isStrict =
  process.argv.includes('--strict') ||
  process.env.STRICT_DASHBOARD === 'true' ||
  process.env.REQUIRE_DASHBOARD === 'true'

if (!existsSync(src)) {
  if (isStrict) {
    console.error('✖ Error: Dashboard static export (packages/dashboard/out) not found.')
    console.error(
      '  Run "npm run build --workspace=@prisma-flow/dashboard" before packaging the CLI.',
    )
    process.exit(1)
  }
  console.warn(
    '⚠ Warning: Dashboard build output (packages/dashboard/out) not found. Skipping asset copy.',
  )
  process.exit(0)
}

// Clean and recreate destination
if (existsSync(dest)) {
  rmSync(dest, { recursive: true, force: true })
}
mkdirSync(dest, { recursive: true })

// Copy dashboard build output
cpSync(src, dest, { recursive: true })
console.log('✔ Copied dashboard assets to packages/cli/public')
