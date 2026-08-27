import { z } from 'zod';

declare const MigrationStatusSchema: z.ZodEnum<["applied", "pending", "failed", "unknown"]>;
declare const MigrationVerificationStatusSchema: z.ZodEnum<["verified", "unknown", "error"]>;
declare const RiskLevelSchema: z.ZodEnum<["low", "medium", "high", "critical"]>;
declare const DriftTypeSchema: z.ZodEnum<["table-missing", "table-extra", "column-mismatch", "index-change", "constraint-change", "unknown", "missing_migration", "extra_column", "extra_table", "modified_migration"]>;
declare const DriftDetectionStatusSchema: z.ZodEnum<["clean", "drifted", "error", "not_checked"]>;
declare const LogLevelSchema: z.ZodEnum<["trace", "debug", "info", "warn", "error"]>;
declare const WebhookTypeSchema: z.ZodEnum<["slack", "discord", "http"]>;
declare const WebhookEventSchema: z.ZodEnum<["drift-detected", "migration-failed", "check-complete", "migration-applied", "simulation-complete", "risk-threshold-exceeded"]>;
declare const DatabaseProviderSchema: z.ZodEnum<["postgresql", "mysql", "sqlite", "sqlserver", "mongodb"]>;
declare const DriftRepairStrategySchema: z.ZodEnum<["reconcile_history", "manual_migration", "manual_sql", "review_only"]>;
declare const SchemaDiffTypeSchema: z.ZodEnum<["model_added", "model_removed", "field_added", "field_removed", "field_type_changed", "added", "removed", "modified"]>;
declare const SimulationVerificationSchema: z.ZodEnum<["executed", "static-analysis", "not-verified"]>;
declare const SimulationOutcomeSchema: z.ZodEnum<["success", "failure", "unknown"]>;
declare const SimulationModeSchema: z.ZodEnum<["static", "shadow", "live"]>;
declare const SimulationStatementTypeSchema: z.ZodEnum<["CREATE_TABLE", "ALTER_TABLE", "DROP_TABLE", "CREATE_INDEX", "DROP_INDEX", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "OTHER"]>;
declare const DeploymentReadinessStatusSchema: z.ZodEnum<["ready", "attention", "blocked"]>;
declare const DeploymentReadinessCheckIdSchema: z.ZodEnum<["database", "drift", "migration-verification", "failed-migrations", "pending-migrations", "critical-risks"]>;
declare const DeploymentPlanPrioritySchema: z.ZodEnum<["blocker", "recommended", "optional"]>;
declare const MigrationSchema: z.ZodObject<{
    name: z.ZodString;
    timestamp: z.ZodString;
    status: z.ZodEnum<["applied", "pending", "failed", "unknown"]>;
    sqlPath: z.ZodString;
    createdAt: z.ZodOptional<z.ZodString>;
    appliedAt: z.ZodOptional<z.ZodString>;
    durationMs: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    timestamp: string;
    status: "applied" | "pending" | "failed" | "unknown";
    sqlPath: string;
    createdAt?: string | undefined;
    appliedAt?: string | undefined;
    durationMs?: number | undefined;
}, {
    name: string;
    timestamp: string;
    status: "applied" | "pending" | "failed" | "unknown";
    sqlPath: string;
    createdAt?: string | undefined;
    appliedAt?: string | undefined;
    durationMs?: number | undefined;
}>;
declare const RiskFactorSchema: z.ZodObject<{
    pattern: z.ZodString;
    severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
    description: z.ZodString;
    affectedTable: z.ZodOptional<z.ZodString>;
    estimatedRows: z.ZodOptional<z.ZodNumber>;
    recommendation: z.ZodString;
}, "strip", z.ZodTypeAny, {
    pattern: string;
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    recommendation: string;
    affectedTable?: string | undefined;
    estimatedRows?: number | undefined;
}, {
    pattern: string;
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    recommendation: string;
    affectedTable?: string | undefined;
    estimatedRows?: number | undefined;
}>;
declare const MigrationRiskScoreSchema: z.ZodObject<{
    score: z.ZodNumber;
    level: z.ZodEnum<["low", "medium", "high", "critical"]>;
    factors: z.ZodArray<z.ZodObject<{
        pattern: z.ZodString;
        severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
        description: z.ZodString;
        affectedTable: z.ZodOptional<z.ZodString>;
        estimatedRows: z.ZodOptional<z.ZodNumber>;
        recommendation: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        pattern: string;
        severity: "low" | "medium" | "high" | "critical";
        description: string;
        recommendation: string;
        affectedTable?: string | undefined;
        estimatedRows?: number | undefined;
    }, {
        pattern: string;
        severity: "low" | "medium" | "high" | "critical";
        description: string;
        recommendation: string;
        affectedTable?: string | undefined;
        estimatedRows?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    score: number;
    level: "low" | "medium" | "high" | "critical";
    factors: {
        pattern: string;
        severity: "low" | "medium" | "high" | "critical";
        description: string;
        recommendation: string;
        affectedTable?: string | undefined;
        estimatedRows?: number | undefined;
    }[];
}, {
    score: number;
    level: "low" | "medium" | "high" | "critical";
    factors: {
        pattern: string;
        severity: "low" | "medium" | "high" | "critical";
        description: string;
        recommendation: string;
        affectedTable?: string | undefined;
        estimatedRows?: number | undefined;
    }[];
}>;
declare const RollbackStepSchema: z.ZodObject<{
    index: z.ZodNumber;
    forwardSql: z.ZodString;
    rollbackSql: z.ZodString;
    automated: z.ZodBoolean;
    warning: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    index: number;
    forwardSql: string;
    rollbackSql: string;
    automated: boolean;
    warning?: string | undefined;
}, {
    index: number;
    forwardSql: string;
    rollbackSql: string;
    automated: boolean;
    warning?: string | undefined;
}>;
declare const RollbackPlanSchema: z.ZodObject<{
    migrationName: z.ZodString;
    steps: z.ZodDefault<z.ZodArray<z.ZodObject<{
        index: z.ZodNumber;
        forwardSql: z.ZodString;
        rollbackSql: z.ZodString;
        automated: z.ZodBoolean;
        warning: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        index: number;
        forwardSql: string;
        rollbackSql: string;
        automated: boolean;
        warning?: string | undefined;
    }, {
        index: number;
        forwardSql: string;
        rollbackSql: string;
        automated: boolean;
        warning?: string | undefined;
    }>, "many">>;
    hasManualSteps: z.ZodDefault<z.ZodBoolean>;
    warnings: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    generatedAt: z.ZodString;
    automated: z.ZodDefault<z.ZodBoolean>;
    sql: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    automated: boolean;
    migrationName: string;
    steps: {
        index: number;
        forwardSql: string;
        rollbackSql: string;
        automated: boolean;
        warning?: string | undefined;
    }[];
    hasManualSteps: boolean;
    warnings: string[];
    generatedAt: string;
    sql?: string | undefined;
}, {
    migrationName: string;
    generatedAt: string;
    automated?: boolean | undefined;
    steps?: {
        index: number;
        forwardSql: string;
        rollbackSql: string;
        automated: boolean;
        warning?: string | undefined;
    }[] | undefined;
    hasManualSteps?: boolean | undefined;
    warnings?: string[] | undefined;
    sql?: string | undefined;
}>;
declare const MigrationDetailSchema: z.ZodObject<{
    name: z.ZodString;
    timestamp: z.ZodString;
    status: z.ZodEnum<["applied", "pending", "failed", "unknown"]>;
    sqlPath: z.ZodString;
    createdAt: z.ZodOptional<z.ZodString>;
    appliedAt: z.ZodOptional<z.ZodString>;
    durationMs: z.ZodOptional<z.ZodNumber>;
} & {
    sql: z.ZodString;
    risks: z.ZodArray<z.ZodString, "many">;
    riskScore: z.ZodOptional<z.ZodObject<{
        score: z.ZodNumber;
        level: z.ZodEnum<["low", "medium", "high", "critical"]>;
        factors: z.ZodArray<z.ZodObject<{
            pattern: z.ZodString;
            severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
            description: z.ZodString;
            affectedTable: z.ZodOptional<z.ZodString>;
            estimatedRows: z.ZodOptional<z.ZodNumber>;
            recommendation: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            pattern: string;
            severity: "low" | "medium" | "high" | "critical";
            description: string;
            recommendation: string;
            affectedTable?: string | undefined;
            estimatedRows?: number | undefined;
        }, {
            pattern: string;
            severity: "low" | "medium" | "high" | "critical";
            description: string;
            recommendation: string;
            affectedTable?: string | undefined;
            estimatedRows?: number | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        score: number;
        level: "low" | "medium" | "high" | "critical";
        factors: {
            pattern: string;
            severity: "low" | "medium" | "high" | "critical";
            description: string;
            recommendation: string;
            affectedTable?: string | undefined;
            estimatedRows?: number | undefined;
        }[];
    }, {
        score: number;
        level: "low" | "medium" | "high" | "critical";
        factors: {
            pattern: string;
            severity: "low" | "medium" | "high" | "critical";
            description: string;
            recommendation: string;
            affectedTable?: string | undefined;
            estimatedRows?: number | undefined;
        }[];
    }>>;
    rollbackPlan: z.ZodOptional<z.ZodObject<{
        migrationName: z.ZodString;
        steps: z.ZodDefault<z.ZodArray<z.ZodObject<{
            index: z.ZodNumber;
            forwardSql: z.ZodString;
            rollbackSql: z.ZodString;
            automated: z.ZodBoolean;
            warning: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            index: number;
            forwardSql: string;
            rollbackSql: string;
            automated: boolean;
            warning?: string | undefined;
        }, {
            index: number;
            forwardSql: string;
            rollbackSql: string;
            automated: boolean;
            warning?: string | undefined;
        }>, "many">>;
        hasManualSteps: z.ZodDefault<z.ZodBoolean>;
        warnings: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        generatedAt: z.ZodString;
        automated: z.ZodDefault<z.ZodBoolean>;
        sql: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        automated: boolean;
        migrationName: string;
        steps: {
            index: number;
            forwardSql: string;
            rollbackSql: string;
            automated: boolean;
            warning?: string | undefined;
        }[];
        hasManualSteps: boolean;
        warnings: string[];
        generatedAt: string;
        sql?: string | undefined;
    }, {
        migrationName: string;
        generatedAt: string;
        automated?: boolean | undefined;
        steps?: {
            index: number;
            forwardSql: string;
            rollbackSql: string;
            automated: boolean;
            warning?: string | undefined;
        }[] | undefined;
        hasManualSteps?: boolean | undefined;
        warnings?: string[] | undefined;
        sql?: string | undefined;
    }>>;
    gitBranch: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    timestamp: string;
    status: "applied" | "pending" | "failed" | "unknown";
    sqlPath: string;
    sql: string;
    risks: string[];
    createdAt?: string | undefined;
    appliedAt?: string | undefined;
    durationMs?: number | undefined;
    riskScore?: {
        score: number;
        level: "low" | "medium" | "high" | "critical";
        factors: {
            pattern: string;
            severity: "low" | "medium" | "high" | "critical";
            description: string;
            recommendation: string;
            affectedTable?: string | undefined;
            estimatedRows?: number | undefined;
        }[];
    } | undefined;
    rollbackPlan?: {
        automated: boolean;
        migrationName: string;
        steps: {
            index: number;
            forwardSql: string;
            rollbackSql: string;
            automated: boolean;
            warning?: string | undefined;
        }[];
        hasManualSteps: boolean;
        warnings: string[];
        generatedAt: string;
        sql?: string | undefined;
    } | undefined;
    gitBranch?: string | undefined;
}, {
    name: string;
    timestamp: string;
    status: "applied" | "pending" | "failed" | "unknown";
    sqlPath: string;
    sql: string;
    risks: string[];
    createdAt?: string | undefined;
    appliedAt?: string | undefined;
    durationMs?: number | undefined;
    riskScore?: {
        score: number;
        level: "low" | "medium" | "high" | "critical";
        factors: {
            pattern: string;
            severity: "low" | "medium" | "high" | "critical";
            description: string;
            recommendation: string;
            affectedTable?: string | undefined;
            estimatedRows?: number | undefined;
        }[];
    } | undefined;
    rollbackPlan?: {
        migrationName: string;
        generatedAt: string;
        automated?: boolean | undefined;
        steps?: {
            index: number;
            forwardSql: string;
            rollbackSql: string;
            automated: boolean;
            warning?: string | undefined;
        }[] | undefined;
        hasManualSteps?: boolean | undefined;
        warnings?: string[] | undefined;
        sql?: string | undefined;
    } | undefined;
    gitBranch?: string | undefined;
}>;
declare const DriftItemSchema: z.ZodObject<{
    sql: z.ZodString;
    type: z.ZodEnum<["table-missing", "table-extra", "column-mismatch", "index-change", "constraint-change", "unknown", "missing_migration", "extra_column", "extra_table", "modified_migration"]>;
    description: z.ZodString;
    identifier: z.ZodOptional<z.ZodString>;
    migrationName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "unknown" | "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
    description: string;
    sql: string;
    migrationName?: string | undefined;
    identifier?: string | undefined;
}, {
    type: "unknown" | "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
    description: string;
    sql: string;
    migrationName?: string | undefined;
    identifier?: string | undefined;
}>;
declare const DriftResultSchema: z.ZodObject<{
    hasDrift: z.ZodBoolean;
    driftCount: z.ZodNumber;
    differences: z.ZodArray<z.ZodObject<{
        sql: z.ZodString;
        type: z.ZodEnum<["table-missing", "table-extra", "column-mismatch", "index-change", "constraint-change", "unknown", "missing_migration", "extra_column", "extra_table", "modified_migration"]>;
        description: z.ZodString;
        identifier: z.ZodOptional<z.ZodString>;
        migrationName: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "unknown" | "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
        description: string;
        sql: string;
        migrationName?: string | undefined;
        identifier?: string | undefined;
    }, {
        type: "unknown" | "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
        description: string;
        sql: string;
        migrationName?: string | undefined;
        identifier?: string | undefined;
    }>, "many">;
    cachedAt: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<["clean", "drifted", "error", "not_checked"]>;
    errorMessage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "error" | "clean" | "drifted" | "not_checked";
    hasDrift: boolean;
    driftCount: number;
    differences: {
        type: "unknown" | "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
        description: string;
        sql: string;
        migrationName?: string | undefined;
        identifier?: string | undefined;
    }[];
    cachedAt: string | null;
    errorMessage?: string | undefined;
}, {
    status: "error" | "clean" | "drifted" | "not_checked";
    hasDrift: boolean;
    driftCount: number;
    differences: {
        type: "unknown" | "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
        description: string;
        sql: string;
        migrationName?: string | undefined;
        identifier?: string | undefined;
    }[];
    cachedAt: string | null;
    errorMessage?: string | undefined;
}>;
declare const DeploymentReadinessCheckSchema: z.ZodObject<{
    id: z.ZodEnum<["database", "drift", "migration-verification", "failed-migrations", "pending-migrations", "critical-risks"]>;
    label: z.ZodString;
    passed: z.ZodBoolean;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    id: "database" | "drift" | "migration-verification" | "failed-migrations" | "pending-migrations" | "critical-risks";
    label: string;
    passed: boolean;
}, {
    message: string;
    id: "database" | "drift" | "migration-verification" | "failed-migrations" | "pending-migrations" | "critical-risks";
    label: string;
    passed: boolean;
}>;
declare const DeploymentReadinessSchema: z.ZodObject<{
    status: z.ZodEnum<["ready", "attention", "blocked"]>;
    score: z.ZodNumber;
    summary: z.ZodString;
    checks: z.ZodArray<z.ZodObject<{
        id: z.ZodEnum<["database", "drift", "migration-verification", "failed-migrations", "pending-migrations", "critical-risks"]>;
        label: z.ZodString;
        passed: z.ZodBoolean;
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        id: "database" | "drift" | "migration-verification" | "failed-migrations" | "pending-migrations" | "critical-risks";
        label: string;
        passed: boolean;
    }, {
        message: string;
        id: "database" | "drift" | "migration-verification" | "failed-migrations" | "pending-migrations" | "critical-risks";
        label: string;
        passed: boolean;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    status: "ready" | "attention" | "blocked";
    score: number;
    summary: string;
    checks: {
        message: string;
        id: "database" | "drift" | "migration-verification" | "failed-migrations" | "pending-migrations" | "critical-risks";
        label: string;
        passed: boolean;
    }[];
}, {
    status: "ready" | "attention" | "blocked";
    score: number;
    summary: string;
    checks: {
        message: string;
        id: "database" | "drift" | "migration-verification" | "failed-migrations" | "pending-migrations" | "critical-risks";
        label: string;
        passed: boolean;
    }[];
}>;
declare const DeploymentPlanActionSchema: z.ZodObject<{
    priority: z.ZodEnum<["blocker", "recommended", "optional"]>;
    title: z.ZodString;
    detail: z.ZodString;
    command: z.ZodOptional<z.ZodString>;
    href: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    priority: "blocker" | "recommended" | "optional";
    title: string;
    detail: string;
    command?: string | undefined;
    href?: string | undefined;
}, {
    priority: "blocker" | "recommended" | "optional";
    title: string;
    detail: string;
    command?: string | undefined;
    href?: string | undefined;
}>;
declare const DeploymentPlanCommandSchema: z.ZodObject<{
    label: z.ZodString;
    command: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    label: string;
    command: string;
    reason: string;
}, {
    label: string;
    command: string;
    reason: string;
}>;
declare const DeploymentPlanMigrationSummarySchema: z.ZodObject<{
    total: z.ZodNumber;
    applied: z.ZodNumber;
    pending: z.ZodNumber;
    failed: z.ZodNumber;
    unknown: z.ZodDefault<z.ZodNumber>;
    verification: z.ZodDefault<z.ZodEnum<["verified", "unknown", "error"]>>;
    pendingNames: z.ZodArray<z.ZodString, "many">;
    failedNames: z.ZodArray<z.ZodString, "many">;
    highestRisk: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        level: z.ZodEnum<["low", "medium", "high", "critical"]>;
        score: z.ZodNumber;
        factors: z.ZodArray<z.ZodObject<{
            pattern: z.ZodString;
            severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
            description: z.ZodString;
            affectedTable: z.ZodOptional<z.ZodString>;
            estimatedRows: z.ZodOptional<z.ZodNumber>;
            recommendation: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            pattern: string;
            severity: "low" | "medium" | "high" | "critical";
            description: string;
            recommendation: string;
            affectedTable?: string | undefined;
            estimatedRows?: number | undefined;
        }, {
            pattern: string;
            severity: "low" | "medium" | "high" | "critical";
            description: string;
            recommendation: string;
            affectedTable?: string | undefined;
            estimatedRows?: number | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        score: number;
        level: "low" | "medium" | "high" | "critical";
        factors: {
            pattern: string;
            severity: "low" | "medium" | "high" | "critical";
            description: string;
            recommendation: string;
            affectedTable?: string | undefined;
            estimatedRows?: number | undefined;
        }[];
    }, {
        name: string;
        score: number;
        level: "low" | "medium" | "high" | "critical";
        factors: {
            pattern: string;
            severity: "low" | "medium" | "high" | "critical";
            description: string;
            recommendation: string;
            affectedTable?: string | undefined;
            estimatedRows?: number | undefined;
        }[];
    }>>;
}, "strip", z.ZodTypeAny, {
    applied: number;
    pending: number;
    failed: number;
    unknown: number;
    total: number;
    verification: "unknown" | "verified" | "error";
    pendingNames: string[];
    failedNames: string[];
    highestRisk?: {
        name: string;
        score: number;
        level: "low" | "medium" | "high" | "critical";
        factors: {
            pattern: string;
            severity: "low" | "medium" | "high" | "critical";
            description: string;
            recommendation: string;
            affectedTable?: string | undefined;
            estimatedRows?: number | undefined;
        }[];
    } | undefined;
}, {
    applied: number;
    pending: number;
    failed: number;
    total: number;
    pendingNames: string[];
    failedNames: string[];
    unknown?: number | undefined;
    verification?: "unknown" | "verified" | "error" | undefined;
    highestRisk?: {
        name: string;
        score: number;
        level: "low" | "medium" | "high" | "critical";
        factors: {
            pattern: string;
            severity: "low" | "medium" | "high" | "critical";
            description: string;
            recommendation: string;
            affectedTable?: string | undefined;
            estimatedRows?: number | undefined;
        }[];
    } | undefined;
}>;
declare const DeploymentPlanDriftSummarySchema: z.ZodObject<{
    status: z.ZodEnum<["clean", "drifted", "error", "not_checked"]>;
    detected: z.ZodBoolean;
    count: z.ZodNumber;
    errorMessage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "error" | "clean" | "drifted" | "not_checked";
    detected: boolean;
    count: number;
    errorMessage?: string | undefined;
}, {
    status: "error" | "clean" | "drifted" | "not_checked";
    detected: boolean;
    count: number;
    errorMessage?: string | undefined;
}>;
declare const DeploymentPlanSchema: z.ZodObject<{
    schemaVersion: z.ZodLiteral<"prismaflow-plan/v1">;
    generatedAt: z.ZodString;
    decision: z.ZodEnum<["ready", "attention", "blocked"]>;
    score: z.ZodNumber;
    summary: z.ZodString;
    project: z.ZodObject<{
        schemaPath: z.ZodString;
        migrationsPath: z.ZodString;
        provider: z.ZodOptional<z.ZodEnum<["postgresql", "mysql", "sqlite", "sqlserver", "mongodb"]>>;
        prismaVersion: z.ZodOptional<z.ZodString>;
        packageManager: z.ZodOptional<z.ZodString>;
        hasDatabaseUrl: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        schemaPath: string;
        migrationsPath: string;
        hasDatabaseUrl: boolean;
        provider?: "postgresql" | "mysql" | "sqlite" | "sqlserver" | "mongodb" | undefined;
        prismaVersion?: string | undefined;
        packageManager?: string | undefined;
    }, {
        schemaPath: string;
        migrationsPath: string;
        hasDatabaseUrl: boolean;
        provider?: "postgresql" | "mysql" | "sqlite" | "sqlserver" | "mongodb" | undefined;
        prismaVersion?: string | undefined;
        packageManager?: string | undefined;
    }>;
    checks: z.ZodArray<z.ZodObject<{
        id: z.ZodEnum<["database", "drift", "migration-verification", "failed-migrations", "pending-migrations", "critical-risks"]>;
        label: z.ZodString;
        passed: z.ZodBoolean;
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        id: "database" | "drift" | "migration-verification" | "failed-migrations" | "pending-migrations" | "critical-risks";
        label: string;
        passed: boolean;
    }, {
        message: string;
        id: "database" | "drift" | "migration-verification" | "failed-migrations" | "pending-migrations" | "critical-risks";
        label: string;
        passed: boolean;
    }>, "many">;
    migrations: z.ZodObject<{
        total: z.ZodNumber;
        applied: z.ZodNumber;
        pending: z.ZodNumber;
        failed: z.ZodNumber;
        unknown: z.ZodDefault<z.ZodNumber>;
        verification: z.ZodDefault<z.ZodEnum<["verified", "unknown", "error"]>>;
        pendingNames: z.ZodArray<z.ZodString, "many">;
        failedNames: z.ZodArray<z.ZodString, "many">;
        highestRisk: z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
            level: z.ZodEnum<["low", "medium", "high", "critical"]>;
            score: z.ZodNumber;
            factors: z.ZodArray<z.ZodObject<{
                pattern: z.ZodString;
                severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
                description: z.ZodString;
                affectedTable: z.ZodOptional<z.ZodString>;
                estimatedRows: z.ZodOptional<z.ZodNumber>;
                recommendation: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                pattern: string;
                severity: "low" | "medium" | "high" | "critical";
                description: string;
                recommendation: string;
                affectedTable?: string | undefined;
                estimatedRows?: number | undefined;
            }, {
                pattern: string;
                severity: "low" | "medium" | "high" | "critical";
                description: string;
                recommendation: string;
                affectedTable?: string | undefined;
                estimatedRows?: number | undefined;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            name: string;
            score: number;
            level: "low" | "medium" | "high" | "critical";
            factors: {
                pattern: string;
                severity: "low" | "medium" | "high" | "critical";
                description: string;
                recommendation: string;
                affectedTable?: string | undefined;
                estimatedRows?: number | undefined;
            }[];
        }, {
            name: string;
            score: number;
            level: "low" | "medium" | "high" | "critical";
            factors: {
                pattern: string;
                severity: "low" | "medium" | "high" | "critical";
                description: string;
                recommendation: string;
                affectedTable?: string | undefined;
                estimatedRows?: number | undefined;
            }[];
        }>>;
    }, "strip", z.ZodTypeAny, {
        applied: number;
        pending: number;
        failed: number;
        unknown: number;
        total: number;
        verification: "unknown" | "verified" | "error";
        pendingNames: string[];
        failedNames: string[];
        highestRisk?: {
            name: string;
            score: number;
            level: "low" | "medium" | "high" | "critical";
            factors: {
                pattern: string;
                severity: "low" | "medium" | "high" | "critical";
                description: string;
                recommendation: string;
                affectedTable?: string | undefined;
                estimatedRows?: number | undefined;
            }[];
        } | undefined;
    }, {
        applied: number;
        pending: number;
        failed: number;
        total: number;
        pendingNames: string[];
        failedNames: string[];
        unknown?: number | undefined;
        verification?: "unknown" | "verified" | "error" | undefined;
        highestRisk?: {
            name: string;
            score: number;
            level: "low" | "medium" | "high" | "critical";
            factors: {
                pattern: string;
                severity: "low" | "medium" | "high" | "critical";
                description: string;
                recommendation: string;
                affectedTable?: string | undefined;
                estimatedRows?: number | undefined;
            }[];
        } | undefined;
    }>;
    drift: z.ZodObject<{
        status: z.ZodEnum<["clean", "drifted", "error", "not_checked"]>;
        detected: z.ZodBoolean;
        count: z.ZodNumber;
        errorMessage: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "error" | "clean" | "drifted" | "not_checked";
        detected: boolean;
        count: number;
        errorMessage?: string | undefined;
    }, {
        status: "error" | "clean" | "drifted" | "not_checked";
        detected: boolean;
        count: number;
        errorMessage?: string | undefined;
    }>;
    actions: z.ZodArray<z.ZodObject<{
        priority: z.ZodEnum<["blocker", "recommended", "optional"]>;
        title: z.ZodString;
        detail: z.ZodString;
        command: z.ZodOptional<z.ZodString>;
        href: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        priority: "blocker" | "recommended" | "optional";
        title: string;
        detail: string;
        command?: string | undefined;
        href?: string | undefined;
    }, {
        priority: "blocker" | "recommended" | "optional";
        title: string;
        detail: string;
        command?: string | undefined;
        href?: string | undefined;
    }>, "many">;
    commands: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        command: z.ZodString;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        label: string;
        command: string;
        reason: string;
    }, {
        label: string;
        command: string;
        reason: string;
    }>, "many">;
    valueHighlights: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    drift: {
        status: "error" | "clean" | "drifted" | "not_checked";
        detected: boolean;
        count: number;
        errorMessage?: string | undefined;
    };
    score: number;
    generatedAt: string;
    summary: string;
    checks: {
        message: string;
        id: "database" | "drift" | "migration-verification" | "failed-migrations" | "pending-migrations" | "critical-risks";
        label: string;
        passed: boolean;
    }[];
    schemaVersion: "prismaflow-plan/v1";
    decision: "ready" | "attention" | "blocked";
    project: {
        schemaPath: string;
        migrationsPath: string;
        hasDatabaseUrl: boolean;
        provider?: "postgresql" | "mysql" | "sqlite" | "sqlserver" | "mongodb" | undefined;
        prismaVersion?: string | undefined;
        packageManager?: string | undefined;
    };
    migrations: {
        applied: number;
        pending: number;
        failed: number;
        unknown: number;
        total: number;
        verification: "unknown" | "verified" | "error";
        pendingNames: string[];
        failedNames: string[];
        highestRisk?: {
            name: string;
            score: number;
            level: "low" | "medium" | "high" | "critical";
            factors: {
                pattern: string;
                severity: "low" | "medium" | "high" | "critical";
                description: string;
                recommendation: string;
                affectedTable?: string | undefined;
                estimatedRows?: number | undefined;
            }[];
        } | undefined;
    };
    actions: {
        priority: "blocker" | "recommended" | "optional";
        title: string;
        detail: string;
        command?: string | undefined;
        href?: string | undefined;
    }[];
    commands: {
        label: string;
        command: string;
        reason: string;
    }[];
    valueHighlights: string[];
}, {
    drift: {
        status: "error" | "clean" | "drifted" | "not_checked";
        detected: boolean;
        count: number;
        errorMessage?: string | undefined;
    };
    score: number;
    generatedAt: string;
    summary: string;
    checks: {
        message: string;
        id: "database" | "drift" | "migration-verification" | "failed-migrations" | "pending-migrations" | "critical-risks";
        label: string;
        passed: boolean;
    }[];
    schemaVersion: "prismaflow-plan/v1";
    decision: "ready" | "attention" | "blocked";
    project: {
        schemaPath: string;
        migrationsPath: string;
        hasDatabaseUrl: boolean;
        provider?: "postgresql" | "mysql" | "sqlite" | "sqlserver" | "mongodb" | undefined;
        prismaVersion?: string | undefined;
        packageManager?: string | undefined;
    };
    migrations: {
        applied: number;
        pending: number;
        failed: number;
        total: number;
        pendingNames: string[];
        failedNames: string[];
        unknown?: number | undefined;
        verification?: "unknown" | "verified" | "error" | undefined;
        highestRisk?: {
            name: string;
            score: number;
            level: "low" | "medium" | "high" | "critical";
            factors: {
                pattern: string;
                severity: "low" | "medium" | "high" | "critical";
                description: string;
                recommendation: string;
                affectedTable?: string | undefined;
                estimatedRows?: number | undefined;
            }[];
        } | undefined;
    };
    actions: {
        priority: "blocker" | "recommended" | "optional";
        title: string;
        detail: string;
        command?: string | undefined;
        href?: string | undefined;
    }[];
    commands: {
        label: string;
        command: string;
        reason: string;
    }[];
    valueHighlights: string[];
}>;
declare const ProjectStatusSchema: z.ZodObject<{
    connected: z.ZodBoolean;
    migrationVerification: z.ZodDefault<z.ZodEnum<["verified", "unknown", "error"]>>;
    migrationsApplied: z.ZodNumber;
    migrationsPending: z.ZodNumber;
    migrationsFailed: z.ZodNumber;
    migrationsUnknown: z.ZodDefault<z.ZodNumber>;
    driftDetected: z.ZodBoolean;
    driftCount: z.ZodNumber;
    driftStatus: z.ZodDefault<z.ZodEnum<["clean", "drifted", "error", "not_checked"]>>;
    riskLevel: z.ZodEnum<["low", "medium", "high", "critical"]>;
    healthScore: z.ZodNumber;
    deploymentReadiness: z.ZodObject<{
        status: z.ZodEnum<["ready", "attention", "blocked"]>;
        score: z.ZodNumber;
        summary: z.ZodString;
        checks: z.ZodArray<z.ZodObject<{
            id: z.ZodEnum<["database", "drift", "migration-verification", "failed-migrations", "pending-migrations", "critical-risks"]>;
            label: z.ZodString;
            passed: z.ZodBoolean;
            message: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            message: string;
            id: "database" | "drift" | "migration-verification" | "failed-migrations" | "pending-migrations" | "critical-risks";
            label: string;
            passed: boolean;
        }, {
            message: string;
            id: "database" | "drift" | "migration-verification" | "failed-migrations" | "pending-migrations" | "critical-risks";
            label: string;
            passed: boolean;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        status: "ready" | "attention" | "blocked";
        score: number;
        summary: string;
        checks: {
            message: string;
            id: "database" | "drift" | "migration-verification" | "failed-migrations" | "pending-migrations" | "critical-risks";
            label: string;
            passed: boolean;
        }[];
    }, {
        status: "ready" | "attention" | "blocked";
        score: number;
        summary: string;
        checks: {
            message: string;
            id: "database" | "drift" | "migration-verification" | "failed-migrations" | "pending-migrations" | "critical-risks";
            label: string;
            passed: boolean;
        }[];
    }>;
    lastSync: z.ZodString;
    provider: z.ZodOptional<z.ZodEnum<["postgresql", "mysql", "sqlite", "sqlserver", "mongodb"]>>;
    projectName: z.ZodOptional<z.ZodString>;
    schemaPath: z.ZodOptional<z.ZodString>;
    migrationsPath: z.ZodOptional<z.ZodString>;
    prismaVersion: z.ZodOptional<z.ZodString>;
    packageManager: z.ZodOptional<z.ZodString>;
    hasDatabaseUrl: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    driftCount: number;
    connected: boolean;
    migrationVerification: "unknown" | "verified" | "error";
    migrationsApplied: number;
    migrationsPending: number;
    migrationsFailed: number;
    migrationsUnknown: number;
    driftDetected: boolean;
    driftStatus: "error" | "clean" | "drifted" | "not_checked";
    riskLevel: "low" | "medium" | "high" | "critical";
    healthScore: number;
    deploymentReadiness: {
        status: "ready" | "attention" | "blocked";
        score: number;
        summary: string;
        checks: {
            message: string;
            id: "database" | "drift" | "migration-verification" | "failed-migrations" | "pending-migrations" | "critical-risks";
            label: string;
            passed: boolean;
        }[];
    };
    lastSync: string;
    schemaPath?: string | undefined;
    migrationsPath?: string | undefined;
    provider?: "postgresql" | "mysql" | "sqlite" | "sqlserver" | "mongodb" | undefined;
    prismaVersion?: string | undefined;
    packageManager?: string | undefined;
    hasDatabaseUrl?: boolean | undefined;
    projectName?: string | undefined;
}, {
    driftCount: number;
    connected: boolean;
    migrationsApplied: number;
    migrationsPending: number;
    migrationsFailed: number;
    driftDetected: boolean;
    riskLevel: "low" | "medium" | "high" | "critical";
    healthScore: number;
    deploymentReadiness: {
        status: "ready" | "attention" | "blocked";
        score: number;
        summary: string;
        checks: {
            message: string;
            id: "database" | "drift" | "migration-verification" | "failed-migrations" | "pending-migrations" | "critical-risks";
            label: string;
            passed: boolean;
        }[];
    };
    lastSync: string;
    schemaPath?: string | undefined;
    migrationsPath?: string | undefined;
    provider?: "postgresql" | "mysql" | "sqlite" | "sqlserver" | "mongodb" | undefined;
    prismaVersion?: string | undefined;
    packageManager?: string | undefined;
    hasDatabaseUrl?: boolean | undefined;
    migrationVerification?: "unknown" | "verified" | "error" | undefined;
    migrationsUnknown?: number | undefined;
    driftStatus?: "error" | "clean" | "drifted" | "not_checked" | undefined;
    projectName?: string | undefined;
}>;
declare const SimulationStatementSchema: z.ZodObject<{
    index: z.ZodNumber;
    sql: z.ZodString;
    type: z.ZodEnum<["CREATE_TABLE", "ALTER_TABLE", "DROP_TABLE", "CREATE_INDEX", "DROP_INDEX", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "OTHER"]>;
    isDestructive: z.ZodBoolean;
    warnings: z.ZodArray<z.ZodString, "many">;
    estimatedRowsAffected: z.ZodOptional<z.ZodNumber>;
    success: z.ZodOptional<z.ZodBoolean>;
    error: z.ZodOptional<z.ZodString>;
    durationMs: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "CREATE_TABLE" | "ALTER_TABLE" | "DROP_TABLE" | "CREATE_INDEX" | "DROP_INDEX" | "INSERT" | "UPDATE" | "DELETE" | "TRUNCATE" | "OTHER";
    index: number;
    warnings: string[];
    sql: string;
    isDestructive: boolean;
    error?: string | undefined;
    success?: boolean | undefined;
    durationMs?: number | undefined;
    estimatedRowsAffected?: number | undefined;
}, {
    type: "CREATE_TABLE" | "ALTER_TABLE" | "DROP_TABLE" | "CREATE_INDEX" | "DROP_INDEX" | "INSERT" | "UPDATE" | "DELETE" | "TRUNCATE" | "OTHER";
    index: number;
    warnings: string[];
    sql: string;
    isDestructive: boolean;
    error?: string | undefined;
    success?: boolean | undefined;
    durationMs?: number | undefined;
    estimatedRowsAffected?: number | undefined;
}>;
declare const SimulationResultSchema: z.ZodObject<{
    migrationName: z.ZodString;
    verification: z.ZodEnum<["executed", "static-analysis", "not-verified"]>;
    outcome: z.ZodEnum<["success", "failure", "unknown"]>;
    statements: z.ZodArray<z.ZodObject<{
        index: z.ZodNumber;
        sql: z.ZodString;
        type: z.ZodEnum<["CREATE_TABLE", "ALTER_TABLE", "DROP_TABLE", "CREATE_INDEX", "DROP_INDEX", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "OTHER"]>;
        isDestructive: z.ZodBoolean;
        warnings: z.ZodArray<z.ZodString, "many">;
        estimatedRowsAffected: z.ZodOptional<z.ZodNumber>;
        success: z.ZodOptional<z.ZodBoolean>;
        error: z.ZodOptional<z.ZodString>;
        durationMs: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "CREATE_TABLE" | "ALTER_TABLE" | "DROP_TABLE" | "CREATE_INDEX" | "DROP_INDEX" | "INSERT" | "UPDATE" | "DELETE" | "TRUNCATE" | "OTHER";
        index: number;
        warnings: string[];
        sql: string;
        isDestructive: boolean;
        error?: string | undefined;
        success?: boolean | undefined;
        durationMs?: number | undefined;
        estimatedRowsAffected?: number | undefined;
    }, {
        type: "CREATE_TABLE" | "ALTER_TABLE" | "DROP_TABLE" | "CREATE_INDEX" | "DROP_INDEX" | "INSERT" | "UPDATE" | "DELETE" | "TRUNCATE" | "OTHER";
        index: number;
        warnings: string[];
        sql: string;
        isDestructive: boolean;
        error?: string | undefined;
        success?: boolean | undefined;
        durationMs?: number | undefined;
        estimatedRowsAffected?: number | undefined;
    }>, "many">;
    destructiveStatements: z.ZodNumber;
    warnings: z.ZodArray<z.ZodString, "many">;
    simulatedAt: z.ZodString;
    error: z.ZodOptional<z.ZodString>;
    mode: z.ZodOptional<z.ZodEnum<["static", "shadow", "live"]>>;
}, "strip", z.ZodTypeAny, {
    migrationName: string;
    warnings: string[];
    verification: "executed" | "static-analysis" | "not-verified";
    outcome: "unknown" | "success" | "failure";
    statements: {
        type: "CREATE_TABLE" | "ALTER_TABLE" | "DROP_TABLE" | "CREATE_INDEX" | "DROP_INDEX" | "INSERT" | "UPDATE" | "DELETE" | "TRUNCATE" | "OTHER";
        index: number;
        warnings: string[];
        sql: string;
        isDestructive: boolean;
        error?: string | undefined;
        success?: boolean | undefined;
        durationMs?: number | undefined;
        estimatedRowsAffected?: number | undefined;
    }[];
    destructiveStatements: number;
    simulatedAt: string;
    error?: string | undefined;
    mode?: "static" | "shadow" | "live" | undefined;
}, {
    migrationName: string;
    warnings: string[];
    verification: "executed" | "static-analysis" | "not-verified";
    outcome: "unknown" | "success" | "failure";
    statements: {
        type: "CREATE_TABLE" | "ALTER_TABLE" | "DROP_TABLE" | "CREATE_INDEX" | "DROP_INDEX" | "INSERT" | "UPDATE" | "DELETE" | "TRUNCATE" | "OTHER";
        index: number;
        warnings: string[];
        sql: string;
        isDestructive: boolean;
        error?: string | undefined;
        success?: boolean | undefined;
        durationMs?: number | undefined;
        estimatedRowsAffected?: number | undefined;
    }[];
    destructiveStatements: number;
    simulatedAt: string;
    error?: string | undefined;
    mode?: "static" | "shadow" | "live" | undefined;
}>;
declare const DriftRecoverySuggestionSchema: z.ZodObject<{
    driftItem: z.ZodObject<{
        sql: z.ZodString;
        type: z.ZodEnum<["table-missing", "table-extra", "column-mismatch", "index-change", "constraint-change", "unknown", "missing_migration", "extra_column", "extra_table", "modified_migration"]>;
        description: z.ZodString;
        identifier: z.ZodOptional<z.ZodString>;
        migrationName: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "unknown" | "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
        description: string;
        sql: string;
        migrationName?: string | undefined;
        identifier?: string | undefined;
    }, {
        type: "unknown" | "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
        description: string;
        sql: string;
        migrationName?: string | undefined;
        identifier?: string | undefined;
    }>;
    strategy: z.ZodEnum<["reconcile_history", "manual_migration", "manual_sql", "review_only"]>;
    description: z.ZodString;
    sql: z.ZodOptional<z.ZodString>;
    automated: z.ZodDefault<z.ZodLiteral<false>>;
    risk: z.ZodEnum<["low", "medium", "high", "critical"]>;
    warnings: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    description: string;
    automated: false;
    warnings: string[];
    driftItem: {
        type: "unknown" | "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
        description: string;
        sql: string;
        migrationName?: string | undefined;
        identifier?: string | undefined;
    };
    strategy: "reconcile_history" | "manual_migration" | "manual_sql" | "review_only";
    risk: "low" | "medium" | "high" | "critical";
    sql?: string | undefined;
}, {
    description: string;
    driftItem: {
        type: "unknown" | "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
        description: string;
        sql: string;
        migrationName?: string | undefined;
        identifier?: string | undefined;
    };
    strategy: "reconcile_history" | "manual_migration" | "manual_sql" | "review_only";
    risk: "low" | "medium" | "high" | "critical";
    automated?: false | undefined;
    warnings?: string[] | undefined;
    sql?: string | undefined;
}>;
declare const DriftRepairPlanSchema: z.ZodObject<{
    generatedAt: z.ZodString;
    driftCount: z.ZodNumber;
    suggestions: z.ZodArray<z.ZodObject<{
        driftItem: z.ZodObject<{
            sql: z.ZodString;
            type: z.ZodEnum<["table-missing", "table-extra", "column-mismatch", "index-change", "constraint-change", "unknown", "missing_migration", "extra_column", "extra_table", "modified_migration"]>;
            description: z.ZodString;
            identifier: z.ZodOptional<z.ZodString>;
            migrationName: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "unknown" | "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
            description: string;
            sql: string;
            migrationName?: string | undefined;
            identifier?: string | undefined;
        }, {
            type: "unknown" | "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
            description: string;
            sql: string;
            migrationName?: string | undefined;
            identifier?: string | undefined;
        }>;
        strategy: z.ZodEnum<["reconcile_history", "manual_migration", "manual_sql", "review_only"]>;
        description: z.ZodString;
        sql: z.ZodOptional<z.ZodString>;
        automated: z.ZodDefault<z.ZodLiteral<false>>;
        risk: z.ZodEnum<["low", "medium", "high", "critical"]>;
        warnings: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        automated: false;
        warnings: string[];
        driftItem: {
            type: "unknown" | "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
            description: string;
            sql: string;
            migrationName?: string | undefined;
            identifier?: string | undefined;
        };
        strategy: "reconcile_history" | "manual_migration" | "manual_sql" | "review_only";
        risk: "low" | "medium" | "high" | "critical";
        sql?: string | undefined;
    }, {
        description: string;
        driftItem: {
            type: "unknown" | "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
            description: string;
            sql: string;
            migrationName?: string | undefined;
            identifier?: string | undefined;
        };
        strategy: "reconcile_history" | "manual_migration" | "manual_sql" | "review_only";
        risk: "low" | "medium" | "high" | "critical";
        automated?: false | undefined;
        warnings?: string[] | undefined;
        sql?: string | undefined;
    }>, "many">;
    isMutatingDisabled: z.ZodDefault<z.ZodLiteral<true>>;
}, "strip", z.ZodTypeAny, {
    generatedAt: string;
    driftCount: number;
    suggestions: {
        description: string;
        automated: false;
        warnings: string[];
        driftItem: {
            type: "unknown" | "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
            description: string;
            sql: string;
            migrationName?: string | undefined;
            identifier?: string | undefined;
        };
        strategy: "reconcile_history" | "manual_migration" | "manual_sql" | "review_only";
        risk: "low" | "medium" | "high" | "critical";
        sql?: string | undefined;
    }[];
    isMutatingDisabled: true;
}, {
    generatedAt: string;
    driftCount: number;
    suggestions: {
        description: string;
        driftItem: {
            type: "unknown" | "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
            description: string;
            sql: string;
            migrationName?: string | undefined;
            identifier?: string | undefined;
        };
        strategy: "reconcile_history" | "manual_migration" | "manual_sql" | "review_only";
        risk: "low" | "medium" | "high" | "critical";
        automated?: false | undefined;
        warnings?: string[] | undefined;
        sql?: string | undefined;
    }[];
    isMutatingDisabled?: true | undefined;
}>;
declare const SchemaDiffSchema: z.ZodObject<{
    type: z.ZodEnum<["model_added", "model_removed", "field_added", "field_removed", "field_type_changed", "added", "removed", "modified"]>;
    modelName: z.ZodOptional<z.ZodString>;
    fieldName: z.ZodOptional<z.ZodString>;
    oldType: z.ZodOptional<z.ZodString>;
    newType: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    breaking: z.ZodBoolean;
    entity: z.ZodOptional<z.ZodString>;
    field: z.ZodOptional<z.ZodString>;
    before: z.ZodOptional<z.ZodString>;
    after: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "model_added" | "model_removed" | "field_added" | "field_removed" | "field_type_changed" | "added" | "removed" | "modified";
    description: string;
    breaking: boolean;
    modelName?: string | undefined;
    fieldName?: string | undefined;
    oldType?: string | undefined;
    newType?: string | undefined;
    entity?: string | undefined;
    field?: string | undefined;
    before?: string | undefined;
    after?: string | undefined;
}, {
    type: "model_added" | "model_removed" | "field_added" | "field_removed" | "field_type_changed" | "added" | "removed" | "modified";
    description: string;
    breaking: boolean;
    modelName?: string | undefined;
    fieldName?: string | undefined;
    oldType?: string | undefined;
    newType?: string | undefined;
    entity?: string | undefined;
    field?: string | undefined;
    before?: string | undefined;
    after?: string | undefined;
}>;
declare const MigrationHistoryDiffSchema: z.ZodObject<{
    sourceEnv: z.ZodString;
    targetEnv: z.ZodString;
    sourceApplied: z.ZodNumber;
    targetApplied: z.ZodNumber;
    onlyInSource: z.ZodArray<z.ZodString, "many">;
    onlyInTarget: z.ZodArray<z.ZodString, "many">;
    divergencePoint: z.ZodOptional<z.ZodString>;
    inSync: z.ZodBoolean;
    name: z.ZodOptional<z.ZodString>;
    presentInSource: z.ZodOptional<z.ZodBoolean>;
    presentInTarget: z.ZodOptional<z.ZodBoolean>;
    statusInSource: z.ZodOptional<z.ZodEnum<["applied", "pending", "failed", "unknown"]>>;
    statusInTarget: z.ZodOptional<z.ZodEnum<["applied", "pending", "failed", "unknown"]>>;
}, "strip", z.ZodTypeAny, {
    sourceEnv: string;
    targetEnv: string;
    sourceApplied: number;
    targetApplied: number;
    onlyInSource: string[];
    onlyInTarget: string[];
    inSync: boolean;
    name?: string | undefined;
    divergencePoint?: string | undefined;
    presentInSource?: boolean | undefined;
    presentInTarget?: boolean | undefined;
    statusInSource?: "applied" | "pending" | "failed" | "unknown" | undefined;
    statusInTarget?: "applied" | "pending" | "failed" | "unknown" | undefined;
}, {
    sourceEnv: string;
    targetEnv: string;
    sourceApplied: number;
    targetApplied: number;
    onlyInSource: string[];
    onlyInTarget: string[];
    inSync: boolean;
    name?: string | undefined;
    divergencePoint?: string | undefined;
    presentInSource?: boolean | undefined;
    presentInTarget?: boolean | undefined;
    statusInSource?: "applied" | "pending" | "failed" | "unknown" | undefined;
    statusInTarget?: "applied" | "pending" | "failed" | "unknown" | undefined;
}>;
declare const EnvironmentComparisonEntrySchema: z.ZodObject<{
    name: z.ZodString;
    reachable: z.ZodBoolean;
    appliedCount: z.ZodNumber;
    pendingCount: z.ZodNumber;
    failedCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    reachable: boolean;
    appliedCount: number;
    pendingCount: number;
    failedCount: number;
}, {
    name: string;
    reachable: boolean;
    appliedCount: number;
    pendingCount: number;
    failedCount: number;
}>;
declare const EnvironmentComparisonSchema: z.ZodObject<{
    referenceEnv: z.ZodString;
    environments: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        reachable: z.ZodBoolean;
        appliedCount: z.ZodNumber;
        pendingCount: z.ZodNumber;
        failedCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        reachable: boolean;
        appliedCount: number;
        pendingCount: number;
        failedCount: number;
    }, {
        name: string;
        reachable: boolean;
        appliedCount: number;
        pendingCount: number;
        failedCount: number;
    }>, "many">;
    diffs: z.ZodArray<z.ZodObject<{
        sourceEnv: z.ZodString;
        targetEnv: z.ZodString;
        sourceApplied: z.ZodNumber;
        targetApplied: z.ZodNumber;
        onlyInSource: z.ZodArray<z.ZodString, "many">;
        onlyInTarget: z.ZodArray<z.ZodString, "many">;
        divergencePoint: z.ZodOptional<z.ZodString>;
        inSync: z.ZodBoolean;
        name: z.ZodOptional<z.ZodString>;
        presentInSource: z.ZodOptional<z.ZodBoolean>;
        presentInTarget: z.ZodOptional<z.ZodBoolean>;
        statusInSource: z.ZodOptional<z.ZodEnum<["applied", "pending", "failed", "unknown"]>>;
        statusInTarget: z.ZodOptional<z.ZodEnum<["applied", "pending", "failed", "unknown"]>>;
    }, "strip", z.ZodTypeAny, {
        sourceEnv: string;
        targetEnv: string;
        sourceApplied: number;
        targetApplied: number;
        onlyInSource: string[];
        onlyInTarget: string[];
        inSync: boolean;
        name?: string | undefined;
        divergencePoint?: string | undefined;
        presentInSource?: boolean | undefined;
        presentInTarget?: boolean | undefined;
        statusInSource?: "applied" | "pending" | "failed" | "unknown" | undefined;
        statusInTarget?: "applied" | "pending" | "failed" | "unknown" | undefined;
    }, {
        sourceEnv: string;
        targetEnv: string;
        sourceApplied: number;
        targetApplied: number;
        onlyInSource: string[];
        onlyInTarget: string[];
        inSync: boolean;
        name?: string | undefined;
        divergencePoint?: string | undefined;
        presentInSource?: boolean | undefined;
        presentInTarget?: boolean | undefined;
        statusInSource?: "applied" | "pending" | "failed" | "unknown" | undefined;
        statusInTarget?: "applied" | "pending" | "failed" | "unknown" | undefined;
    }>, "many">;
    allInSync: z.ZodBoolean;
    comparedAt: z.ZodString;
    source: z.ZodOptional<z.ZodString>;
    target: z.ZodOptional<z.ZodString>;
    schemaDiffs: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["model_added", "model_removed", "field_added", "field_removed", "field_type_changed", "added", "removed", "modified"]>;
        modelName: z.ZodOptional<z.ZodString>;
        fieldName: z.ZodOptional<z.ZodString>;
        oldType: z.ZodOptional<z.ZodString>;
        newType: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        breaking: z.ZodBoolean;
        entity: z.ZodOptional<z.ZodString>;
        field: z.ZodOptional<z.ZodString>;
        before: z.ZodOptional<z.ZodString>;
        after: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "model_added" | "model_removed" | "field_added" | "field_removed" | "field_type_changed" | "added" | "removed" | "modified";
        description: string;
        breaking: boolean;
        modelName?: string | undefined;
        fieldName?: string | undefined;
        oldType?: string | undefined;
        newType?: string | undefined;
        entity?: string | undefined;
        field?: string | undefined;
        before?: string | undefined;
        after?: string | undefined;
    }, {
        type: "model_added" | "model_removed" | "field_added" | "field_removed" | "field_type_changed" | "added" | "removed" | "modified";
        description: string;
        breaking: boolean;
        modelName?: string | undefined;
        fieldName?: string | undefined;
        oldType?: string | undefined;
        newType?: string | undefined;
        entity?: string | undefined;
        field?: string | undefined;
        before?: string | undefined;
        after?: string | undefined;
    }>, "many">>;
    migrationDiffs: z.ZodOptional<z.ZodArray<z.ZodObject<{
        sourceEnv: z.ZodString;
        targetEnv: z.ZodString;
        sourceApplied: z.ZodNumber;
        targetApplied: z.ZodNumber;
        onlyInSource: z.ZodArray<z.ZodString, "many">;
        onlyInTarget: z.ZodArray<z.ZodString, "many">;
        divergencePoint: z.ZodOptional<z.ZodString>;
        inSync: z.ZodBoolean;
        name: z.ZodOptional<z.ZodString>;
        presentInSource: z.ZodOptional<z.ZodBoolean>;
        presentInTarget: z.ZodOptional<z.ZodBoolean>;
        statusInSource: z.ZodOptional<z.ZodEnum<["applied", "pending", "failed", "unknown"]>>;
        statusInTarget: z.ZodOptional<z.ZodEnum<["applied", "pending", "failed", "unknown"]>>;
    }, "strip", z.ZodTypeAny, {
        sourceEnv: string;
        targetEnv: string;
        sourceApplied: number;
        targetApplied: number;
        onlyInSource: string[];
        onlyInTarget: string[];
        inSync: boolean;
        name?: string | undefined;
        divergencePoint?: string | undefined;
        presentInSource?: boolean | undefined;
        presentInTarget?: boolean | undefined;
        statusInSource?: "applied" | "pending" | "failed" | "unknown" | undefined;
        statusInTarget?: "applied" | "pending" | "failed" | "unknown" | undefined;
    }, {
        sourceEnv: string;
        targetEnv: string;
        sourceApplied: number;
        targetApplied: number;
        onlyInSource: string[];
        onlyInTarget: string[];
        inSync: boolean;
        name?: string | undefined;
        divergencePoint?: string | undefined;
        presentInSource?: boolean | undefined;
        presentInTarget?: boolean | undefined;
        statusInSource?: "applied" | "pending" | "failed" | "unknown" | undefined;
        statusInTarget?: "applied" | "pending" | "failed" | "unknown" | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    referenceEnv: string;
    environments: {
        name: string;
        reachable: boolean;
        appliedCount: number;
        pendingCount: number;
        failedCount: number;
    }[];
    diffs: {
        sourceEnv: string;
        targetEnv: string;
        sourceApplied: number;
        targetApplied: number;
        onlyInSource: string[];
        onlyInTarget: string[];
        inSync: boolean;
        name?: string | undefined;
        divergencePoint?: string | undefined;
        presentInSource?: boolean | undefined;
        presentInTarget?: boolean | undefined;
        statusInSource?: "applied" | "pending" | "failed" | "unknown" | undefined;
        statusInTarget?: "applied" | "pending" | "failed" | "unknown" | undefined;
    }[];
    allInSync: boolean;
    comparedAt: string;
    source?: string | undefined;
    target?: string | undefined;
    schemaDiffs?: {
        type: "model_added" | "model_removed" | "field_added" | "field_removed" | "field_type_changed" | "added" | "removed" | "modified";
        description: string;
        breaking: boolean;
        modelName?: string | undefined;
        fieldName?: string | undefined;
        oldType?: string | undefined;
        newType?: string | undefined;
        entity?: string | undefined;
        field?: string | undefined;
        before?: string | undefined;
        after?: string | undefined;
    }[] | undefined;
    migrationDiffs?: {
        sourceEnv: string;
        targetEnv: string;
        sourceApplied: number;
        targetApplied: number;
        onlyInSource: string[];
        onlyInTarget: string[];
        inSync: boolean;
        name?: string | undefined;
        divergencePoint?: string | undefined;
        presentInSource?: boolean | undefined;
        presentInTarget?: boolean | undefined;
        statusInSource?: "applied" | "pending" | "failed" | "unknown" | undefined;
        statusInTarget?: "applied" | "pending" | "failed" | "unknown" | undefined;
    }[] | undefined;
}, {
    referenceEnv: string;
    environments: {
        name: string;
        reachable: boolean;
        appliedCount: number;
        pendingCount: number;
        failedCount: number;
    }[];
    diffs: {
        sourceEnv: string;
        targetEnv: string;
        sourceApplied: number;
        targetApplied: number;
        onlyInSource: string[];
        onlyInTarget: string[];
        inSync: boolean;
        name?: string | undefined;
        divergencePoint?: string | undefined;
        presentInSource?: boolean | undefined;
        presentInTarget?: boolean | undefined;
        statusInSource?: "applied" | "pending" | "failed" | "unknown" | undefined;
        statusInTarget?: "applied" | "pending" | "failed" | "unknown" | undefined;
    }[];
    allInSync: boolean;
    comparedAt: string;
    source?: string | undefined;
    target?: string | undefined;
    schemaDiffs?: {
        type: "model_added" | "model_removed" | "field_added" | "field_removed" | "field_type_changed" | "added" | "removed" | "modified";
        description: string;
        breaking: boolean;
        modelName?: string | undefined;
        fieldName?: string | undefined;
        oldType?: string | undefined;
        newType?: string | undefined;
        entity?: string | undefined;
        field?: string | undefined;
        before?: string | undefined;
        after?: string | undefined;
    }[] | undefined;
    migrationDiffs?: {
        sourceEnv: string;
        targetEnv: string;
        sourceApplied: number;
        targetApplied: number;
        onlyInSource: string[];
        onlyInTarget: string[];
        inSync: boolean;
        name?: string | undefined;
        divergencePoint?: string | undefined;
        presentInSource?: boolean | undefined;
        presentInTarget?: boolean | undefined;
        statusInSource?: "applied" | "pending" | "failed" | "unknown" | undefined;
        statusInTarget?: "applied" | "pending" | "failed" | "unknown" | undefined;
    }[] | undefined;
}>;
declare const GitMigrationInfoSchema: z.ZodObject<{
    migrationName: z.ZodString;
    committed: z.ZodBoolean;
    commitHash: z.ZodOptional<z.ZodString>;
    commitAuthor: z.ZodOptional<z.ZodString>;
    commitDate: z.ZodOptional<z.ZodString>;
    commitMessage: z.ZodOptional<z.ZodString>;
    branch: z.ZodOptional<z.ZodString>;
    authorName: z.ZodOptional<z.ZodString>;
    committedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    migrationName: string;
    committed: boolean;
    commitHash?: string | undefined;
    commitAuthor?: string | undefined;
    commitDate?: string | undefined;
    commitMessage?: string | undefined;
    branch?: string | undefined;
    authorName?: string | undefined;
    committedAt?: string | undefined;
}, {
    migrationName: string;
    committed: boolean;
    commitHash?: string | undefined;
    commitAuthor?: string | undefined;
    commitDate?: string | undefined;
    commitMessage?: string | undefined;
    branch?: string | undefined;
    authorName?: string | undefined;
    committedAt?: string | undefined;
}>;
declare const MigrationConflictSchema: z.ZodObject<{
    timestamp: z.ZodString;
    migrations: z.ZodArray<z.ZodString, "many">;
    type: z.ZodEnum<["duplicate_timestamp", "timestamp-overlap", "name-conflict", "history-diverge"]>;
    description: z.ZodString;
    migrationA: z.ZodOptional<z.ZodString>;
    migrationB: z.ZodOptional<z.ZodString>;
    branches: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    conflictType: z.ZodOptional<z.ZodEnum<["timestamp-overlap", "name-conflict", "history-diverge"]>>;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    type: "duplicate_timestamp" | "timestamp-overlap" | "name-conflict" | "history-diverge";
    description: string;
    migrations: string[];
    migrationA?: string | undefined;
    migrationB?: string | undefined;
    branches?: string[] | undefined;
    conflictType?: "timestamp-overlap" | "name-conflict" | "history-diverge" | undefined;
}, {
    timestamp: string;
    type: "duplicate_timestamp" | "timestamp-overlap" | "name-conflict" | "history-diverge";
    description: string;
    migrations: string[];
    migrationA?: string | undefined;
    migrationB?: string | undefined;
    branches?: string[] | undefined;
    conflictType?: "timestamp-overlap" | "name-conflict" | "history-diverge" | undefined;
}>;
declare const AuditActionSchema: z.ZodEnum<["dashboard.start", "status.check", "drift.detect", "drift.repair", "migration.check", "migration.apply", "migration.simulate", "migration.rollback", "migration.inspect", "migration.history", "migration.create", "deployment.plan", "doctor.run", "env.compare", "schema.diff"]>;
declare const AuditEntrySchema: z.ZodObject<{
    timestamp: z.ZodString;
    action: z.ZodEnum<["dashboard.start", "status.check", "drift.detect", "drift.repair", "migration.check", "migration.apply", "migration.simulate", "migration.rollback", "migration.inspect", "migration.history", "migration.create", "deployment.plan", "doctor.run", "env.compare", "schema.diff"]>;
    cwd: z.ZodString;
    result: z.ZodEnum<["success", "failure", "warning"]>;
    detail: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    action: "dashboard.start" | "status.check" | "drift.detect" | "drift.repair" | "migration.check" | "migration.apply" | "migration.simulate" | "migration.rollback" | "migration.inspect" | "migration.history" | "migration.create" | "deployment.plan" | "doctor.run" | "env.compare" | "schema.diff";
    cwd: string;
    result: "success" | "failure" | "warning";
    detail?: Record<string, unknown> | undefined;
}, {
    timestamp: string;
    action: "dashboard.start" | "status.check" | "drift.detect" | "drift.repair" | "migration.check" | "migration.apply" | "migration.simulate" | "migration.rollback" | "migration.inspect" | "migration.history" | "migration.create" | "deployment.plan" | "doctor.run" | "env.compare" | "schema.diff";
    cwd: string;
    result: "success" | "failure" | "warning";
    detail?: Record<string, unknown> | undefined;
}>;
declare const PaginationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
declare const PaginationMetaSchema: z.ZodObject<{
    page: z.ZodNumber;
    limit: z.ZodNumber;
    total: z.ZodNumber;
    pages: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    total: number;
    page: number;
    limit: number;
    pages: number;
}, {
    total: number;
    page: number;
    limit: number;
    pages: number;
}>;
declare const WebhookConfigSchema: z.ZodObject<{
    type: z.ZodEnum<["slack", "discord", "http"]>;
    url: z.ZodString;
    events: z.ZodOptional<z.ZodArray<z.ZodEnum<["drift-detected", "migration-failed", "check-complete", "migration-applied", "simulation-complete", "risk-threshold-exceeded"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "slack" | "discord" | "http";
    url: string;
    events?: ("drift-detected" | "migration-failed" | "check-complete" | "migration-applied" | "simulation-complete" | "risk-threshold-exceeded")[] | undefined;
}, {
    type: "slack" | "discord" | "http";
    url: string;
    events?: ("drift-detected" | "migration-failed" | "check-complete" | "migration-applied" | "simulation-complete" | "risk-threshold-exceeded")[] | undefined;
}>;
declare const FeatureFlagsSchema: z.ZodObject<{
    riskAnalysis: z.ZodDefault<z.ZodBoolean>;
    webhookAlerts: z.ZodDefault<z.ZodBoolean>;
    auditLog: z.ZodDefault<z.ZodBoolean>;
    ciAnnotations: z.ZodDefault<z.ZodBoolean>;
    envComparison: z.ZodDefault<z.ZodBoolean>;
    rollbackGen: z.ZodDefault<z.ZodBoolean>;
    simulation: z.ZodDefault<z.ZodBoolean>;
    gitAwareness: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    riskAnalysis: boolean;
    webhookAlerts: boolean;
    auditLog: boolean;
    ciAnnotations: boolean;
    envComparison: boolean;
    rollbackGen: boolean;
    simulation: boolean;
    gitAwareness: boolean;
}, {
    riskAnalysis?: boolean | undefined;
    webhookAlerts?: boolean | undefined;
    auditLog?: boolean | undefined;
    ciAnnotations?: boolean | undefined;
    envComparison?: boolean | undefined;
    rollbackGen?: boolean | undefined;
    simulation?: boolean | undefined;
    gitAwareness?: boolean | undefined;
}>;
declare const EnvironmentEntrySchema: z.ZodObject<{
    name: z.ZodString;
    databaseUrl: z.ZodUnion<[z.ZodString, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    name: string;
    databaseUrl: string;
}, {
    name: string;
    databaseUrl: string;
}>;
declare const PrismaFlowConfigSchema: z.ZodObject<{
    port: z.ZodDefault<z.ZodNumber>;
    logLevel: z.ZodDefault<z.ZodEnum<["trace", "debug", "info", "warn", "error"]>>;
    openBrowser: z.ZodDefault<z.ZodBoolean>;
    features: z.ZodDefault<z.ZodObject<{
        riskAnalysis: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        webhookAlerts: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        auditLog: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        ciAnnotations: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        envComparison: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        rollbackGen: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        simulation: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        gitAwareness: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        riskAnalysis?: boolean | undefined;
        webhookAlerts?: boolean | undefined;
        auditLog?: boolean | undefined;
        ciAnnotations?: boolean | undefined;
        envComparison?: boolean | undefined;
        rollbackGen?: boolean | undefined;
        simulation?: boolean | undefined;
        gitAwareness?: boolean | undefined;
    }, {
        riskAnalysis?: boolean | undefined;
        webhookAlerts?: boolean | undefined;
        auditLog?: boolean | undefined;
        ciAnnotations?: boolean | undefined;
        envComparison?: boolean | undefined;
        rollbackGen?: boolean | undefined;
        simulation?: boolean | undefined;
        gitAwareness?: boolean | undefined;
    }>>;
    webhooks: z.ZodDefault<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["slack", "discord", "http"]>;
        url: z.ZodString;
        events: z.ZodOptional<z.ZodArray<z.ZodEnum<["drift-detected", "migration-failed", "check-complete", "migration-applied", "simulation-complete", "risk-threshold-exceeded"]>, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "slack" | "discord" | "http";
        url: string;
        events?: ("drift-detected" | "migration-failed" | "check-complete" | "migration-applied" | "simulation-complete" | "risk-threshold-exceeded")[] | undefined;
    }, {
        type: "slack" | "discord" | "http";
        url: string;
        events?: ("drift-detected" | "migration-failed" | "check-complete" | "migration-applied" | "simulation-complete" | "risk-threshold-exceeded")[] | undefined;
    }>, "many">>;
    environments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        databaseUrl: z.ZodUnion<[z.ZodString, z.ZodString]>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        databaseUrl: string;
    }, {
        name: string;
        databaseUrl: string;
    }>, "many">>;
    auditLogMaxMb: z.ZodDefault<z.ZodNumber>;
    riskThreshold: z.ZodDefault<z.ZodEnum<["low", "medium", "high", "critical"]>>;
}, "strip", z.ZodTypeAny, {
    environments: {
        name: string;
        databaseUrl: string;
    }[];
    port: number;
    logLevel: "error" | "trace" | "debug" | "info" | "warn";
    openBrowser: boolean;
    features: {
        riskAnalysis?: boolean | undefined;
        webhookAlerts?: boolean | undefined;
        auditLog?: boolean | undefined;
        ciAnnotations?: boolean | undefined;
        envComparison?: boolean | undefined;
        rollbackGen?: boolean | undefined;
        simulation?: boolean | undefined;
        gitAwareness?: boolean | undefined;
    };
    webhooks: {
        type: "slack" | "discord" | "http";
        url: string;
        events?: ("drift-detected" | "migration-failed" | "check-complete" | "migration-applied" | "simulation-complete" | "risk-threshold-exceeded")[] | undefined;
    }[];
    auditLogMaxMb: number;
    riskThreshold: "low" | "medium" | "high" | "critical";
}, {
    environments?: {
        name: string;
        databaseUrl: string;
    }[] | undefined;
    port?: number | undefined;
    logLevel?: "error" | "trace" | "debug" | "info" | "warn" | undefined;
    openBrowser?: boolean | undefined;
    features?: {
        riskAnalysis?: boolean | undefined;
        webhookAlerts?: boolean | undefined;
        auditLog?: boolean | undefined;
        ciAnnotations?: boolean | undefined;
        envComparison?: boolean | undefined;
        rollbackGen?: boolean | undefined;
        simulation?: boolean | undefined;
        gitAwareness?: boolean | undefined;
    } | undefined;
    webhooks?: {
        type: "slack" | "discord" | "http";
        url: string;
        events?: ("drift-detected" | "migration-failed" | "check-complete" | "migration-applied" | "simulation-complete" | "risk-threshold-exceeded")[] | undefined;
    }[] | undefined;
    auditLogMaxMb?: number | undefined;
    riskThreshold?: "low" | "medium" | "high" | "critical" | undefined;
}>;
declare const SSEEventTypeSchema: z.ZodEnum<["status-update", "drift-detected", "drift-resolved", "migration-applied", "migration-failed", "simulation-progress", "simulation-complete", "repair-progress", "repair-complete"]>;
declare const SSEEventSchema: z.ZodObject<{
    type: z.ZodEnum<["status-update", "drift-detected", "drift-resolved", "migration-applied", "migration-failed", "simulation-progress", "simulation-complete", "repair-progress", "repair-complete"]>;
    data: z.ZodUnknown;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    type: "drift-detected" | "migration-failed" | "migration-applied" | "simulation-complete" | "status-update" | "drift-resolved" | "simulation-progress" | "repair-progress" | "repair-complete";
    data?: unknown;
}, {
    timestamp: string;
    type: "drift-detected" | "migration-failed" | "migration-applied" | "simulation-complete" | "status-update" | "drift-resolved" | "simulation-progress" | "repair-progress" | "repair-complete";
    data?: unknown;
}>;
declare const SchemaFieldSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodString;
    kind: z.ZodString;
    isId: z.ZodBoolean;
    isRequired: z.ZodBoolean;
    isList: z.ZodBoolean;
    isUnique: z.ZodBoolean;
    hasDefaultValue: z.ZodBoolean;
    default: z.ZodOptional<z.ZodUnknown>;
    relationName: z.ZodOptional<z.ZodString>;
    relationFromFields: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    relationToFields: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: string;
    kind: string;
    isId: boolean;
    isRequired: boolean;
    isList: boolean;
    isUnique: boolean;
    hasDefaultValue: boolean;
    default?: unknown;
    relationName?: string | undefined;
    relationFromFields?: string[] | undefined;
    relationToFields?: string[] | undefined;
}, {
    name: string;
    type: string;
    kind: string;
    isId: boolean;
    isRequired: boolean;
    isList: boolean;
    isUnique: boolean;
    hasDefaultValue: boolean;
    default?: unknown;
    relationName?: string | undefined;
    relationFromFields?: string[] | undefined;
    relationToFields?: string[] | undefined;
}>;
declare const SchemaModelSchema: z.ZodObject<{
    name: z.ZodString;
    dbName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    fields: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        kind: z.ZodString;
        isId: z.ZodBoolean;
        isRequired: z.ZodBoolean;
        isList: z.ZodBoolean;
        isUnique: z.ZodBoolean;
        hasDefaultValue: z.ZodBoolean;
        default: z.ZodOptional<z.ZodUnknown>;
        relationName: z.ZodOptional<z.ZodString>;
        relationFromFields: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        relationToFields: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        type: string;
        kind: string;
        isId: boolean;
        isRequired: boolean;
        isList: boolean;
        isUnique: boolean;
        hasDefaultValue: boolean;
        default?: unknown;
        relationName?: string | undefined;
        relationFromFields?: string[] | undefined;
        relationToFields?: string[] | undefined;
    }, {
        name: string;
        type: string;
        kind: string;
        isId: boolean;
        isRequired: boolean;
        isList: boolean;
        isUnique: boolean;
        hasDefaultValue: boolean;
        default?: unknown;
        relationName?: string | undefined;
        relationFromFields?: string[] | undefined;
        relationToFields?: string[] | undefined;
    }>, "many">;
    primaryKey: z.ZodOptional<z.ZodNullable<z.ZodUnknown>>;
    uniqueFields: z.ZodOptional<z.ZodArray<z.ZodArray<z.ZodString, "many">, "many">>;
    uniqueIndexes: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    fields: {
        name: string;
        type: string;
        kind: string;
        isId: boolean;
        isRequired: boolean;
        isList: boolean;
        isUnique: boolean;
        hasDefaultValue: boolean;
        default?: unknown;
        relationName?: string | undefined;
        relationFromFields?: string[] | undefined;
        relationToFields?: string[] | undefined;
    }[];
    dbName?: string | null | undefined;
    primaryKey?: unknown;
    uniqueFields?: string[][] | undefined;
    uniqueIndexes?: unknown[] | undefined;
}, {
    name: string;
    fields: {
        name: string;
        type: string;
        kind: string;
        isId: boolean;
        isRequired: boolean;
        isList: boolean;
        isUnique: boolean;
        hasDefaultValue: boolean;
        default?: unknown;
        relationName?: string | undefined;
        relationFromFields?: string[] | undefined;
        relationToFields?: string[] | undefined;
    }[];
    dbName?: string | null | undefined;
    primaryKey?: unknown;
    uniqueFields?: string[][] | undefined;
    uniqueIndexes?: unknown[] | undefined;
}>;
declare const SchemaEnumSchema: z.ZodObject<{
    name: z.ZodString;
    values: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
        name: z.ZodString;
        dbName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        dbName?: string | null | undefined;
    }, {
        name: string;
        dbName?: string | null | undefined;
    }>]>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    values: (string | {
        name: string;
        dbName?: string | null | undefined;
    })[];
}, {
    name: string;
    values: (string | {
        name: string;
        dbName?: string | null | undefined;
    })[];
}>;
declare const SchemaDatamodelSchema: z.ZodObject<{
    models: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        dbName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        fields: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodString;
            kind: z.ZodString;
            isId: z.ZodBoolean;
            isRequired: z.ZodBoolean;
            isList: z.ZodBoolean;
            isUnique: z.ZodBoolean;
            hasDefaultValue: z.ZodBoolean;
            default: z.ZodOptional<z.ZodUnknown>;
            relationName: z.ZodOptional<z.ZodString>;
            relationFromFields: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            relationToFields: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            type: string;
            kind: string;
            isId: boolean;
            isRequired: boolean;
            isList: boolean;
            isUnique: boolean;
            hasDefaultValue: boolean;
            default?: unknown;
            relationName?: string | undefined;
            relationFromFields?: string[] | undefined;
            relationToFields?: string[] | undefined;
        }, {
            name: string;
            type: string;
            kind: string;
            isId: boolean;
            isRequired: boolean;
            isList: boolean;
            isUnique: boolean;
            hasDefaultValue: boolean;
            default?: unknown;
            relationName?: string | undefined;
            relationFromFields?: string[] | undefined;
            relationToFields?: string[] | undefined;
        }>, "many">;
        primaryKey: z.ZodOptional<z.ZodNullable<z.ZodUnknown>>;
        uniqueFields: z.ZodOptional<z.ZodArray<z.ZodArray<z.ZodString, "many">, "many">>;
        uniqueIndexes: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        fields: {
            name: string;
            type: string;
            kind: string;
            isId: boolean;
            isRequired: boolean;
            isList: boolean;
            isUnique: boolean;
            hasDefaultValue: boolean;
            default?: unknown;
            relationName?: string | undefined;
            relationFromFields?: string[] | undefined;
            relationToFields?: string[] | undefined;
        }[];
        dbName?: string | null | undefined;
        primaryKey?: unknown;
        uniqueFields?: string[][] | undefined;
        uniqueIndexes?: unknown[] | undefined;
    }, {
        name: string;
        fields: {
            name: string;
            type: string;
            kind: string;
            isId: boolean;
            isRequired: boolean;
            isList: boolean;
            isUnique: boolean;
            hasDefaultValue: boolean;
            default?: unknown;
            relationName?: string | undefined;
            relationFromFields?: string[] | undefined;
            relationToFields?: string[] | undefined;
        }[];
        dbName?: string | null | undefined;
        primaryKey?: unknown;
        uniqueFields?: string[][] | undefined;
        uniqueIndexes?: unknown[] | undefined;
    }>, "many">;
    enums: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        values: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
            name: z.ZodString;
            dbName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            dbName?: string | null | undefined;
        }, {
            name: string;
            dbName?: string | null | undefined;
        }>]>, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        values: (string | {
            name: string;
            dbName?: string | null | undefined;
        })[];
    }, {
        name: string;
        values: (string | {
            name: string;
            dbName?: string | null | undefined;
        })[];
    }>, "many">;
    types: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
}, "strip", z.ZodTypeAny, {
    models: {
        name: string;
        fields: {
            name: string;
            type: string;
            kind: string;
            isId: boolean;
            isRequired: boolean;
            isList: boolean;
            isUnique: boolean;
            hasDefaultValue: boolean;
            default?: unknown;
            relationName?: string | undefined;
            relationFromFields?: string[] | undefined;
            relationToFields?: string[] | undefined;
        }[];
        dbName?: string | null | undefined;
        primaryKey?: unknown;
        uniqueFields?: string[][] | undefined;
        uniqueIndexes?: unknown[] | undefined;
    }[];
    enums: {
        name: string;
        values: (string | {
            name: string;
            dbName?: string | null | undefined;
        })[];
    }[];
    types?: unknown[] | undefined;
}, {
    models: {
        name: string;
        fields: {
            name: string;
            type: string;
            kind: string;
            isId: boolean;
            isRequired: boolean;
            isList: boolean;
            isUnique: boolean;
            hasDefaultValue: boolean;
            default?: unknown;
            relationName?: string | undefined;
            relationFromFields?: string[] | undefined;
            relationToFields?: string[] | undefined;
        }[];
        dbName?: string | null | undefined;
        primaryKey?: unknown;
        uniqueFields?: string[][] | undefined;
        uniqueIndexes?: unknown[] | undefined;
    }[];
    enums: {
        name: string;
        values: (string | {
            name: string;
            dbName?: string | null | undefined;
        })[];
    }[];
    types?: unknown[] | undefined;
}>;

