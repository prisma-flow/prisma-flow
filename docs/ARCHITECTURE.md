# PrismaFlow Architecture

PrismaFlow V1 is a local-first DevTool. The CLI runs in the user's Prisma project, starts a local API server bound to `127.0.0.1`, and serves the dashboard with an ephemeral session token.

## Runtime Flow

```text
Prisma project
  -> prisma-flow CLI (Commander)
  -> project detection (prisma-detector)
  -> Prisma version adapter selection (legacy, prisma7, prisma8)
  -> fail-closed status and drift verification
  -> centralized readiness evaluation
  -> Hono API server on 127.0.0.1 loopback
  -> Next.js dashboard served from CLI public assets
```

## Packages

- `packages/cli`: Commander commands, Hono API server, Prisma capability adapters, simulator, and migration analysis engines.
- `packages/dashboard`: Next.js static dashboard export for timeline, drift, risk, simulation, schema, health, and readiness.
- `packages/shared`: Canonical Zod runtime schemas, derived TypeScript types, and structured errors exported as `@prisma-flow/shared`.
- `packages/website`: public documentation website.

## Core Architectural Invariants

1. **Fail-Closed Verification (`UNKNOWN != SAFE`)**:
   - The central readiness evaluator in `core/readiness.ts` treats unverified or unknown CLI output as non-safe (`deploymentReadiness: 'blocked'`).
   - Unclassified Prisma CLI exit codes never default to connected or applied.
2. **Plan-Only Drift Recovery**:
   - `core/drift-recovery.ts` and `prisma-flow repair` are strictly plan-only. Mutating execution is disabled in V1.
   - `prisma migrate resolve --applied` is explicitly modeled as reconciling migration history without executing SQL statements.
3. **Simulation Trust Semantics**:
   - `core/simulator.ts` explicitly separates `verification: 'executed' | 'static-analysis' | 'not-verified'` and `outcome: 'success' | 'failure' | 'unknown'`.
   - Heuristic static analysis never reports outcome as `success`.
4. **Prisma Version Adapter Layer**:
   - `core/adapters/`: `PrismaAdapter` interface with `PrismaCapabilities`.
   - `PrismaLegacyAdapter`: Prisma 5 and 6 compatibility.
   - `Prisma7Adapter`: Prisma 7 migration diff flag conventions.
   - `Prisma8Adapter`: Prisma 8 experimental detection (fails closed for deployment).
   - `UnsupportedPrismaAdapter`: Fails closed on Prisma ≤4, ≥9, or unparseable versions.
5. **Loopback-Only Security**:
   - Server explicitly binds to `127.0.0.1` by default.
   - API endpoints require an ephemeral 192-bit session token.
   - CORS is restricted to localhost/loopback origins.
   - Query parameter tokens are sanitized from request logs.
