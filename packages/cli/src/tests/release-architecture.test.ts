import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const rootDir = path.resolve(__dirname, '../../../../')

describe('Release Architecture & Invariants', () => {
  const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'))
  const cliPkg = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'packages/cli/package.json'), 'utf8'),
  )
  const sharedPkg = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'packages/shared/package.json'), 'utf8'),
  )
  const dashboardPkg = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'apps/dashboard/package.json'), 'utf8'),
  )
  const websitePkg = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'apps/website/package.json'), 'utf8'),
  )
  const releaseConfig = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'release-please-config.json'), 'utf8'),
  )
  const releaseManifest = JSON.parse(
    fs.readFileSync(path.join(rootDir, '.release-please-manifest.json'), 'utf8'),
  )
  const releaseWorkflow = fs.readFileSync(
    path.join(rootDir, '.github/workflows/release.yml'),
    'utf8',
  )

  it('preserves single public package boundary', () => {
    expect(cliPkg.name).toBe('prisma-flow')
    expect(cliPkg.private).toBeFalsy()
    expect(sharedPkg.private).toBe(true)
    expect(dashboardPkg.private).toBe(true)
    expect(websitePkg.private).toBe(true)
    expect(cliPkg.dependencies?.['@prisma-flow/shared']).toBeUndefined()
    expect(cliPkg.devDependencies?.['@prisma-flow/shared']).toBeDefined()
  })

  it('enforces version consistency across manifest, root, and CLI package', () => {
    expect(cliPkg.version).toBe('0.2.0')
    expect(rootPkg.version).toBe('0.2.0')
    expect(releaseManifest['.']).toBe('0.2.0')
  })

  it('configures Release Please for single public artifact with public impact paths', () => {
    expect(releaseConfig['release-type']).toBe('node')
    expect(releaseConfig['bump-minor-pre-major']).toBe(true)
    expect(releaseConfig['include-component-in-tag']).toBe(false)
    expect(releaseConfig['skip-github-release']).toBe(true)
    expect(releaseConfig['skip-changelog']).toBe(true)

    const rootPackageConfig = releaseConfig.packages?.['.']
    expect(rootPackageConfig).toBeDefined()
    expect(rootPackageConfig['package-name']).toBe('prisma-flow')
    expect(rootPackageConfig['bump-minor-pre-major']).toBe(true)
    expect(rootPackageConfig['include-component-in-tag']).toBe(false)

    // Excluded paths must NOT trigger release
    const excluded = rootPackageConfig['exclude-paths']
    expect(excluded).toContain('apps/website')
    expect(excluded).toContain('docs')
    expect(excluded).toContain('.github')

    // Public artifact paths must NOT be excluded
    expect(excluded).not.toContain('packages/cli')
    expect(excluded).not.toContain('packages/shared')
    expect(excluded).not.toContain('apps/dashboard')

    // Extra files must synchronize CLI package version
    const extraFiles = rootPackageConfig['extra-files']
    const hasCliVersionSync = extraFiles?.some(
      (f: string | { path?: string; jsonpath?: string }) =>
        f === 'packages/cli/package.json' ||
        (typeof f === 'object' &&
          f.path === 'packages/cli/package.json' &&
          f.jsonpath === '$.version'),
    )
    expect(hasCliVersionSync).toBe(true)
  })

  it('enforces publication ordering: tag exists before npm publish', () => {
    const tagStepIndex = releaseWorkflow.indexOf(
      'Ensure canonical Git tag exists before publication',
    )
    const publishStepIndex = releaseWorkflow.indexOf('Publish npm package')
    const ghReleaseStepIndex = releaseWorkflow.indexOf('Reconcile GitHub Release')

    expect(tagStepIndex).toBeGreaterThan(-1)
    expect(publishStepIndex).toBeGreaterThan(tagStepIndex)
    expect(ghReleaseStepIndex).toBeGreaterThan(publishStepIndex)
  })

  it('enforces immutable commit targeting in release workflow', () => {
    expect(releaseWorkflow).toContain('github.event.pull_request.merge_commit_sha')
    expect(releaseWorkflow).toContain('Resolve immutable target commit')
    expect(releaseWorkflow).toContain('ref: ${{ steps.target.outputs.target_sha }}')
  })

  it('enforces fail-safe guard on automated release triggers', () => {
    expect(releaseWorkflow).toContain(
      "github.event.pull_request.user.login == 'github-actions[bot]'",
    )
    expect(releaseWorkflow).toContain(
      "contains(github.event.pull_request.labels.*.name, 'autorelease: pending')",
    )
  })

  describe('Path exclusion and version bump simulation', () => {
    const excludedPaths = releaseConfig.packages['.']['exclude-paths']

    function shouldTriggerRelease(filesChanged: string[]): boolean {
      return filesChanged.some((file) => !excludedPaths.some((exc: string) => file.startsWith(exc)))
    }

    function calculateNextVersion(
      currentVersion: string,
      commits: Array<{ type: string; breaking: boolean }>,
    ): string {
      const parts = currentVersion.split('.').map(Number)
      const major = parts[0] ?? 0
      const minor = parts[1] ?? 0
      const patch = parts[2] ?? 0
      let bump: 'none' | 'patch' | 'minor' | 'major' = 'none'

      for (const commit of commits) {
        if (commit.breaking) {
          // Pre-1.0 with bump-minor-pre-major: true bumps minor, NOT major
          if (major === 0 && releaseConfig['bump-minor-pre-major']) {
            bump = 'minor'
          } else {
            bump = 'major'
          }
        } else if (commit.type === 'feat') {
          if (bump !== 'major') {
            bump = 'minor'
          }
        } else if (commit.type === 'fix') {
          if (bump === 'none') {
            bump = 'patch'
          }
        }
      }

      if (bump === 'minor') return `${major}.${minor + 1}.0`
      if (bump === 'patch') return `${major}.${minor}.${patch + 1}`
      if (bump === 'major') return `${major + 1}.0.0`
      return currentVersion
    }

    it('triggers release for changes in packages/shared', () => {
      expect(shouldTriggerRelease(['packages/shared/src/schemas/migration.ts'])).toBe(true)
    })

    it('triggers release for changes in apps/dashboard', () => {
      expect(shouldTriggerRelease(['apps/dashboard/app/drift/page.tsx'])).toBe(true)
    })

    it('ignores changes strictly in apps/website', () => {
      expect(shouldTriggerRelease(['apps/website/app/page.tsx', 'apps/website/package.json'])).toBe(
        false,
      )
    })

    it('ignores docs and github workflows from triggering release bump', () => {
      expect(shouldTriggerRelease(['docs/ARCHITECTURE.md'])).toBe(false)
      expect(shouldTriggerRelease(['.github/workflows/ci.yml'])).toBe(false)
    })

    it('calculates minor bump for feat in shared (0.2.0 -> 0.3.0)', () => {
      const next = calculateNextVersion('0.2.0', [{ type: 'feat', breaking: false }])
      expect(next).toBe('0.3.0')
    })

    it('calculates patch bump for fix in dashboard (0.2.0 -> 0.2.1)', () => {
      const next = calculateNextVersion('0.2.0', [{ type: 'fix', breaking: false }])
      expect(next).toBe('0.2.1')
    })

    it('calculates minor bump (not 1.0.0) for breaking change under 0.x when bump-minor-pre-major is true', () => {
      const next = calculateNextVersion('0.2.0', [{ type: 'feat', breaking: true }])
      expect(next).toBe('0.3.0')
      expect(next).not.toBe('1.0.0')
    })
  })

  describe('Release State Reconciliation Logic (Retry & Idempotency)', () => {
    function reconcileReleaseState(state: {
      tagExists: boolean
      npmExists: boolean
      ghReleaseExists: boolean
    }): {
      createTag: boolean
      publishNpm: boolean
      createGhRelease: boolean
      status: 'complete' | 'reconciled'
    } {
      if (!state.tagExists) {
        throw new Error('Tag must exist for retry')
      }

      const publishNpm = !state.npmExists
      const createGhRelease = !state.ghReleaseExists
      const isAlreadyComplete = state.npmExists && state.ghReleaseExists

      return {
        createTag: false,
        publishNpm,
        createGhRelease,
        status: isAlreadyComplete ? 'complete' : 'reconciled',
      }
    }

    it('State A: tag exists, npm missing, release missing -> publishes npm and creates release', () => {
      const res = reconcileReleaseState({
        tagExists: true,
        npmExists: false,
        ghReleaseExists: false,
      })
      expect(res.publishNpm).toBe(true)
      expect(res.createGhRelease).toBe(true)
      expect(res.status).toBe('reconciled')
    })

    it('State B: tag exists, npm exists, release missing -> skips npm and creates release', () => {
      const res = reconcileReleaseState({
        tagExists: true,
        npmExists: true,
        ghReleaseExists: false,
      })
      expect(res.publishNpm).toBe(false)
      expect(res.createGhRelease).toBe(true)
      expect(res.status).toBe('reconciled')
    })

    it('State C: tag exists, npm missing, release exists -> publishes npm and skips release', () => {
      const res = reconcileReleaseState({
        tagExists: true,
        npmExists: false,
        ghReleaseExists: true,
      })
      expect(res.publishNpm).toBe(true)
      expect(res.createGhRelease).toBe(false)
      expect(res.status).toBe('reconciled')
    })

    it('State D: tag exists, npm exists, release exists -> reports already complete with no actions', () => {
      const res = reconcileReleaseState({ tagExists: true, npmExists: true, ghReleaseExists: true })
      expect(res.publishNpm).toBe(false)
      expect(res.createGhRelease).toBe(false)
      expect(res.status).toBe('complete')
    })
  })
})
