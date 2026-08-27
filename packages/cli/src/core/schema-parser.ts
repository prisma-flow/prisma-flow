import { logger } from '../logger.js'
// @prisma/internals does not ship official type declarations — we use a dynamic
// import with a cast to avoid brittle @ts-ignore comments while still benefiting
// from the functionality the package provides.
import { detectPrismaProject } from './prisma-detector.js'

type GetDMMFFn = (options: {
  datamodel: string
}) => Promise<{ datamodel: unknown }>

const PARSER_URLS: Record<string, string> = {
  postgresql: 'postgresql://prisma-flow:parser@localhost:5432/prisma_flow_parser',
  mysql: 'mysql://prisma-flow:parser@localhost:3306/prisma_flow_parser',
  sqlite: 'file:./prisma-flow-parser.db',
  sqlserver:
    'sqlserver://localhost:1433;database=prisma_flow_parser;user=prisma-flow;password=parser;trustServerCertificate=true',
  mongodb: 'mongodb://localhost:27017/prisma_flow_parser',
}

/**
 * Prisma 7 permits datasource URLs in prisma.config.ts, while older internals
 * still require a URL when parsing a datamodel. DMMF generation is static and
 * never connects, so supply a provider-valid in-memory URL only for that API.
 * The source schema is never written or changed.
 */
export function schemaForStaticDmmf(schema: string): string {
  return schema.replace(/datasource\s+(\w+)\s*\{([\s\S]*?)\}/g, (block, name, body: string) => {
    if (/\burl\s*=/.test(body)) return block
    const provider = body.match(/provider\s*=\s*['\"]([^'\"]+)['\"]/)?.[1]?.toLowerCase()
    const url = provider ? PARSER_URLS[provider] : undefined
    if (!url) return block
    return `datasource ${name} {${body}\n  // Prisma Flow parser compatibility URL; never persisted or connected.\n  url = \"${url}\"\n}`
  })
}

async function loadGetDMMF(): Promise<GetDMMFFn> {
  const mod = await import('@prisma/internals')
  // The package may export as default or as a named export depending on version
  const fn =
    (mod as { getDMMF?: GetDMMFFn }).getDMMF ?? (mod.default as { getDMMF?: GetDMMFFn })?.getDMMF
  if (typeof fn !== 'function') {
    throw new Error('@prisma/internals did not export getDMMF — check the installed Prisma version')
  }
  return fn
}

export async function parseSchema(cwd: string): Promise<unknown | null> {
  const project = await detectPrismaProject(cwd)
  if (!project) return null

  try {
    const getDMMF = await loadGetDMMF()
    const dmmf = await getDMMF({ datamodel: schemaForStaticDmmf(project.schemaContent) })
    return dmmf.datamodel
  } catch (err: unknown) {
    logger.error({ err }, 'Schema parse error')
    throw err
  }
}
