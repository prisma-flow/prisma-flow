'use client'

import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import type { ProjectStatus } from '../../lib/api'
import { Badge } from './ui/badge'

export function HealthCheck({ status }: { status: ProjectStatus | null }) {
  if (!status) return <Badge variant="outline">Connecting…</Badge>

  let health: 'healthy' | 'warning' | 'error' = 'healthy'
  let message = 'System Operational'

  if (!status.connected) {
    health = 'error'
    message = 'DB Disconnected'
  } else if (status.migrationsFailed > 0) {
    health = 'error'
    message = 'Migration Failures'
  } else if (status.deploymentReadiness.status === 'blocked') {
    health = 'error'
    message = 'Deployment Blocked'
  } else if (status.driftDetected) {
    health = 'warning'
    message = `Schema Drift (${status.driftCount})`
  } else if (status.deploymentReadiness.status === 'attention') {
    health = 'warning'
    message = 'Review Needed'
  }

  const variants: Record<typeof health, string> = {
    healthy:
      'border-emerald-300 bg-emerald-100 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    warning:
      'border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100',
    error: 'bg-destructive/10 text-destructive hover:bg-destructive/10 border-destructive/20',
  }

  const Icon = health === 'healthy' ? CheckCircle2 : health === 'warning' ? AlertTriangle : XCircle

  return (
    <Badge variant="outline" className={`px-3 py-1 text-sm font-medium ${variants[health]}`}>
      <Icon className="mr-2 h-3.5 w-3.5" />
      {message}
    </Badge>
  )
}
