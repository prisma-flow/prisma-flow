import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { analyseStatically, simulate, simulateSqlite, splitStatements } from '../core/simulator.js'

let tempDir: string | null = null

afterEach(async () => {
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true })
    tempDir = null
  }
})

describe('splitStatements', () => {
  it('keeps SQL statements that appear after comment headers', () => {
    const statements = splitStatements(`
-- CreateTable
CREATE TABLE "User" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
`)

    expect(statements).toHaveLength(2)
    expect(statements[0]).toContain('CREATE TABLE "User"')
    expect(statements[1]).toContain('CREATE UNIQUE INDEX')
  })
})

describe('analyseStatically', () => {
  it('identifies destructive operations without claiming success', () => {
    const statements = ['DROP TABLE "User"', 'CREATE TABLE "NewUser" (id INT)']
    const result = analyseStatically('drop_user', statements)

    expect(result.verification).toBe('static-analysis')
    expect(result.outcome).toBe('unknown')
    expect(result.destructiveStatements).toBe(1)
    expect(result.warnings.some((w) => w.includes('Drops a table'))).toBe(true)
  })
})

describe('simulateSqlite', () => {
  it('returns valid simulation result with explicit verification semantics', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prisma-flow-sim-test-'))
    const dbPath = path.join(tempDir, 'dev.db')
    const sqlPath = path.join(tempDir, 'migration.sql')
    await fs.writeFile(dbPath, '', 'utf-8')
    await fs.writeFile(sqlPath, 'CREATE TABLE "User" ("id" INTEGER);', 'utf-8')

    const result = await simulateSqlite('test_migration', sqlPath, dbPath)

    expect(result.statements).toHaveLength(1)
    expect(['executed', 'static-analysis']).toContain(result.verification)
    expect(['success', 'unknown']).toContain(result.outcome)
    expect(result.mode).toMatch(/shadow|static/)
  })
})

describe('simulate (provider routing)', () => {
  it('routes non-sqlite provider to static analysis with unknown outcome', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prisma-flow-sim-test-'))
    const sqlPath = path.join(tempDir, 'migration.sql')
    await fs.writeFile(sqlPath, 'CREATE TABLE "User" (id SERIAL PRIMARY KEY);', 'utf-8')

    const result = await simulate('test_postgres', sqlPath, undefined, 'postgresql')

    expect(result.verification).toBe('static-analysis')
    expect(result.outcome).toBe('unknown')
    expect(result.warnings.some((w) => w.includes('static analysis only'))).toBe(true)
  })
})
