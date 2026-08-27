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
    const releaseVersion = releaseManifest['.']

    expect(releaseVersion).toMatch(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/)
    expect(rootPkg.version).toBe(releaseVersion)
    expect(cliPkg.version).toBe(releaseVersion)
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
    expect(excluded).toContain('test-project')
    expect(excluded).toContain('AGENTS.md')
    expect(excluded).toContain('CONTRIBUTING.md')
    expect(excluded).toContain('CODE_OF_CONDUCT.md')
    expect(excluded).toContain('GOVERNANCE.md')
    expect(excluded).toContain('SECURITY.md')

    // Public artifact paths must NOT be excluded
    expect(excluded).not.toContain('packages/cli')
    expect(excluded).not.toContain('packages/shared')
    expect(excluded).not.toContain('apps/dashboard')
    expect(excluded).not.toContain('package.json')
    expect(excluded).not.toContain('package-lock.json')
    expect(excluded).not.toContain('turbo.json')
    expect(excluded).not.toContain('scripts')

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

  it('enforces publication ordering: tag exists before npm publish, release, and PR label reconciliation', () => {
    const tagStepIndex = releaseWorkflow.indexOf(
      'Ensure canonical Git tag exists before publication',
    )
    const publishStepIndex = releaseWorkflow.indexOf('Publish npm package')
    const ghReleaseStepIndex = releaseWorkflow.indexOf('Reconcile GitHub Release')
    const prReconciliationStepIndex = releaseWorkflow.indexOf('Reconcile Release PR labels')

    expect(tagStepIndex).toBeGreaterThan(-1)
    expect(publishStepIndex).toBeGreaterThan(tagStepIndex)
    expect(ghReleaseStepIndex).toBeGreaterThan(publishStepIndex)
    expect(prReconciliationStepIndex).toBeGreaterThan(ghReleaseStepIndex)
  })

  it('enforces least-privilege permissions including PR and issue write scopes for label management', () => {
    expect(releaseWorkflow).toContain('contents: write')
    expect(releaseWorkflow).toContain('id-token: write')
    expect(releaseWorkflow).toContain('pull-requests: write')
    expect(releaseWorkflow).toContain('issues: write')
    expect(releaseWorkflow).not.toContain('permissions: write-all')
  })

  it('enforces Release Please PR label state reconciliation invariants', () => {
    expect(releaseWorkflow).toContain('github.event.pull_request.number')
    expect(releaseWorkflow).toContain('--remove-label "autorelease: pending"')
    expect(releaseWorkflow).toContain('--add-label "autorelease: tagged"')
    expect(releaseWorkflow).toContain('git rev-parse "v$VERSION"')
    expect(releaseWorkflow).toContain('npm view "prisma-flow@$VERSION"')
    expect(releaseWorkflow).toContain('gh release view "v$VERSION"')
  })

  it('enforces immutable commit targeting in release workflow', () => {
    expect(releaseWorkflow).toContain('github.event.pull_request.merge_commit_sha')
    expect(releaseWorkflow).toContain('Resolve immutable target commit')
    expect(releaseWorkflow).toContain('ref: ${{ steps.target.outputs.target_sha }}')
  })

  it('enforces tag-target commit verification in automated mode', () => {
    expect(releaseWorkflow).toContain('TAG_COMMIT="$(git rev-list -n 1 "v$VERSION")"')
    expect(releaseWorkflow).toContain('if [ "$TAG_COMMIT" != "$TARGET_SHA" ]; then')
  })

  it('enforces fail-safe guard on automated release triggers', () => {
    expect(releaseWorkflow).toContain(
      "github.event.pull_request.user.login == 'github-actions[bot]'",
    )
    expect(releaseWorkflow).toContain(
      "contains(github.event.pull_request.labels.*.name, 'autorelease: pending')",
    )
  })

  describe('Tag target guard and mode evaluation', () => {
    function evaluateTagGuard(params: {
      mode: 'automated' | 'bootstrap' | 'retry'
      tagExists: boolean
      tagCommit?: string
      targetSha: string
    }): { allowed: boolean; error?: string } {
      if (params.mode === 'bootstrap') {
        if (params.tagExists) {
          return { allowed: false, error: 'Bootstrap failed: tag already exists' }
        }
        return { allowed: true }
      }

      if (params.mode === 'retry') {
        if (!params.tagExists) {
          return { allowed: false, error: 'Retry failed: tag does not exist' }
        }
        return { allowed: true }
      }

      // Automated mode
      if (params.tagExists) {
        if (params.tagCommit !== params.targetSha) {
          return {
            allowed: false,
            error: `Canonical tag points to ${params.tagCommit} instead of target ${params.targetSha}`,
          }
        }
      }
      return { allowed: true }
    }

    it('automated mode + existing matching tag -> allowed', () => {
      const res = evaluateTagGuard({
        mode: 'automated',
        tagExists: true,
        tagCommit: 'abc1234',
        targetSha: 'abc1234',
      })
      expect(res.allowed).toBe(true)
    })

    it('automated mode + existing wrong tag -> fails', () => {
      const res = evaluateTagGuard({
        mode: 'automated',
        tagExists: true,
        tagCommit: 'oldcommit',
        targetSha: 'newcommit',
      })
      expect(res.allowed).toBe(false)
      expect(res.error).toContain('Canonical tag points to oldcommit instead of target newcommit')
    })

    it('bootstrap + existing tag -> fails', () => {
      const res = evaluateTagGuard({
        mode: 'bootstrap',
        tagExists: true,
        targetSha: 'commit1',
      })
      expect(res.allowed).toBe(false)
      expect(res.error).toContain('tag already exists')
    })

    it('retry + existing tag -> uses tag as canonical source', () => {
      const res = evaluateTagGuard({
        mode: 'retry',
        tagExists: true,
        tagCommit: 'releasecommit',
        targetSha: 'releasecommit',
      })
      expect(res.allowed).toBe(true)
    })
  })

  describe('Path exclusion and version bump simulation', () => {
    const excludedPaths = releaseConfig.packages['.']['exclude-paths']

    function shouldTriggerRelease(filesChanged: string[]): boolean {
      return filesChanged.some(
        (file) => !excludedPaths.some((exc: string) => file === exc || file.startsWith(`${exc}/`)),
      )
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

    it('ignores test-project and community documentation from triggering release bump', () => {
      expect(shouldTriggerRelease(['test-project/prisma/schema.prisma'])).toBe(false)
      expect(shouldTriggerRelease(['AGENTS.md'])).toBe(false)
      expect(shouldTriggerRelease(['CONTRIBUTING.md'])).toBe(false)
      expect(shouldTriggerRelease(['CODE_OF_CONDUCT.md'])).toBe(false)
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

  describe('PR Label State Machine & Reconciliation Logic', () => {
    function reconcilePrLabels(params: {
      mode: 'automated' | 'bootstrap' | 'retry'
      tagExists: boolean
      npmExists: boolean
      ghReleaseExists: boolean
      currentLabels: string[]
    }): {
      reconciled: boolean
      labelsToAdd: string[]
      labelsToRemove: string[]
      finalLabels: string[]
      error?: string
    } {
      if (params.mode !== 'automated') {
        return {
          reconciled: false,
          labelsToAdd: [],
          labelsToRemove: [],
          finalLabels: [...params.currentLabels],
        }
      }

      if (!params.tagExists || !params.npmExists || !params.ghReleaseExists) {
        return {
          reconciled: false,
          labelsToAdd: [],
          labelsToRemove: [],
          finalLabels: [...params.currentLabels],
          error: 'Incomplete release: artifacts missing',
        }
      }

      const hasPending = params.currentLabels.includes('autorelease: pending')
      const hasTagged = params.currentLabels.includes('autorelease: tagged')

      const labelsToRemove: string[] = []
      const labelsToAdd: string[] = []

      if (hasPending) {
        labelsToRemove.push('autorelease: pending')
      }
      if (!hasTagged) {
        labelsToAdd.push('autorelease: tagged')
      }

      const finalLabels = params.currentLabels
        .filter((l) => !labelsToRemove.includes(l))
        .concat(labelsToAdd)

      return {
        reconciled: true,
        labelsToAdd,
        labelsToRemove,
        finalLabels,
      }
    }

    it('transitions autorelease: pending to autorelease: tagged when all release artifacts are verified', () => {
      const result = reconcilePrLabels({
        mode: 'automated',
        tagExists: true,
        npmExists: true,
        ghReleaseExists: true,
        currentLabels: ['autorelease: pending'],
      })

      expect(result.reconciled).toBe(true)
      expect(result.labelsToRemove).toEqual(['autorelease: pending'])
      expect(result.labelsToAdd).toEqual(['autorelease: tagged'])
      expect(result.finalLabels).toEqual(['autorelease: tagged'])
    })

    it('is idempotent on retry when release PR is already tagged', () => {
      const result = reconcilePrLabels({
        mode: 'automated',
        tagExists: true,
        npmExists: true,
        ghReleaseExists: true,
        currentLabels: ['autorelease: tagged'],
      })

      expect(result.reconciled).toBe(true)
      expect(result.labelsToRemove).toEqual([])
      expect(result.labelsToAdd).toEqual([])
      expect(result.finalLabels).toEqual(['autorelease: tagged'])
    })

    it('cleans up when both pending and tagged labels coexist', () => {
      const result = reconcilePrLabels({
        mode: 'automated',
        tagExists: true,
        npmExists: true,
        ghReleaseExists: true,
        currentLabels: ['autorelease: pending', 'autorelease: tagged'],
      })

      expect(result.reconciled).toBe(true)
      expect(result.labelsToRemove).toEqual(['autorelease: pending'])
      expect(result.labelsToAdd).toEqual([])
      expect(result.finalLabels).toEqual(['autorelease: tagged'])
    })

    it('adds autorelease: tagged when neither label exists but release is complete', () => {
      const result = reconcilePrLabels({
        mode: 'automated',
        tagExists: true,
        npmExists: true,
        ghReleaseExists: true,
        currentLabels: [],
      })

      expect(result.reconciled).toBe(true)
      expect(result.labelsToRemove).toEqual([])
      expect(result.labelsToAdd).toEqual(['autorelease: tagged'])
      expect(result.finalLabels).toEqual(['autorelease: tagged'])
    })

    it('does NOT transition labels if git tag is missing', () => {
      const result = reconcilePrLabels({
        mode: 'automated',
        tagExists: false,
        npmExists: true,
        ghReleaseExists: true,
        currentLabels: ['autorelease: pending'],
      })

      expect(result.reconciled).toBe(false)
      expect(result.finalLabels).toEqual(['autorelease: pending'])
      expect(result.error).toContain('Incomplete release')
    })

    it('does NOT transition labels if npm package is missing', () => {
      const result = reconcilePrLabels({
        mode: 'automated',
        tagExists: true,
        npmExists: false,
        ghReleaseExists: true,
        currentLabels: ['autorelease: pending'],
      })

      expect(result.reconciled).toBe(false)
      expect(result.finalLabels).toEqual(['autorelease: pending'])
      expect(result.error).toContain('Incomplete release')
    })

    it('does NOT transition labels if GitHub release is missing', () => {
      const result = reconcilePrLabels({
        mode: 'automated',
        tagExists: true,
        npmExists: true,
        ghReleaseExists: false,
        currentLabels: ['autorelease: pending'],
      })

      expect(result.reconciled).toBe(false)
      expect(result.finalLabels).toEqual(['autorelease: pending'])
      expect(result.error).toContain('Incomplete release')
    })

    it('no-ops safely in manual modes (bootstrap/retry) where no release PR event exists', () => {
      const result = reconcilePrLabels({
        mode: 'retry',
        tagExists: true,
        npmExists: true,
        ghReleaseExists: true,
        currentLabels: ['some-custom-label'],
      })

      expect(result.reconciled).toBe(false)
      expect(result.labelsToAdd).toEqual([])
      expect(result.labelsToRemove).toEqual([])
      expect(result.finalLabels).toEqual(['some-custom-label'])
    })
  })
})
