import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import chalk from 'chalk'
import { Command } from 'commander'
import { getPrismaAdapter } from '../core/adapters/index.js'
import { writeAuditEntry } from '../core/audit.js'
import { execPrisma } from '../core/prisma-cli.js'
import { detectPrismaProject } from '../core/prisma-detector.js'
import { trackEvent } from '../core/telemetry.js'

const execFileAsync = promisify(execFile)

interface Check {
  label: string
  run: () => Promise<{ ok: boolean; detail?: string }>
}

async function runChecks(checks: Check[]): Promise<{ passed: number; failed: number }> {
  let passed = 0
  let failed = 0

  for (const check of checks) {
    process.stdout.write(`  ${chalk.gray('•')} ${check.label} ... `)
    try {
      const { ok, detail } = await check.run()
      if (ok) {
        process.stdout.write(`${chalk.green('OK') + (detail ? chalk.gray(` (${detail})`) : '')}\n`)
        passed++
      } else {
        process.stdout.write(`${chalk.red('FAIL') + (detail ? chalk.gray(` — ${detail}`) : '')}\n`)
        failed++
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      process.stdout.write(`${chalk.red('ERROR') + chalk.gray(` — ${msg}`)}\n`)
      failed++
    }
  }

  return { passed, failed }
}

export function doctorCommand() {
  return new Command('doctor')
    .description('Validate the environment and project setup')
    .option('--json', 'Output result as JSON')
    .action(async (options: { json?: boolean }) => {
      const cwd = process.cwd()
      let totalPassed = 0
      let totalFailed = 0

      const merge = (r: { passed: number; failed: number }) => {
        totalPassed += r.passed
        totalFailed += r.failed
      }
      const project = await detectPrismaProject(cwd)

      if (!options.json) {
        console.log()
        console.log(chalk.bold.cyan(' 🩺  PrismaFlow Doctor'))
        console.log(chalk.dim('━'.repeat(50)))
        console.log(chalk.dim('  Checking environment...'))
      }

      // ── Environment checks ────────────────────────────────────────────────
      merge(
        await runChecks([
          {
            label: 'Node.js version ≥ 20',
            run: async () => {
              const [major] = process.versions.node.split('.').map(Number)
              return { ok: (major ?? 0) >= 20, detail: process.versions.node }
            },
          },
          {
            label: 'prisma CLI available',
            run: async () => {
              const { stdout } = await execPrisma(project?.projectRoot ?? cwd, ['--version'], {
                timeout: 15_000,
              })
              const version =
                stdout.match(/prisma\s+:\s+([\d.]+)/i)?.[1] ?? stdout.trim().split('\n')[0]
              return { ok: true, detail: version ?? 'unknown' }
            },
          },
        ]),
      )

      // ── Project checks ────────────────────────────────────────────────────
      merge(
        await runChecks([
          {
            label: 'prisma schema found',
            run: async () => ({
              ok: project !== null,
              detail: project ? path.relative(cwd, project.schemaPath) : 'not found',
            }),
          },
          {
            label: 'DATABASE_URL configured',
            run: async () => ({
              ok: Boolean(project?.databaseUrl || process.env.DATABASE_URL),
              detail:
                project?.databaseUrl || process.env.DATABASE_URL
                  ? 'set'
                  : 'not found in .env or environment',
            }),
          },
          {
            label: 'migrations directory exists',
            run: async () => {
              if (!project) return { ok: false, detail: 'no project' }
              try {
                await fs.access(project.migrationsPath)
                return {
                  ok: true,
                  detail: `${project.migrations.length} migration(s)`,
                }
              } catch {
                return {
                  ok: false,
                  detail: `${project.migrationsPath} not found`,
                }
              }
            },
          },
          {
            label: 'database provider detected',
            run: async () => ({
              ok: project?.provider !== null && project?.provider !== undefined,
              detail: project?.provider ?? 'unknown — check datasource block',
            }),
          },
          {
            label: 'prismaflow.config.ts present',
            run: async () => {
              const configCandidates = [
                path.join(cwd, 'prismaflow.config.ts'),
                path.join(cwd, 'prismaflow.config.js'),
                path.join(cwd, 'prismaflow.config.mjs'),
              ]
              for (const c of configCandidates) {
                try {
                  await fs.access(c)
                  return { ok: true, detail: path.relative(cwd, c) }
                } catch {
                  /* not found */
                }
              }
              return { ok: false, detail: 'not found — run: prisma-flow init' }
            },
          },
          {
            label: 'git repository detected',
            run: async () => {
              try {
                await execFileAsync('git', ['rev-parse', '--git-dir'], {
                  cwd,
                  timeout: 5_000,
                })
                const { stdout } = await execFileAsync(
                  'git',
                  ['rev-parse', '--abbrev-ref', 'HEAD'],
                  {
                    cwd,
                    timeout: 5_000,
                  },
                )
                return { ok: true, detail: `branch: ${stdout.trim()}` }
              } catch {
                return {
                  ok: false,
                  detail: 'not a git repo — git-awareness features unavailable',
                }
              }
            },
          },
        ]),
      )

      // ── Database connectivity ─────────────────────────────────────────────
      if (project) {
        merge(
          await runChecks([
            {
              label: 'database reachable and verified',
              run: async () => {
                const adapter = getPrismaAdapter(project.prismaVersion)
                const res = await adapter.getMigrationStatus(
                  project.projectRoot,
                  project.schemaPath,
                )
                if (res.connected && res.verification === 'verified') {
                  const pending = Array.from(res.statusMap.values()).filter(
                    (s) => s === 'pending',
                  ).length
                  return {
                    ok: true,
                    detail:
                      pending > 0
                        ? `connected — ${pending} pending migration(s)`
                        : 'connected and verified',
                  }
                }
                return {
                  ok: false,
                  detail: res.errorMessage || `unverified (${res.errorCode ?? 'unknown'})`,
                }
              },
            },
          ]),
        )
      } else if (!options.json) {
        console.log(chalk.dim('  Skipping database checks — no Prisma project found'))
      }

      // ── Summary ───────────────────────────────────────────────────────────
      const allOk = totalFailed === 0

      if (options.json) {
        process.stdout.write(
          `${JSON.stringify({ ok: allOk, passed: totalPassed, failed: totalFailed })}\n`,
        )
      } else {
        console.log(chalk.dim('━'.repeat(50)))
        if (allOk) {
          console.log(
            chalk.bold.green(` ✔  All ${totalPassed} checks passed — environment healthy`),
          )
        } else {
          console.log(
            chalk.bold.red(` ✖  ${totalFailed} check${totalFailed !== 1 ? 's' : ''} failed`) +
              chalk.dim(` (${totalPassed} passed)`),
          )
        }
        console.log()
      }

      await Promise.all([
        writeAuditEntry(cwd, 'doctor.run', allOk ? 'success' : 'warning', {
          passed: totalPassed,
          failed: totalFailed,
        }),
        trackEvent('doctor', project?.migrations.length ?? 0),
      ]).catch(() => {})

      process.exit(allOk ? 0 : 1)
    })
}
