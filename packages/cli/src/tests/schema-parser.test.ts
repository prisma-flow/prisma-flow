import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { parseSchema, schemaForStaticDmmf } from '../core/schema-parser.js'

const temporaryDirectories: string[] = []
afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => fs.rm(directory, { recursive: true, force: true })),
  )
})

describe('schemaForStaticDmmf', () => {
  it('preserves classic datasource URLs', () => {
    const schema = 'datasource db { provider = "postgresql" url = env("DATABASE_URL") }'
    expect(schemaForStaticDmmf(schema)).toBe(schema)
  })

  it('adds an in-memory provider-valid URL for config-based PostgreSQL schemas', () => {
    const parsed = schemaForStaticDmmf('datasource db { provider = "postgresql" }')
    expect(parsed).toContain(
      'url = "postgresql://prisma-flow:parser@localhost:5432/prisma_flow_parser"',
    )
    expect(parsed).toContain('never persisted or connected')
  })

  it('does not invent URLs for an invalid datasource block', () => {
    const schema = 'datasource db { provider = "unsupported" }'
    expect(schemaForStaticDmmf(schema)).toBe(schema)
  })

  it('parses a Prisma 7-style schema with a config-owned datasource URL without connecting', async () => {
    const project = await fs.mkdtemp(path.join(os.tmpdir(), 'prisma-flow-schema-'))
    temporaryDirectories.push(project)
    await fs.mkdir(path.join(project, 'prisma'))
    await fs.writeFile(
      path.join(project, 'prisma', 'schema.prisma'),
      [
        'generator client {',
        '  provider = "prisma-client-js"',
        '}',
        'datasource db {',
        '  provider = "postgresql"',
        '}',
        'model User {',
        '  id Int @id',
        '}',
      ].join('\n'),
    )
    await fs.writeFile(
      path.join(project, 'prisma.config.ts'),
      "export default { schema: 'prisma/schema.prisma', datasource: { url: 'config-owned' } }",
    )

    const datamodel = (await parseSchema(project)) as { models: Array<{ name: string }> }
    expect(datamodel.models.map((model) => model.name)).toEqual(['User'])
  })
})
