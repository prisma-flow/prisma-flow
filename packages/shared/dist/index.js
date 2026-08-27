// src/schemas.ts
import { z } from "zod";
var MigrationStatusSchema = z.enum(["applied", "pending", "failed", "unknown"]);
var MigrationVerificationStatusSchema = z.enum(["verified", "unknown", "error"]);
var RiskLevelSchema = z.enum(["low", "medium", "high", "critical"]);
var DriftTypeSchema = z.enum([
  "table-missing",
  "table-extra",
  "column-mismatch",
  "index-change",
  "constraint-change",
  "unknown",
  "missing_migration",
  "extra_column",
  "extra_table",
  "modified_migration"
]);
var DriftDetectionStatusSchema = z.enum(["clean", "drifted", "error", "not_checked"]);
var LogLevelSchema = z.enum(["trace", "debug", "info", "warn", "error"]);
var WebhookTypeSchema = z.enum(["slack", "discord", "http"]);
var WebhookEventSchema = z.enum([
  "drift-detected",
  "migration-failed",
  "check-complete",
  "migration-applied",
  "simulation-complete",
  "risk-threshold-exceeded"
]);
var DatabaseProviderSchema = z.enum([
  "postgresql",
  "mysql",
  "sqlite",
  "sqlserver",
  "mongodb"
]);
var DriftRepairStrategySchema = z.enum([
  "reconcile_history",
  "manual_migration",
  "manual_sql",
  "review_only"
]);
var SchemaDiffTypeSchema = z.enum([
  "model_added",
  "model_removed",
  "field_added",
  "field_removed",
  "field_type_changed",
  "added",
  "removed",
  "modified"
]);
var SimulationVerificationSchema = z.enum(["executed", "static-analysis", "not-verified"]);
var SimulationOutcomeSchema = z.enum(["success", "failure", "unknown"]);
var SimulationModeSchema = z.enum(["static", "shadow", "live"]);
var SimulationStatementTypeSchema = z.enum([
  "CREATE_TABLE",
  "ALTER_TABLE",
  "DROP_TABLE",
  "CREATE_INDEX",
  "DROP_INDEX",
  "INSERT",
  "UPDATE",
  "DELETE",
  "TRUNCATE",
  "OTHER"
]);
var DeploymentReadinessStatusSchema = z.enum(["ready", "attention", "blocked"]);
var DeploymentReadinessCheckIdSchema = z.enum([
  "database",
  "drift",
  "migration-verification",
  "failed-migrations",
  "pending-migrations",
  "critical-risks"
]);
var DeploymentPlanPrioritySchema = z.enum(["blocker", "recommended", "optional"]);
var MigrationSchema = z.object({
  name: z.string().min(1),
  timestamp: z.string(),
  status: MigrationStatusSchema,
  sqlPath: z.string(),
  createdAt: z.string().optional(),
  appliedAt: z.string().optional(),
  durationMs: z.number().int().nonnegative().optional()
});
var RiskFactorSchema = z.object({
  pattern: z.string(),
  severity: RiskLevelSchema,
  description: z.string(),
  affectedTable: z.string().optional(),
  estimatedRows: z.number().int().nonnegative().optional(),
  recommendation: z.string()
});
var MigrationRiskScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  level: RiskLevelSchema,
  factors: z.array(RiskFactorSchema)
});
var RollbackStepSchema = z.object({
  index: z.number().int().nonnegative(),
  forwardSql: z.string(),
  rollbackSql: z.string(),
  automated: z.boolean(),
  warning: z.string().optional()
});
var RollbackPlanSchema = z.object({
  migrationName: z.string(),
  steps: z.array(RollbackStepSchema).default([]),
  hasManualSteps: z.boolean().default(false),
  warnings: z.array(z.string()).default([]),
  generatedAt: z.string(),
  automated: z.boolean().default(false),
  sql: z.string().optional()
});
var MigrationDetailSchema = MigrationSchema.extend({
  sql: z.string(),
  risks: z.array(z.string()),
  riskScore: MigrationRiskScoreSchema.optional(),
  rollbackPlan: RollbackPlanSchema.optional(),
  gitBranch: z.string().optional()
});
var DriftItemSchema = z.object({
  sql: z.string(),
  type: DriftTypeSchema,
  description: z.string(),
  identifier: z.string().optional(),
  migrationName: z.string().optional()
});
var DriftResultSchema = z.object({
  hasDrift: z.boolean(),
  driftCount: z.number().int().nonnegative(),
  differences: z.array(DriftItemSchema),
  cachedAt: z.string().nullable(),
  status: DriftDetectionStatusSchema,
  errorMessage: z.string().optional()
});
var DeploymentReadinessCheckSchema = z.object({
  id: DeploymentReadinessCheckIdSchema,
  label: z.string(),
  passed: z.boolean(),
  message: z.string()
});
var DeploymentReadinessSchema = z.object({
  status: DeploymentReadinessStatusSchema,
  score: z.number().int().min(0).max(100),
  summary: z.string(),
  checks: z.array(DeploymentReadinessCheckSchema)
});
var DeploymentPlanActionSchema = z.object({
  priority: DeploymentPlanPrioritySchema,
  title: z.string(),
  detail: z.string(),
  command: z.string().optional(),
  href: z.string().optional()
});
var DeploymentPlanCommandSchema = z.object({
  label: z.string(),
  command: z.string(),
  reason: z.string()
});
var DeploymentPlanMigrationSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  applied: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  unknown: z.number().int().nonnegative().default(0),
  verification: MigrationVerificationStatusSchema.default("verified"),
  pendingNames: z.array(z.string()),
  failedNames: z.array(z.string()),
  highestRisk: z.object({
    name: z.string(),
    level: RiskLevelSchema,
    score: z.number().int().min(0).max(100),
    factors: z.array(RiskFactorSchema)
  }).optional()
});
var DeploymentPlanDriftSummarySchema = z.object({
  status: DriftDetectionStatusSchema,
  detected: z.boolean(),
  count: z.number().int().nonnegative(),
  errorMessage: z.string().optional()
});
var DeploymentPlanSchema = z.object({
  schemaVersion: z.literal("prismaflow-plan/v1"),
  generatedAt: z.string(),
  decision: DeploymentReadinessStatusSchema,
  score: z.number().int().min(0).max(100),
  summary: z.string(),
  project: z.object({
    schemaPath: z.string(),
    migrationsPath: z.string(),
    provider: DatabaseProviderSchema.optional(),
    prismaVersion: z.string().optional(),
    packageManager: z.string().optional(),
    hasDatabaseUrl: z.boolean()
  }),
  checks: z.array(DeploymentReadinessCheckSchema),
  migrations: DeploymentPlanMigrationSummarySchema,
  drift: DeploymentPlanDriftSummarySchema,
  actions: z.array(DeploymentPlanActionSchema),
  commands: z.array(DeploymentPlanCommandSchema),
  valueHighlights: z.array(z.string())
});
var ProjectStatusSchema = z.object({
  connected: z.boolean(),
  migrationVerification: MigrationVerificationStatusSchema.default("verified"),
  migrationsApplied: z.number().int().nonnegative(),
  migrationsPending: z.number().int().nonnegative(),
  migrationsFailed: z.number().int().nonnegative(),
  migrationsUnknown: z.number().int().nonnegative().default(0),
  driftDetected: z.boolean(),
  driftCount: z.number().int().nonnegative(),
  driftStatus: DriftDetectionStatusSchema.default("clean"),
  riskLevel: RiskLevelSchema,
  healthScore: z.number().int().min(0).max(100),
  deploymentReadiness: DeploymentReadinessSchema,
  lastSync: z.string(),
  provider: DatabaseProviderSchema.optional(),
  projectName: z.string().optional(),
  schemaPath: z.string().optional(),
  migrationsPath: z.string().optional(),
  prismaVersion: z.string().optional(),
  packageManager: z.string().optional(),
  hasDatabaseUrl: z.boolean().optional()
});
var SimulationStatementSchema = z.object({
  index: z.number().int().nonnegative(),
  sql: z.string(),
  type: SimulationStatementTypeSchema,
  isDestructive: z.boolean(),
  warnings: z.array(z.string()),
  estimatedRowsAffected: z.number().optional(),
  success: z.boolean().optional(),
  error: z.string().optional(),
  durationMs: z.number().nonnegative().optional()
});
var SimulationResultSchema = z.object({
  migrationName: z.string(),
  verification: SimulationVerificationSchema,
  outcome: SimulationOutcomeSchema,
  statements: z.array(SimulationStatementSchema),
  destructiveStatements: z.number().int().nonnegative(),
  warnings: z.array(z.string()),
  simulatedAt: z.string(),
  error: z.string().optional(),
  mode: SimulationModeSchema.optional()
});
var DriftRecoverySuggestionSchema = z.object({
  driftItem: DriftItemSchema,
  strategy: DriftRepairStrategySchema,
  description: z.string(),
  sql: z.string().optional(),
  automated: z.literal(false).default(false),
  risk: RiskLevelSchema,
  warnings: z.array(z.string()).default([])
});
var DriftRepairPlanSchema = z.object({
  generatedAt: z.string(),
  driftCount: z.number().int().nonnegative(),
  suggestions: z.array(DriftRecoverySuggestionSchema),
  isMutatingDisabled: z.literal(true).default(true)
});
var SchemaDiffSchema = z.object({
  type: SchemaDiffTypeSchema,
  modelName: z.string().optional(),
  fieldName: z.string().optional(),
  oldType: z.string().optional(),
  newType: z.string().optional(),
  description: z.string(),
  breaking: z.boolean(),
  entity: z.string().optional(),
  field: z.string().optional(),
  before: z.string().optional(),
  after: z.string().optional()
});
var MigrationHistoryDiffSchema = z.object({
  sourceEnv: z.string(),
  targetEnv: z.string(),
  sourceApplied: z.number().int().nonnegative(),
  targetApplied: z.number().int().nonnegative(),
  onlyInSource: z.array(z.string()),
  onlyInTarget: z.array(z.string()),
  divergencePoint: z.string().optional(),
  inSync: z.boolean(),
  name: z.string().optional(),
  presentInSource: z.boolean().optional(),
  presentInTarget: z.boolean().optional(),
  statusInSource: MigrationStatusSchema.optional(),
  statusInTarget: MigrationStatusSchema.optional()
});
var EnvironmentComparisonEntrySchema = z.object({
  name: z.string(),
  reachable: z.boolean(),
  appliedCount: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative()
});
var EnvironmentComparisonSchema = z.object({
  referenceEnv: z.string(),
  environments: z.array(EnvironmentComparisonEntrySchema),
  diffs: z.array(MigrationHistoryDiffSchema),
  allInSync: z.boolean(),
  comparedAt: z.string(),
  source: z.string().optional(),
  target: z.string().optional(),
  schemaDiffs: z.array(SchemaDiffSchema).optional(),
  migrationDiffs: z.array(MigrationHistoryDiffSchema).optional()
});
var GitMigrationInfoSchema = z.object({
  migrationName: z.string(),
  committed: z.boolean(),
  commitHash: z.string().optional(),
  commitAuthor: z.string().optional(),
  commitDate: z.string().optional(),
  commitMessage: z.string().optional(),
  branch: z.string().optional(),
  authorName: z.string().optional(),
  committedAt: z.string().optional()
});
var MigrationConflictSchema = z.object({
  timestamp: z.string(),
  migrations: z.array(z.string()),
  type: z.enum(["duplicate_timestamp", "timestamp-overlap", "name-conflict", "history-diverge"]),
  description: z.string(),
  migrationA: z.string().optional(),
  migrationB: z.string().optional(),
  branches: z.array(z.string()).optional(),
  conflictType: z.enum(["timestamp-overlap", "name-conflict", "history-diverge"]).optional()
});
var AuditActionSchema = z.enum([
  "dashboard.start",
  "status.check",
  "drift.detect",
  "drift.repair",
  "migration.check",
  "migration.apply",
  "migration.simulate",
  "migration.rollback",
  "migration.inspect",
  "migration.history",
  "migration.create",
  "deployment.plan",
  "doctor.run",
  "env.compare",
  "schema.diff"
]);
var AuditEntrySchema = z.object({
  timestamp: z.string(),
  action: AuditActionSchema,
  cwd: z.string(),
  result: z.enum(["success", "failure", "warning"]),
  detail: z.record(z.unknown()).optional()
});
var PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});
var PaginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  pages: z.number().int().nonnegative()
});
var WebhookConfigSchema = z.object({
  type: WebhookTypeSchema,
  url: z.string().url(),
  events: z.array(WebhookEventSchema).optional()
});
var FeatureFlagsSchema = z.object({
  riskAnalysis: z.boolean().default(true),
  webhookAlerts: z.boolean().default(false),
  auditLog: z.boolean().default(false),
  ciAnnotations: z.boolean().default(true),
  envComparison: z.boolean().default(false),
  rollbackGen: z.boolean().default(false),
  simulation: z.boolean().default(true),
  gitAwareness: z.boolean().default(false)
});
var EnvironmentEntrySchema = z.object({
  name: z.string().min(1),
  databaseUrl: z.string().url().or(z.string().startsWith("file:"))
});
var PrismaFlowConfigSchema = z.object({
  port: z.number().int().positive().max(65535).default(5555),
  logLevel: LogLevelSchema.default("info"),
  openBrowser: z.boolean().default(true),
  features: FeatureFlagsSchema.partial().default({}),
  webhooks: z.array(WebhookConfigSchema).default([]),
  environments: z.array(EnvironmentEntrySchema).default([]),
  auditLogMaxMb: z.number().positive().default(10),
  riskThreshold: RiskLevelSchema.default("medium")
});
var SSEEventTypeSchema = z.enum([
  "status-update",
  "drift-detected",
  "drift-resolved",
  "migration-applied",
  "migration-failed",
  "simulation-progress",
  "simulation-complete",
  "repair-progress",
  "repair-complete"
]);
var SSEEventSchema = z.object({
  type: SSEEventTypeSchema,
  data: z.unknown(),
  timestamp: z.string()
});
var SchemaFieldSchema = z.object({
  name: z.string(),
  type: z.string(),
  kind: z.string(),
  isId: z.boolean(),
  isRequired: z.boolean(),
  isList: z.boolean(),
  isUnique: z.boolean(),
  hasDefaultValue: z.boolean(),
  default: z.unknown().optional(),
  relationName: z.string().optional(),
  relationFromFields: z.array(z.string()).optional(),
  relationToFields: z.array(z.string()).optional()
});
var SchemaModelSchema = z.object({
  name: z.string(),
  dbName: z.string().nullable().optional(),
  fields: z.array(SchemaFieldSchema),
  primaryKey: z.unknown().nullable().optional(),
  uniqueFields: z.array(z.array(z.string())).optional(),
  uniqueIndexes: z.array(z.unknown()).optional()
});
var SchemaEnumSchema = z.object({
  name: z.string(),
  values: z.array(
    z.union([z.string(), z.object({ name: z.string(), dbName: z.string().nullable().optional() })])
  )
});
var SchemaDatamodelSchema = z.object({
  models: z.array(SchemaModelSchema),
  enums: z.array(SchemaEnumSchema),
  types: z.array(z.unknown()).optional()
});

