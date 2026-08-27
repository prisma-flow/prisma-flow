import { Hono } from 'hono'
import { detectDrift } from '../../core/drift-detector.js'
import { buildDriftRepairPlan } from '../../core/drift-recovery.js'
import { detectPrismaProject } from '../../core/prisma-detector.js'

type Variables = { projectPath: string; requestId: string }
const app = new Hono<{ Variables: Variables }>()

/** GET /api/repair — return plan-only repair guidance for current drift */
app.get('/', async (c) => {
  const projectPath = c.get('projectPath') as string
  try {
    const project = await detectPrismaProject(projectPath)
    if (!project) return c.json({ success: false, error: 'No Prisma project found' }, 404)

    const driftResult = await detectDrift(projectPath)
    if (driftResult.status === 'error') {
      return c.json(
        {
          success: false,
          error: driftResult.errorMessage ?? 'Drift detection failed',
        },
        502,
      )
    }

    const plan = buildDriftRepairPlan(driftResult.items, project.migrationsPath)
    return c.json({
      success: true,
      data: { drifted: driftResult.status === 'drifted', plan },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, error: message }, 500)
  }
})

/** POST /api/repair/apply — disabled in V1 (plan-only) */
app.post('/apply', async (c) => {
  return c.json(
    {
      success: false,
      error:
        'Automatic mutating repair is disabled in PrismaFlow V1. Use `prisma-flow repair` for plan-only recovery guidance.',
      mutatingDisabled: true,
    },
    400,
  )
})

export default app
