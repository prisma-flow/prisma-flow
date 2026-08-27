/**
 * `prisma-flow simulate` — simulate or statically analyze a migration without modifying production data.
 * Distinguishes executed verification (shadow DB) from static analysis (heuristics).
 */

import path from 'node:path'
import chalk from 'chalk'
import { Command } from 'commander'
import { writeAuditEntry } from '../core/audit.js'
import { detectPrismaProject, resolveSqliteFilePath } from '../core/prisma-detector.js'
import { simulate } from '../core/simulator.js'
import { trackEvent } from '../core/telemetry.js'

export function simulateCommand() {
  return new Command('simulate')
    .description('Dry-run a migration or perform static SQL analysis to preview changes')
    .argument('<migration>', 'Migration name or timestamp prefix')
    .option('--json', 'Output as JSON')
    .option('--fail-on-destructive', 'Exit with code 2 if destructive statements are found')
    .action(
      async (migrationQuery: string, options: { json?: boolean; failOnDestructive?: boolean }) => {
        const cwd = process.cwd()
        try {
          const project = await detectPrismaProject(cwd)
          if (!project) {
            console.error(chalk.red('✖  No Prisma project found.'))
            process.exit(1)
          }

          const match = project.migrations.find(
            (m) =>
              m.name === migrationQuery ||
              m.name.startsWith(migrationQuery) ||
              m.timestamp.startsWith(migrationQuery),
          )

          if (!match) {
            console.error(chalk.red(`✖  Migration "${migrationQuery}" not found.`))
            process.exit(1)
          }

          const sqlFile = path.join(project.migrationsPath, match.name, 'migration.sql')

          const dbPath =
            project.provider === 'sqlite' && project.databaseUrl
              ? (resolveSqliteFilePath(project.databaseUrl, project.schemaPath) ?? undefined)
              : undefined

          const result = await simulate(
            match.name,
            sqlFile,
            dbPath,
            project.provider,
            process.env.PRISMAFLOW_SHADOW_DATABASE_URL,
            project.databaseUrl,
          )

          if (options.json) {
            process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
            process.exit(0)
          }

          console.log()
          console.log(chalk.bold.cyan(` 🔬  Migration Simulation: ${match.name}`))
          console.log(chalk.dim('━'.repeat(60)))

          let verificationLabel = chalk.yellow('Static analysis only — execution not verified')
          if (result.verification === 'executed') {
            verificationLabel =
              result.outcome === 'success'
                ? chalk.green('Executed successfully in shadow database')
                : chalk.red('Executed with failure in shadow database')
          } else if (result.verification === 'not-verified') {
            verificationLabel = chalk.dim('Not verified for this provider')
          }

          console.log(`  ${chalk.bold('Verification:')} ${verificationLabel}`)
          console.log(`  ${chalk.bold('Outcome:')}      ${result.outcome.toUpperCase()}`)
          console.log(
            `  ${chalk.bold('Statements:')}   ${result.statements.length} (${result.destructiveStatements} destructive)`,
          )
          console.log()

          for (const stmt of result.statements) {
            const icon = stmt.isDestructive ? chalk.red('⚠') : chalk.green('✓')
            const typeLabel = chalk.dim(`[${stmt.type}]`)
            const preview = stmt.sql.slice(0, 70).replace(/\n/g, ' ')
            console.log(
              `  ${icon} ${typeLabel} ${preview}${stmt.sql.length > 70 ? chalk.dim('…') : ''}`,
            )
            for (const w of stmt.warnings) {
              console.log(`      ${chalk.yellow('→')} ${chalk.yellow(w)}`)
            }
          }

          if (result.warnings.length > 0) {
            console.log()
            console.log(chalk.bold('  Warnings:'))
            for (const w of result.warnings) {
              console.log(`    ${chalk.yellow('⚠')} ${w}`)
            }
          }

          if (result.outcome === 'failure' && result.error) {
            console.log()
            console.log(chalk.red(`  ✖  Execution Error: ${result.error}`))
          }

          console.log()

          await Promise.all([
            writeAuditEntry(
              cwd,
              'migration.simulate',
              result.outcome === 'failure' ? 'failure' : 'success',
              {
                migration: match.name,
                verification: result.verification,
                outcome: result.outcome,
                destructive: result.destructiveStatements,
              },
            ),
            trackEvent('simulate', result.statements.length),
          ]).catch(() => {})

          if (result.outcome === 'failure') process.exit(1)
          if (options.failOnDestructive && result.destructiveStatements > 0) process.exit(2)
          process.exit(0)
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err)
          console.error(chalk.red(`✖  ${message}`))
          process.exit(1)
        }
      },
    )
}