// src/errors.ts
var PrismaFlowError = class extends Error {
  constructor(message, code, cause) {
    super(message);
    this.code = code;
    this.cause = cause;
    this.name = "PrismaFlowError";
  }
};
var SchemaNotFoundError = class extends PrismaFlowError {
  constructor(cwd) {
    super(
      `No Prisma schema found in ${cwd}. Run \`prisma init\` to create one.`,
      "SCHEMA_NOT_FOUND"
    );
    this.name = "SchemaNotFoundError";
  }
};
var DatabaseConnectionError = class extends PrismaFlowError {
  constructor(detail) {
    super(
      `Could not reach the database server.${detail ? ` ${detail}` : ""} Check DATABASE_URL in .env.`,
      "DATABASE_UNREACHABLE"
    );
    this.name = "DatabaseConnectionError";
  }
};
var DriftDetectionError = class extends PrismaFlowError {
  constructor(cause) {
    super("Drift detection failed unexpectedly.", "DRIFT_DETECTION_FAILED", cause);
    this.name = "DriftDetectionError";
  }
};
var MigrationAnalysisError = class extends PrismaFlowError {
  constructor(cause) {
    super("Migration analysis failed unexpectedly.", "MIGRATION_ANALYSIS_FAILED", cause);
    this.name = "MigrationAnalysisError";
  }
};
var ConfigurationError = class extends PrismaFlowError {
  constructor(detail) {
    super(`Configuration error: ${detail}`, "CONFIGURATION_ERROR");
    this.name = "ConfigurationError";
  }
};
var UnauthorizedError = class extends PrismaFlowError {
  constructor() {
    super("Unauthorized \u2014 valid auth token required.", "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
};
var SimulationError = class extends PrismaFlowError {
  constructor(migrationName, cause) {
    super(`Migration simulation failed for "${migrationName}".`, "SIMULATION_FAILED", cause);
    this.name = "SimulationError";
  }
};
var RollbackError = class extends PrismaFlowError {
  constructor(migrationName, detail) {
    super(`Rollback failed for "${migrationName}": ${detail}`, "ROLLBACK_FAILED");
    this.name = "RollbackError";
  }
};
var EnvironmentComparisonError = class extends PrismaFlowError {
  constructor(source, target, cause) {
    super(
      `Environment comparison failed between "${source}" and "${target}".`,
      "ENV_COMPARISON_FAILED",
      cause
    );
    this.name = "EnvironmentComparisonError";
  }
};
var GitAwarenessError = class extends PrismaFlowError {
  constructor(detail, cause) {
    super(`Git awareness error: ${detail}`, "GIT_AWARENESS_ERROR", cause);
    this.name = "GitAwarenessError";
  }
};
var DriftRepairError = class extends PrismaFlowError {
  constructor(detail, cause) {
    super(`Drift repair plan failed: ${detail}`, "DRIFT_REPAIR_FAILED", cause);
    this.name = "DriftRepairError";
  }
};
var UnsupportedPrismaVersionError = class extends PrismaFlowError {
  constructor(version, detail) {
    super(
      `Prisma version "${version}" is not supported.${detail ? ` ${detail}` : ""}`,
      "UNSUPPORTED_PRISMA_VERSION"
    );
    this.name = "UnsupportedPrismaVersionError";
  }
};
export {
  AuditActionSchema,
  AuditEntrySchema,
  ConfigurationError,
  DatabaseConnectionError,
  DatabaseProviderSchema,
  DeploymentPlanActionSchema,
  DeploymentPlanCommandSchema,
  DeploymentPlanDriftSummarySchema,
  DeploymentPlanMigrationSummarySchema,
  DeploymentPlanPrioritySchema,
  DeploymentPlanSchema,
  DeploymentReadinessCheckIdSchema,
  DeploymentReadinessCheckSchema,
  DeploymentReadinessSchema,
  DeploymentReadinessStatusSchema,
  DriftDetectionError,
  DriftDetectionStatusSchema,
  DriftItemSchema,
  DriftRecoverySuggestionSchema,
  DriftRepairError,
  DriftRepairPlanSchema,
  DriftRepairStrategySchema,
  DriftResultSchema,
  DriftTypeSchema,
  EnvironmentComparisonEntrySchema,
  EnvironmentComparisonError,
  EnvironmentComparisonSchema,
  EnvironmentEntrySchema,
  FeatureFlagsSchema,
  GitAwarenessError,
  GitMigrationInfoSchema,
  LogLevelSchema,
  MigrationAnalysisError,
  MigrationConflictSchema,
  MigrationDetailSchema,
  MigrationHistoryDiffSchema,
  MigrationRiskScoreSchema,
  MigrationSchema,
  MigrationStatusSchema,
  MigrationVerificationStatusSchema,
  PaginationMetaSchema,
  PaginationQuerySchema,
  PrismaFlowConfigSchema,
  PrismaFlowError,
  ProjectStatusSchema,
  RiskFactorSchema,
  RiskLevelSchema,
  RollbackError,
  RollbackPlanSchema,
  RollbackStepSchema,
  SSEEventSchema,
  SSEEventTypeSchema,
  SchemaDatamodelSchema,
  SchemaDiffSchema,
  SchemaDiffTypeSchema,
  SchemaEnumSchema,
  SchemaFieldSchema,
  SchemaModelSchema,
  SchemaNotFoundError,
  SimulationError,
  SimulationModeSchema,
  SimulationOutcomeSchema,
  SimulationResultSchema,
  SimulationStatementSchema,
  SimulationStatementTypeSchema,
  SimulationVerificationSchema,
  UnauthorizedError,
  UnsupportedPrismaVersionError,
  WebhookConfigSchema,
  WebhookEventSchema,
  WebhookTypeSchema
};
