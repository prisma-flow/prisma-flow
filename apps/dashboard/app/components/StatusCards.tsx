import { Activity, AlertTriangle, CheckCircle2, Clock, Database, Gauge } from 'lucide-react'
import type { ProjectStatus } from '../../lib/api'

function riskClass(level: ProjectStatus['riskLevel']) {
  if (level === 'critical' || level === 'high') return 'text-destructive'
  if (level === 'medium') return 'text-yellow-500'
  return 'text-green-500'
}

function readinessClass(status: ProjectStatus['deploymentReadiness']['status']) {
  if (status === 'blocked') return 'text-destructive'
  if (status === 'attention') return 'text-yellow-500'
  return 'text-green-500'
}

export function StatusCards({ status }: { status: ProjectStatus }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {/* Database Status */}
      <div className="min-w-0 rounded-xl border bg-card p-4 text-card-foreground shadow sm:p-5">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium tracking-tight">Database status</h3>
          <Database
            className={status.connected ? 'h-4 w-4 text-green-500' : 'h-4 w-4 text-destructive'}
          />
        </div>
        <div className="text-2xl font-bold leading-tight">
          {status.connected ? 'Connected' : 'Disconnected'}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {status.lastSync ? `Synced ${new Date(status.lastSync).toLocaleTimeString()}` : ''}
        </p>
      </div>

      {/* Pending Migrations */}
      <div className="min-w-0 rounded-xl border bg-card p-4 text-card-foreground shadow sm:p-5">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium tracking-tight">Pending migrations</h3>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold leading-tight">{status.migrationsPending}</div>
        <p className="mt-1 text-xs text-muted-foreground">
          {status.migrationsApplied} applied total
        </p>
      </div>

      {/* Failed Migrations */}
      <div className="min-w-0 rounded-xl border bg-card p-4 text-card-foreground shadow sm:p-5">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium tracking-tight">Failed migrations</h3>
          <AlertTriangle
            className={
              status.migrationsFailed > 0
                ? 'h-4 w-4 text-destructive'
                : 'h-4 w-4 text-muted-foreground'
            }
          />
        </div>
        <div className="text-2xl font-bold leading-tight">{status.migrationsFailed}</div>
        <p className="mt-1 text-xs text-muted-foreground">Action required if &gt; 0</p>
      </div>

      {/* Risk Level */}
      <div className="min-w-0 rounded-xl border bg-card p-4 text-card-foreground shadow sm:p-5">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium tracking-tight">Risk level</h3>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
        <div
          className={`text-2xl font-bold capitalize leading-tight ${riskClass(status.riskLevel)}`}
        >
          {status.riskLevel}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Based on drift, failures, and SQL</p>
      </div>

      {/* Health Score */}
      <div className="min-w-0 rounded-xl border bg-card p-4 text-card-foreground shadow sm:p-5">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium tracking-tight">Health score</h3>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </div>
        <div
          className={`text-2xl font-bold leading-tight ${status.healthScore >= 90 ? 'text-green-500' : status.healthScore >= 70 ? 'text-yellow-500' : 'text-destructive'}`}
        >
          {status.healthScore}/100
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Schema and migration confidence</p>
      </div>

      {/* Deployment Readiness */}
      <div className="min-w-0 rounded-xl border bg-card p-4 text-card-foreground shadow sm:p-5">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium tracking-tight">Readiness</h3>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div
          className={`text-2xl font-bold capitalize leading-tight ${readinessClass(status.deploymentReadiness.status)}`}
        >
          {status.deploymentReadiness.status}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{status.deploymentReadiness.summary}</p>
      </div>
    </div>
  )
}
