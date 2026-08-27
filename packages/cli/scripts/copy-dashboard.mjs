/**
 * copy-dashboard.mjs
 *
 * Copies the Next.js static export (apps/dashboard/out/) into
 * packages/cli/public/ so that the Hono server can serve the dashboard.
 *
 * Strict by default: Fails with exit code 1 if apps/dashboard/out is missing.
 * Allows opt-out during isolated dev loops only via --allow-missing or ALLOW_MISSING_DASHBOARD=1.
 */

import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..', '..', '..')

const src = resolve(root, 'apps', 'dashboard', 'out')
const dest = resolve(root, 'packages', 'cli', 'public')

const allowMissing =
  process.argv.includes('--allow-missing') ||
  process.env.ALLOW_MISSING_DASHBOARD === '1' ||
  process.env.ALLOW_MISSING_DASHBOARD === 'true'

if (!existsSync(src)) {
  if (!allowMissing) {
    console.error('✖ Error: Dashboard static export (apps/dashboard/out) not found.')
    console.error(
      '  Run "npm run build --workspace=dashboard" or "npm run build" before packaging the CLI.',
    )
    process.exit(1)
  }
  console.warn(
    '⚠ Warning: Dashboard build output (apps/dashboard/out) not found. Skipping asset copy (dev mode).',
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
