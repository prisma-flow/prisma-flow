/**
 * `prisma-flow repair` — detect drift and generate plan-only recovery suggestions.
 * In V1, automatic mutation is disabled to prevent accidental data or history loss.
 */

import chalk from 'chalk'
import { Command } from 'commander'
import { writeAuditEntry } from '../core/audit.js'
import { detectDrift } from '../core/drift-detector.js'
import { buildDriftRepairPlan } from '../core/drift-recovery.js'
import { detectPrismaProject } from '../core/prisma-detector.js'
import { trackEvent } from '../core/telemetry.js'

export function repairCommand() {
  return new Command('repair')
    .description('Detect schema drift and generate plan-only recovery guidance')
    .option('--apply', 'Disabled in V1: mutating repair is plan-only')
    .option('--json', 'Output as JSON')
    .action(async (options: { apply?: boolean; json?: boolean }) => {
      const cwd = process.cwd()

      if (options.apply) {
        const errorMsg =
          'Automatic mutating repair is disabled in PrismaFlow V1 for database safety. `prisma-flow repair` is strictly plan-only. Please review the recovery plan and execute any verified actions manually.'
        if (options.json) {
          process.stdout.write(
            `${JSON.stringify({ ok: false, error: errorMsg, mutatingDisabled: true })}\n`,
          )
        } else {
          console.error(chalk.red(`✖  ${errorMsg}`))
        }
        process.exit(1)
      }

      try {
        const project = await detectPrismaProject(cwd)
        if (!project) {
          console.error(chalk.red('✖  No Prisma project found.'))
          process.exit(1)
        }

        if (!options.json) {
          process.stdout.write(chalk.dim('  Detecting schema drift...\n'))
        }

        const driftResult = await detectDrift(cwd)

        if (driftResult.status === 'error') {
          if (options.json) {
            process.stdout.write(
              `${JSON.stringify({ ok: false, error: driftResult.errorMessage })}\n`,
            )
          } else {
            console.error(chalk.red(`✖  Drift detection failed: ${driftResult.errorMessage}`))
          }
          process.exit(1)
        }

        if (driftResult.status === 'clean' || driftResult.items.length === 0) {
          if (options.json) {
            process.stdout.write(
              `${JSON.stringify({ ok: true, drifted: false, plan: buildDriftRepairPlan([]) })}\n`,
            )
          } else {
            console.log(chalk.green('  ✔  No drift detected — database schema is in sync.'))
          }
          process.exit(0)
        }

        const plan = buildDriftRepairPlan(driftResult.items, project.migrationsPath)

        if (options.json) {
          process.stdout.write(`${JSON.stringify({ ok: true, drifted: true, plan }, null, 2)}\n`)
          process.exit(0)
        }

        console.log()
        console.log(chalk.bold.cyan(' 🔧  PrismaFlow Drift Recovery Plan (Plan-Only)'))
        console.log(chalk.dim('━'.repeat(60)))
        console.log(
          `  ${chalk.bold('Drift items found:')} ${chalk.yellow(driftResult.items.length.toString())}`,
        )
        console.log(
          chalk.dim('  All suggestions are advisory for manual review before operator execution.'),
        )
        console.log()

        for (const suggestion of plan.suggestions) {
          const riskColor =
            suggestion.risk === 'critical' || suggestion.risk === 'high'
              ? chalk.red
              : suggestion.risk === 'medium'
                ? chalk.yellow
                : chalk.green
          console.log(
            `  ${riskColor('●')} [${riskColor(suggestion.risk.toUpperCase())}] ${suggestion.description}`,
          )
          console.log(
            `     Strategy: ${chalk.cyan(suggestion.strategy)} ${chalk.dim('(manual operator review)')}`,
          )
          for (const w of suggestion.warnings) {
            console.log(`     ${chalk.yellow('⚠')} ${chalk.dim(w)}`)
          }
          if (suggestion.sql) {
            console.log(chalk.dim(`     ${suggestion.sql.split('\n')[0]}`))
          }
        }

        console.log()
        console.log(
          chalk.dim(
            '  Note: PrismaFlow V1 is strictly plan-only. To resolve history records, use `prisma migrate resolve` manually.',
          ),
        )
        console.log()

        await Promise.all([
          writeAuditEntry(cwd, 'drift.repair', 'success', {
            items: driftResult.items.length,
            planOnly: true,
          }),
          trackEvent('repair', driftResult.items.length),
        ]).catch(() => {})

        process.exit(driftResult.items.length > 0 ? 2 : 0)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(chalk.red(`✖  ${message}`))
        process.exit(1)
      }
    })
}
