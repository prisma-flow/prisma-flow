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

## Repository & Deployment Boundaries

Repository boundaries do not equal deployment boundaries:

- `packages/cli`: The **ONLY** public npm package (`prisma-flow`). Contains Commander commands, Hono API server, Prisma capability adapters, simulator, and migration analysis engines. Bundles `@prisma-flow/shared` internally and static assets from `apps/dashboard`.
- `packages/shared`: Private/internal workspace package containing canonical Zod runtime schemas, derived TypeScript types, and structured errors. Never published to npm; bundled directly into `prisma-flow`.
- `apps/dashboard`: Private Next.js static application for timeline, drift, risk, simulation, schema, health, and readiness. Exported statically during build and embedded into `packages/cli/public`.
- `apps/website`: Private Next.js documentation and marketing website, deployed independently to Vercel.

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

## Release & Publishing Architecture

PrismaFlow enforces a convergent, single public artifact release boundary:

1. **Single Public Release Scope**:
   - Commits affecting `packages/cli/**`, `packages/shared/**` (bundled code), or `apps/dashboard/**` (bundled assets) trigger version bumps for the public `prisma-flow` npm package.
   - Commits touching strictly `apps/website/**`, `docs/**`, or `.github/**` are excluded from triggering CLI package releases.
2. **Pre-1.0 Versioning Policy (`0.x.y`)**:
   - `bump-minor-pre-major: true` ensures breaking changes and new features increment minor version (`0.2.0` → `0.3.0`), while bug fixes increment patch version (`0.2.0` → `0.2.1`). Releases do not bump to `1.0.0` until intentional graduation.
3. **Convergent Publication & Recovery Ordering**:
   - **Immutable Target**: Automated PR merge triggers resolve `pull_request.merge_commit_sha`. Manual triggers pin the exact commit SHA.
   - **Tag-First Invariant**: The canonical git tag `v<version>` is verified or created **before** npm publication begins.
   - **Idempotent Retry**: In retry mode, existing npm packages or existing GitHub Releases are detected and skipped rather than failing, allowing reconciliation of partial release states (States A–D).
   - **Authoritative Notes**: GitHub Releases are the canonical source for release notes. Root CHANGELOG is not maintained as a separate source of truth.