type MigrationStatus = z.infer<typeof MigrationStatusSchema>;
type MigrationVerificationStatus = z.infer<typeof MigrationVerificationStatusSchema>;
type RiskLevel = z.infer<typeof RiskLevelSchema>;
type DriftType = z.infer<typeof DriftTypeSchema>;
type DriftDetectionStatus = z.infer<typeof DriftDetectionStatusSchema>;
type DriftRepairStrategy = z.infer<typeof DriftRepairStrategySchema>;
type LogLevel = z.infer<typeof LogLevelSchema>;
type WebhookType = z.infer<typeof WebhookTypeSchema>;
type WebhookEvent = z.infer<typeof WebhookEventSchema>;
type DatabaseProvider = z.infer<typeof DatabaseProviderSchema>;
type SchemaDiffType = z.infer<typeof SchemaDiffTypeSchema>;
type SimulationVerification = z.infer<typeof SimulationVerificationSchema>;
type SimulationOutcome = z.infer<typeof SimulationOutcomeSchema>;
type SimulationMode = z.infer<typeof SimulationModeSchema>;
type SimulationStatementType = z.infer<typeof SimulationStatementTypeSchema>;
type DeploymentReadinessStatus = z.infer<typeof DeploymentReadinessStatusSchema>;
type DeploymentReadinessCheckId = z.infer<typeof DeploymentReadinessCheckIdSchema>;
type DeploymentPlanPriority = z.infer<typeof DeploymentPlanPrioritySchema>;
type DeploymentPlanDecision = DeploymentReadinessStatus;
type Migration = z.infer<typeof MigrationSchema>;
type RiskFactor = z.infer<typeof RiskFactorSchema>;
type MigrationRiskScore = z.infer<typeof MigrationRiskScoreSchema>;
type RollbackStep = z.infer<typeof RollbackStepSchema>;
type RollbackPlan = z.infer<typeof RollbackPlanSchema>;
type MigrationDetail = z.infer<typeof MigrationDetailSchema>;
type DriftItem = z.infer<typeof DriftItemSchema>;
type DriftResult = z.infer<typeof DriftResultSchema>;
type DeploymentReadinessCheck = z.infer<typeof DeploymentReadinessCheckSchema>;
type DeploymentReadiness = z.infer<typeof DeploymentReadinessSchema>;
type DeploymentPlanAction = z.infer<typeof DeploymentPlanActionSchema>;
type DeploymentPlanCommand = z.infer<typeof DeploymentPlanCommandSchema>;
type DeploymentPlanMigrationSummary = z.infer<typeof DeploymentPlanMigrationSummarySchema>;
type DeploymentPlanDriftSummary = z.infer<typeof DeploymentPlanDriftSummarySchema>;
type DeploymentPlan = z.infer<typeof DeploymentPlanSchema>;
type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
type SimulationStatement = z.infer<typeof SimulationStatementSchema>;
type SimulationResult = z.infer<typeof SimulationResultSchema>;
type DriftRecoverySuggestion = z.infer<typeof DriftRecoverySuggestionSchema>;
type DriftRepairPlan = z.infer<typeof DriftRepairPlanSchema>;
type SchemaDiff = z.infer<typeof SchemaDiffSchema>;
type MigrationHistoryDiff = z.infer<typeof MigrationHistoryDiffSchema>;
type EnvironmentComparisonEntry = z.infer<typeof EnvironmentComparisonEntrySchema>;
type EnvironmentComparison = z.infer<typeof EnvironmentComparisonSchema>;
type GitMigrationInfo = z.infer<typeof GitMigrationInfoSchema>;
type MigrationConflict = z.infer<typeof MigrationConflictSchema>;
type AuditAction = z.infer<typeof AuditActionSchema>;
type AuditEntry = z.infer<typeof AuditEntrySchema>;
type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
type WebhookConfig = z.infer<typeof WebhookConfigSchema>;
type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;
type EnvironmentEntry = z.infer<typeof EnvironmentEntrySchema>;
type PrismaFlowConfig = z.infer<typeof PrismaFlowConfigSchema>;
type PrismaFlowConfigParsed = z.infer<typeof PrismaFlowConfigSchema>;
type SSEEventType = z.infer<typeof SSEEventTypeSchema>;
type SSEEvent<T = unknown> = {
    type: SSEEventType;
    data: T;
    timestamp: string;
};
type SchemaField = z.infer<typeof SchemaFieldSchema>;
type SchemaModel = z.infer<typeof SchemaModelSchema>;
type SchemaEnum = z.infer<typeof SchemaEnumSchema>;
type SchemaDatamodel = z.infer<typeof SchemaDatamodelSchema>;
interface ApiSuccess<T> {
    success: true;
    data: T;
    message?: string;
}
interface ApiError {
    success: false;
    error: string;
}
type ApiResponse<T> = ApiSuccess<T> | ApiError;
interface PaginatedResponse<T> {
    success: true;
    data: T[];
    pagination: PaginationMeta;
}

