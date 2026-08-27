import { randomBytes } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { logger } from '../logger.js'
import auditRoutes from './routes/audit.js'
import compareRoutes from './routes/compare.js'
import configRoutes from './routes/config.js'
import diffRoutes from './routes/diff.js'
import driftRoutes from './routes/drift.js'
import eventsRoutes from './routes/events.js'
import gitRoutes from './routes/git.js'
import migrationsRoutes from './routes/migrations.js'
import planRoutes from './routes/plan.js'
import repairRoutes from './routes/repair.js'
import risksRoutes from './routes/risks.js'
import rollbackRoutes from './routes/rollback.js'
import schemaRoutes from './routes/schema.js'
import simulateRoutes from './routes/simulate.js'
import statusRoutes from './routes/status.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ─── Typed context variables ─────────────────────────────────────────────────
type Variables = {
  projectPath: string
  requestId: string
}

export function createServer(projectPath: string): {
  app: Hono<{ Variables: Variables }>
  token: string
} {
  const app = new Hono<{ Variables: Variables }>()

  // Generate a per-session bearer token so only the local browser session can reach the API.
  const token = randomBytes(24).toString('hex')

  // ── Security headers ────────────────────────────────────────────────────
  app.use('*', secureHeaders())

  // ── CORS — loopback / localhost only ────────────────────────────────────
  app.use(
    '*',
    cors({
      origin: (origin) => {
        if (!origin) return null // same-origin (served HTML) — allow
        try {
          const url = new URL(origin)
          if (
            url.hostname === 'localhost' ||
            url.hostname === '127.0.0.1' ||
            url.hostname === '::1' ||
            url.hostname === '[::1]'
          ) {
            return origin
          }
        } catch {
          /* invalid origin — deny */
        }
        return null
      },
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    }),
  )

  // ── Request ID & Sanitized Request Logging ──────────────────────────────
  app.use('*', async (c, next) => {
    c.set('requestId', randomBytes(8).toString('hex'))
    c.res.headers.set('X-Request-Id', c.get('requestId'))
    await next()
  })

  app.use('*', async (c, next) => {
    const started = Date.now()
    await next()
    // Pathname only — NEVER log query params which may contain session tokens
    const parsedUrl = new URL(c.req.url)
    logger.debug(
      {
        method: c.req.method,
        path: parsedUrl.pathname,
        status: c.res.status,
        durationMs: Date.now() - started,
        requestId: c.get('requestId'),
      },
      'HTTP request',
    )
  })

  // ── Auth token guard (all /api/* routes) ────────────────────────────────
  app.use('/api/*', async (c, next) => {
    const authHeader = c.req.header('Authorization') ?? ''
    const queryToken = c.req.query('token') ?? ''
    const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : queryToken

    if (provided !== token) {
      return c.json({ success: false, error: 'Unauthorized — valid auth token required' }, 401)
    }
    return next()
  })

  // ── Project path injection ───────────────────────────────────────────────
  app.use('*', async (c, next) => {
    c.set('projectPath', projectPath)
    await next()
  })

  // ── API Routes ───────────────────────────────────────────────────────────
  app.route('/api/migrations', migrationsRoutes)
  app.route('/api/plan', planRoutes)
  app.route('/api/status', statusRoutes)
  app.route('/api/schema', schemaRoutes)
  app.route('/api/drift', driftRoutes)
  app.route('/api/risks', risksRoutes)
  app.route('/api/rollback', rollbackRoutes)
  app.route('/api/simulate', simulateRoutes)
  app.route('/api/repair', repairRoutes)
  app.route('/api/diff', diffRoutes)
  app.route('/api/compare', compareRoutes)
  app.route('/api/git', gitRoutes)
  app.route('/api/audit', auditRoutes)
  app.route('/api/config', configRoutes)
  app.route('/api/events', eventsRoutes)

  // ── Health (no auth required — used by process monitors) ─────────────────
  app.get('/health', (c) => {
    return c.json({
      status: 'ok',
      service: 'prisma-flow',
      uptime: process.uptime(),
    })
  })

  // ── Static dashboard ─────────────────────────────────────────────────────
  const candidates = [
    path.resolve(__dirname, '../public'), // dist/public
    path.resolve(__dirname, '../../public'), // packages/cli/public (source)
    path.resolve(__dirname, '../../..', 'packages', 'cli', 'public'), // monorepo relative
    path.resolve(process.cwd(), 'public'), // cwd public
    path.resolve(process.cwd(), 'packages', 'cli', 'public'),
    path.resolve(process.cwd(), '..', 'packages', 'cli', 'public'),
  ]

  let publicDir: string | null = null
  for (const cand of candidates) {
    if (fs.existsSync(cand)) {
      publicDir = cand
      break
    }
  }

  if (!publicDir) {
    publicDir = path.resolve(__dirname, '../public')
  }

  if (!fs.existsSync(publicDir)) {
    logger.warn({ publicDir }, 'serveStatic: public directory not found')
  }

  app.use(
    '/*',
    serveStatic({
      root: publicDir,
      rewriteRequestPath: (p) => (p === '/' ? '/index.html' : p),
    }),
  )

  // SPA fallback — serve index.html for unmatched paths
  app.get('*', async (c) => {
    try {
      const indexPath = path.join(publicDir, 'index.html')
      if (fs.existsSync(indexPath)) {
        const content = await fs.promises.readFile(indexPath, 'utf-8')
        return c.html(content)
      }
      return c.text('Dashboard not built — run `npm run build` first', 404)
    } catch {
      return c.text('Error serving dashboard', 500)
    }
  })

  return { app, token }
}

export function isLoopbackAddress(host: string): boolean {
  const normalized = host.trim().toLowerCase()
  return (
    normalized === '127.0.0.1' ||
    normalized === 'localhost' ||
    normalized === '::1' ||
    normalized === '[::1]' ||
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(normalized)
  )
}

export function startServer(
  app: Hono<{ Variables: Variables }>,
  port = 5555,
  hostname = process.env.PRISMAFLOW_HOST || '127.0.0.1',
): ReturnType<typeof serve> {
  if (!isLoopbackAddress(hostname)) {
    const errorMsg = `SecurityError: PrismaFlow V1 strictly rejects non-loopback bindings (${hostname}) for database safety. Only loopback addresses (127.0.0.1, localhost, ::1) are allowed.`
    logger.error({ hostname }, errorMsg)
    throw new Error(errorMsg)
  }

  const server = serve({ fetch: app.fetch, port, hostname }, (info) => {
    logger.info({ port: info.port, hostname }, 'PrismaFlow API running on loopback')
  })

  const shutdown = () => {
    logger.info('Shutting down PrismaFlow server...')
    server.close(() => {
      logger.info('Server closed')
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 5_000).unref()
  }

  process.once('SIGTERM', shutdown)
  process.once('SIGINT', shutdown)

  return server
}
