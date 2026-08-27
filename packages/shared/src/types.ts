import type { z } from 'zod'
import type * as S from './schemas.js'

// ─── Inferred Types from Canonical Zod Schemas ───────────────────────────────

export type MigrationStatus = z.infer<typeof S.MigrationStatusSchema>
export type MigrationVerificationStatus = z.infer<typeof S.MigrationVerificationStatusSchema>
export type RiskLevel = z.infer<typeof S.RiskLevelSchema>

export type DriftType = z.infer<typeof S.DriftTypeSchema>
export type DriftDetectionStatus = z.infer<typeof S.DriftDetectionStatusSchema>
export type DriftRepairStrategy = z.infer<typeof S.DriftRepairStrategySchema>

export type LogLevel = z.infer<typeof S.LogLevelSchema>
export type WebhookType = z.infer<typeof S.WebhookTypeSchema>
export type WebhookEvent = z.infer<typeof S.WebhookEventSchema>
export type DatabaseProvider = z.infer<typeof S.DatabaseProviderSchema>
export type SchemaDiffType = z.infer<typeof S.SchemaDiffTypeSchema>

export type SimulationVerification = z.infer<typeof S.SimulationVerificationSchema>
export type SimulationOutcome = z.infer<typeof S.SimulationOutcomeSchema>
export type SimulationMode = z.infer<typeof S.SimulationModeSchema>
export type SimulationStatementType = z.infer<typeof S.SimulationStatementTypeSchema>

export type DeploymentReadinessStatus = z.infer<typeof S.DeploymentReadinessStatusSchema>
export type DeploymentReadinessCheckId = z.infer<typeof S.DeploymentReadinessCheckIdSchema>
export type DeploymentPlanPriority = z.infer<typeof S.DeploymentPlanPrioritySchema>
export type DeploymentPlanDecision = DeploymentReadinessStatus

export type Migration = z.infer<typeof S.MigrationSchema>
export type RiskFactor = z.infer<typeof S.RiskFactorSchema>
export type MigrationRiskScore = z.infer<typeof S.MigrationRiskScoreSchema>
export type RollbackStep = z.infer<typeof S.RollbackStepSchema>
export type RollbackPlan = z.infer<typeof S.RollbackPlanSchema>
export type MigrationDetail = z.infer<typeof S.MigrationDetailSchema>

export type DriftItem = z.infer<typeof S.DriftItemSchema>
export type DriftResult = z.infer<typeof S.DriftResultSchema>

export type DeploymentReadinessCheck = z.infer<typeof S.DeploymentReadinessCheckSchema>
export type DeploymentReadiness = z.infer<typeof S.DeploymentReadinessSchema>

export type DeploymentPlanAction = z.infer<typeof S.DeploymentPlanActionSchema>
export type DeploymentPlanCommand = z.infer<typeof S.DeploymentPlanCommandSchema>
export type DeploymentPlanMigrationSummary = z.infer<typeof S.DeploymentPlanMigrationSummarySchema>
export type DeploymentPlanDriftSummary = z.infer<typeof S.DeploymentPlanDriftSummarySchema>
export type DeploymentPlan = z.infer<typeof S.DeploymentPlanSchema>

export type ProjectStatus = z.infer<typeof S.ProjectStatusSchema>

export type SimulationStatement = z.infer<typeof S.SimulationStatementSchema>
export type SimulationResult = z.infer<typeof S.SimulationResultSchema>

export type DriftRecoverySuggestion = z.infer<typeof S.DriftRecoverySuggestionSchema>
export type DriftRepairPlan = z.infer<typeof S.DriftRepairPlanSchema>

export type SchemaDiff = z.infer<typeof S.SchemaDiffSchema>
export type MigrationHistoryDiff = z.infer<typeof S.MigrationHistoryDiffSchema>
export type EnvironmentComparisonEntry = z.infer<typeof S.EnvironmentComparisonEntrySchema>
export type EnvironmentComparison = z.infer<typeof S.EnvironmentComparisonSchema>

export type GitMigrationInfo = z.infer<typeof S.GitMigrationInfoSchema>
export type MigrationConflict = z.infer<typeof S.MigrationConflictSchema>

export type AuditAction = z.infer<typeof S.AuditActionSchema>
export type AuditEntry = z.infer<typeof S.AuditEntrySchema>

export type PaginationQuery = z.infer<typeof S.PaginationQuerySchema>
export type PaginationMeta = z.infer<typeof S.PaginationMetaSchema>

export type WebhookConfig = z.infer<typeof S.WebhookConfigSchema>
export type FeatureFlags = z.infer<typeof S.FeatureFlagsSchema>
export type EnvironmentEntry = z.infer<typeof S.EnvironmentEntrySchema>
export type PrismaFlowConfig = z.infer<typeof S.PrismaFlowConfigSchema>
export type PrismaFlowConfigParsed = z.infer<typeof S.PrismaFlowConfigSchema>

export type SSEEventType = z.infer<typeof S.SSEEventTypeSchema>
export type SSEEvent<T = unknown> = {
  type: SSEEventType
  data: T
  timestamp: string
}

export type SchemaField = z.infer<typeof S.SchemaFieldSchema>
export type SchemaModel = z.infer<typeof S.SchemaModelSchema>
export type SchemaEnum = z.infer<typeof S.SchemaEnumSchema>
export type SchemaDatamodel = z.infer<typeof S.SchemaDatamodelSchema>

// ─── API Envelope Types ──────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: PaginationMeta
}