declare class PrismaFlowError extends Error {
    readonly code: string;
    readonly cause?: unknown | undefined;
    constructor(message: string, code: string, cause?: unknown | undefined);
}
declare class SchemaNotFoundError extends PrismaFlowError {
    constructor(cwd: string);
}
declare class DatabaseConnectionError extends PrismaFlowError {
    constructor(detail?: string);
}
declare class DriftDetectionError extends PrismaFlowError {
    constructor(cause: unknown);
}
declare class MigrationAnalysisError extends PrismaFlowError {
    constructor(cause: unknown);
}
declare class ConfigurationError extends PrismaFlowError {
    constructor(detail: string);
}
declare class UnauthorizedError extends PrismaFlowError {
    constructor();
}
declare class SimulationError extends PrismaFlowError {
    constructor(migrationName: string, cause: unknown);
}
declare class RollbackError extends PrismaFlowError {
    constructor(migrationName: string, detail: string);
}
declare class EnvironmentComparisonError extends PrismaFlowError {
    constructor(source: string, target: string, cause: unknown);
}
declare class GitAwarenessError extends PrismaFlowError {
    constructor(detail: string, cause?: unknown);
}
declare class DriftRepairError extends PrismaFlowError {
    constructor(detail: string, cause?: unknown);
}
declare class UnsupportedPrismaVersionError extends PrismaFlowError {
    constructor(version: string, detail?: string);
}

