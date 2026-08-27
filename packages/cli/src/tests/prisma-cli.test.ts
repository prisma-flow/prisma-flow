import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { execPrisma, execPrismaMigrateDiff } from '../core/prisma-cli.js'

describe('execPrisma', () => {
  it('runs a project-local Prisma CLI entrypoint with structured args', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prisma-flow-cli-'))
    const cliDir = path.join(tempDir, 'node_modules', 'prisma', 'build')
    await fs.mkdir(cliDir, { recursive: true })
    await fs.writeFile(
      path.join(cliDir, 'index.js'),
      'console.log(JSON.stringify(process.argv.slice(2)))\n',
      'utf-8',
    )

    const result = await execPrisma(
      tempDir,
      ['migrate', 'status', '--schema', 'prisma/schema.prisma'],
      { timeout: 5_000 },
    )

    expect(JSON.parse(result.stdout)).toEqual([
      'migrate',
      'status',
      '--schema',
      'prisma/schema.prisma',
    ])
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it('rejects with a timeout error when Prisma does not exit', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prisma-flow-cli-'))
    const cliDir = path.join(tempDir, 'node_modules', 'prisma', 'build')
    await fs.mkdir(cliDir, { recursive: true })
    await fs.writeFile(path.join(cliDir, 'index.js'), 'setInterval(() => {}, 1000)\n', 'utf-8')

    await expect(execPrisma(tempDir, ['migrate', 'diff'], { timeout: 100 })).rejects.toMatchObject({
      code: 'ETIMEDOUT',
    })
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it('uses Prisma 7 migrate diff flags when they are supported', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prisma-flow-cli-'))
    const cliDir = path.join(tempDir, 'node_modules', 'prisma', 'build')
    await fs.mkdir(cliDir, { recursive: true })
    await fs.writeFile(
      path.join(cliDir, 'index.js'),
      'console.log(JSON.stringify(process.argv.slice(2)))\n',
      'utf-8',
    )

    const result = await execPrismaMigrateDiff(tempDir, {
      fromSchema: 'prisma/schema.prisma',
      legacyDestinationArgs: ['--to-schema-datasource', 'prisma/schema.prisma'],
      timeout: 5_000,
    })

    expect(JSON.parse(result.stdout)).toEqual([
      'migrate',
      'diff',
      '--from-schema',
      'prisma/schema.prisma',
      '--to-config-datasource',
      '--script',
    ])
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it('retries with Prisma 5/6 migrate diff flags when needed', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prisma-flow-cli-'))
    const cliDir = path.join(tempDir, 'node_modules', 'prisma', 'build')
    await fs.mkdir(cliDir, { recursive: true })
    await fs.writeFile(
      path.join(cliDir, 'index.js'),
      [
        'const args = process.argv.slice(2)',
        "if (args.includes('--from-schema')) {",
        "  console.error('Unknown option: --from-schema')",
        '  process.exit(1)',
        '}',
        'console.log(JSON.stringify(args))',
      ].join('\n'),
      'utf-8',
    )

    const result = await execPrismaMigrateDiff(tempDir, {
      fromSchema: 'prisma/schema.prisma',
      legacyDestinationArgs: ['--to-schema-datasource', 'prisma/schema.prisma'],
      timeout: 5_000,
    })

    expect(JSON.parse(result.stdout)).toEqual([
      'migrate',
      'diff',
      '--from-schema-datamodel',
      'prisma/schema.prisma',
      '--to-schema-datasource',
      'prisma/schema.prisma',
      '--script',
    ])
    await fs.rm(tempDir, { recursive: true, force: true })
  })
})
