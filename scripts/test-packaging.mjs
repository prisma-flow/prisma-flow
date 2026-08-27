#!/usr/bin/env node

import { execFileSync, execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

console.log('📦 Starting real package artifact smoke test...')

// Read authoritative expected version dynamically from packages/cli/package.json
const cliPackageJsonPath = path.join(rootDir, 'packages', 'cli', 'package.json')
const expectedVersion = JSON.parse(fs.readFileSync(cliPackageJsonPath, 'utf8')).version
console.log(`📋 Authoritative CLI version from package.json: ${expectedVersion}`)

// 1. Build all packages first (strict dashboard copy is enforced)
console.log('🔨 Ensuring all packages are built...')
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' })

// 2. Pack @prisma-flow/shared and prisma-flow
console.log('📦 Packing tarballs...')
const sharedPackOutput = execSync('npm pack --workspace=packages/shared', {
  cwd: rootDir,
  encoding: 'utf-8',
}).trim()
const sharedTarballName = sharedPackOutput.split('\n').pop().trim()
const sharedTarballPath = path.resolve(rootDir, sharedTarballName)

const cliPackOutput = execSync('npm pack --workspace=packages/cli', {
  cwd: rootDir,
  encoding: 'utf-8',
}).trim()
const cliTarballName = cliPackOutput.split('\n').pop().trim()
const cliTarballPath = path.resolve(rootDir, cliTarballName)

console.log(`  Shared tarball: ${sharedTarballName}`)
console.log(`  CLI tarball:    ${cliTarballName}`)

// 3. Create isolated temp test directory
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prisma-flow-pack-test-'))
console.log(`📁 Testing installation in isolated directory: ${tempDir}`)

try {
  fs.writeFileSync(
    path.join(tempDir, 'package.json'),
    JSON.stringify({ name: 'pack-smoke-test', private: true, type: 'module' }, null, 2),
    'utf-8',
  )

  // 4. Install the packed tarballs
  console.log('📥 Running npm install on tarballs...')
  execSync(`npm install "${sharedTarballPath}" "${cliTarballPath}"`, {
    cwd: tempDir,
    stdio: 'inherit',
  })

  const binPath = path.join(tempDir, 'node_modules', '.bin', 'prisma-flow')
  if (!fs.existsSync(binPath)) {
    throw new Error(`Binary not found at expected path: ${binPath}`)
  }

  // 5. Test prisma-flow --version against authoritative version
  console.log('🧪 Testing prisma-flow --version...')
  const versionOutput = execFileSync(binPath, ['--version'], { encoding: 'utf-8' }).trim()
  console.log(`  Reported version: ${versionOutput}`)
  if (versionOutput !== expectedVersion) {
    throw new Error(`Expected version ${expectedVersion}, received: ${versionOutput}`)
  }

  // 6. Test prisma-flow --help
  console.log('🧪 Testing prisma-flow --help...')
  const helpOutput = execFileSync(binPath, ['--help'], { encoding: 'utf-8' })
  if (
    !helpOutput.includes('prisma-flow') ||
    !helpOutput.includes('check') ||
    !helpOutput.includes('status')
  ) {
    throw new Error('Help output missing expected CLI command descriptions')
  }

  // 7. Verify dashboard static assets exist in installed package
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

  // 8. Test running safe CLI command against fixture project
  console.log('🧪 Testing CLI execution against fixture project...')
  const fixtureSrc = path.join(rootDir, 'test-project')
  const fixtureTarget = path.join(tempDir, 'fixture-project')

  // Copy fixture directory
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

  console.log('✅ All package artifact smoke tests passed!')
} finally {
  // Clean up
  console.log('🧹 Cleaning up temporary test directory and tarballs...')
  fs.rmSync(tempDir, { recursive: true, force: true })
  if (fs.existsSync(sharedTarballPath)) fs.unlinkSync(sharedTarballPath)
  if (fs.existsSync(cliTarballPath)) fs.unlinkSync(cliTarballPath)
}