export { type ApiError, type ApiResponse, type ApiSuccess, type AuditAction, AuditActionSchema, type AuditEntry, AuditEntrySchema, ConfigurationError, DatabaseConnectionError, type DatabaseProvider, DatabaseProviderSchema, type DeploymentPlan, type DeploymentPlanAction, DeploymentPlanActionSchema, type DeploymentPlanCommand, DeploymentPlanCommandSchema, type DeploymentPlanDecision, type DeploymentPlanDriftSummary, DeploymentPlanDriftSummarySchema, type DeploymentPlanMigrationSummary, DeploymentPlanMigrationSummarySchema, type DeploymentPlanPriority, DeploymentPlanPrioritySchema, DeploymentPlanSchema, type DeploymentReadiness, type DeploymentReadinessCheck, type DeploymentReadinessCheckId, DeploymentReadinessCheckIdSchema, DeploymentReadinessCheckSchema, DeploymentReadinessSchema, type DeploymentReadinessStatus, DeploymentReadinessStatusSchema, DriftDetectionError, type DriftDetectionStatus, DriftDetectionStatusSchema, type DriftItem, DriftItemSchema, type DriftRecoverySuggestion, DriftRecoverySuggestionSchema, DriftRepairError, type DriftRepairPlan, DriftRepairPlanSchema, type DriftRepairStrategy, DriftRepairStrategySchema, type DriftResult, DriftResultSchema, type DriftType, DriftTypeSchema, type EnvironmentComparison, type EnvironmentComparisonEntry, EnvironmentComparisonEntrySchema, EnvironmentComparisonError, EnvironmentComparisonSchema, type EnvironmentEntry, EnvironmentEntrySchema, type FeatureFlags, FeatureFlagsSchema, GitAwarenessError, type GitMigrationInfo, GitMigrationInfoSchema, type LogLevel, LogLevelSchema, type Migration, MigrationAnalysisError, type MigrationConflict, MigrationConflictSchema, type MigrationDetail, MigrationDetailSchema, type MigrationHistoryDiff, MigrationHistoryDiffSchema, type MigrationRiskScore, MigrationRiskScoreSchema, MigrationSchema, type MigrationStatus, MigrationStatusSchema, type MigrationVerificationStatus, MigrationVerificationStatusSchema, type PaginatedResponse, type PaginationMeta, PaginationMetaSchema, type PaginationQuery, PaginationQuerySchema, type PrismaFlowConfig, type PrismaFlowConfigParsed, PrismaFlowConfigSchema, PrismaFlowError, type ProjectStatus, ProjectStatusSchema, type RiskFactor, RiskFactorSchema, type RiskLevel, RiskLevelSchema, RollbackError, type RollbackPlan, RollbackPlanSchema, type RollbackStep, RollbackStepSchema, type SSEEvent, SSEEventSchema, type SSEEventType, SSEEventTypeSchema, type SchemaDatamodel, SchemaDatamodelSchema, type SchemaDiff, SchemaDiffSchema, type SchemaDiffType, SchemaDiffTypeSchema, type SchemaEnum, SchemaEnumSchema, type SchemaField, SchemaFieldSchema, type SchemaModel, SchemaModelSchema, SchemaNotFoundError, SimulationError, type SimulationMode, SimulationModeSchema, type SimulationOutcome, SimulationOutcomeSchema, type SimulationResult, SimulationResultSchema, type SimulationStatement, SimulationStatementSchema, type SimulationStatementType, SimulationStatementTypeSchema, type SimulationVerification, SimulationVerificationSchema, UnauthorizedError, UnsupportedPrismaVersionError, type WebhookConfig, WebhookConfigSchema, type WebhookEvent, WebhookEventSchema, type WebhookType, WebhookTypeSchema };
