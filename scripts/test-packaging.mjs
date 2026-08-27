#!/usr/bin/env node

import { execFileSync, execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

console.log('📦 Starting standalone package artifact smoke test...')

// Read authoritative expected version dynamically from packages/cli/package.json
const cliPackageJsonPath = path.join(rootDir, 'packages', 'cli', 'package.json')
const cliPkg = JSON.parse(fs.readFileSync(cliPackageJsonPath, 'utf8'))
const expectedVersion = cliPkg.version
console.log(`📋 Authoritative CLI version from package.json: ${expectedVersion}`)

// 1, 2, 3: Build shared, dashboard, and CLI (guaranteed via turbo build)
console.log('🔨 Ensuring all packages are built in order...')
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' })

// 4. Run real npm pack ONLY for packages/cli (prisma-flow)
console.log('📦 Packing prisma-flow tarball...')
const cliPackOutput = execSync('npm pack --workspace=packages/cli', {
  cwd: rootDir,
  encoding: 'utf-8',
}).trim()
const cliTarballName = cliPackOutput.split('\n').pop().trim()
const cliTarballPath = path.resolve(rootDir, cliTarballName)

console.log(`  CLI tarball: ${cliTarballName}`)

// 5. Create isolated temp test directory
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prisma-flow-pack-test-'))
console.log(`📁 Testing installation in isolated directory: ${tempDir}`)

try {
  fs.writeFileSync(
    path.join(tempDir, 'package.json'),
    JSON.stringify({ name: 'pack-smoke-test', private: true, type: 'module' }, null, 2),
    'utf-8',
  )

  // 6. Install ONLY the packed prisma-flow tarball (DO NOT install @prisma-flow/shared)
  console.log('📥 Running npm install on prisma-flow tarball only...')
  execSync(`npm install "${cliTarballPath}"`, {
    cwd: tempDir,
    stdio: 'inherit',
  })

  const binPath = path.join(tempDir, 'node_modules', '.bin', 'prisma-flow')
  if (!fs.existsSync(binPath)) {
    throw new Error(`Binary not found at expected path: ${binPath}`)
  }

  // 7. Test prisma-flow --version against authoritative version
  console.log('🧪 Testing prisma-flow --version...')
  const versionOutput = execFileSync(binPath, ['--version'], { encoding: 'utf-8' }).trim()
  console.log(`  Reported version: ${versionOutput}`)
  if (versionOutput !== expectedVersion) {
    throw new Error(`Expected version ${expectedVersion}, received: ${versionOutput}`)
  }

  // 8. Test prisma-flow --help
  console.log('🧪 Testing prisma-flow --help...')
  const helpOutput = execFileSync(binPath, ['--help'], { encoding: 'utf-8' })
  if (
    !helpOutput.includes('prisma-flow') ||
    !helpOutput.includes('check') ||
    !helpOutput.includes('status')
  ) {
    throw new Error('Help output missing expected CLI command descriptions')
  }

  // 9. Verify dashboard static assets exist in installed package
  console.log('🧪 Verifying installed dashboard assets in node_modules/prisma-flow/public...')
  const installedPublicDir = path.join(tempDir, 'node_modules', 'prisma-flow', 'public')
  const indexHtmlPath = path.join(installedPublicDir, 'index.html')
  if (!fs.existsSync(indexHtmlPath)) {
    throw new Error(`Dashboard index.html missing from installed package: ${indexHtmlPath}`)
  }
  const indexStat = fs.statSync(indexHtmlPath)
  if (indexStat.size < 100) {
    throw new Error(`Dashboard index.html appears empty or corrupted (${indexStat.size} bytes)`)
  }
  console.log(`  Found index.html (${indexStat.size} bytes)`)

  // 10. Test running safe CLI command against fixture project
  console.log('🧪 Testing CLI execution against fixture project...')
  const fixtureSrc = path.join(rootDir, 'test-project')
  const fixtureTarget = path.join(tempDir, 'fixture-project')

  fs.cpSync(fixtureSrc, fixtureTarget, { recursive: true })

  const checkOutput = execFileSync(binPath, ['check', '--json'], {
    cwd: fixtureTarget,
    encoding: 'utf-8',
  })
  const parsedCheck = JSON.parse(checkOutput)
  console.log('  Check command executed successfully from installed package.')
  if (
    typeof parsedCheck.connected !== 'boolean' ||
    typeof parsedCheck.migrationVerification !== 'string'
  ) {
    throw new Error('Check JSON output does not match expected schema')
  }

  // 11. Inspect installed prisma-flow/package.json and assert dependencies does NOT contain @prisma-flow/shared
  console.log(
    '🧪 Asserting installed package.json does NOT declare @prisma-flow/shared runtime dependency...',
  )
  const installedPkgJsonPath = path.join(tempDir, 'node_modules', 'prisma-flow', 'package.json')
  const installedPkgJson = JSON.parse(fs.readFileSync(installedPkgJsonPath, 'utf8'))
  if (installedPkgJson.dependencies?.['@prisma-flow/shared']) {
    throw new Error(
      'Installed prisma-flow package.json still contains @prisma-flow/shared in dependencies',
    )
  }

  // 12. Assert the installed dependency tree does not require a separately published @prisma-flow/shared package
  console.log('🧪 Asserting node_modules does not contain external @prisma-flow/shared...')
  const installedSharedDir = path.join(tempDir, 'node_modules', '@prisma-flow', 'shared')
  if (fs.existsSync(installedSharedDir)) {
    throw new Error(
      `Found unexpected @prisma-flow/shared directory in test node_modules: ${installedSharedDir}`,
    )
  }

  // 13. Confirm the bundled CLI can run from a completely clean environment
  console.log('🧪 Testing status command in clean environment...')
  const statusOutput = execFileSync(binPath, ['status', '--json'], {
    cwd: fixtureTarget,
    encoding: 'utf-8',
  })
  const parsedStatus = JSON.parse(statusOutput)
  if (typeof parsedStatus.migrationsApplied !== 'number') {
    throw new Error('Status JSON output does not match expected schema')
  }

  console.log('✅ All package artifact smoke tests passed successfully!')
} finally {
  // Clean up
  console.log('🧹 Cleaning up temporary test directory and tarballs...')
  fs.rmSync(tempDir, { recursive: true, force: true })
  if (fs.existsSync(cliTarballPath)) fs.unlinkSync(cliTarballPath)
}
