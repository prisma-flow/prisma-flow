# PrismaFlow

**Visual Prisma Operations** — an open-source, local-first CLI and dashboard for Prisma migration visibility, schema drift, heuristic migration risk, and deployment review.

PrismaFlow turns Prisma migration state into a review workflow: what changed, what looks risky, whether drift was detected, and what should be checked before deployment.

> [!IMPORTANT]
> PrismaFlow is **pre-1.0 software**. Risk and readiness output should be treated as advisory. Do not rely on PrismaFlow as the sole control protecting a production database.

## Hardening Invariants & Trust Model

PrismaFlow enforces strict safety invariants for local-first database operations:

- **Fail-Closed Verification (`UNKNOWN != SAFE`)**: Any inability to reach the database, validate the Prisma schema, or verify migration history marks migration verification as `unknown` or `error` and blocks deployment (`deploymentReadiness: 'blocked'`).
- **Plan-Only Drift Recovery**: PrismaFlow V1 is strictly plan-only. Automatic database or history mutation is disabled to prevent accidental data loss. `prisma migrate resolve --applied` is explicitly described as reconciling history records without running SQL.
- **Simulation Trust Model**: Static SQL analysis is explicitly distinguished from executed shadow database verification. Static analysis never claims "pass" or "would succeed" (`outcome: 'unknown'`).
- **Loopback-Only Security**: The local dashboard and API explicitly bind to `127.0.0.1` by default and require a per-session authentication token with localhost-only CORS.
- **Unified Domain Contracts**: All domain models and API boundaries are validated using canonical Zod schemas exported from `@prisma-flow/shared`.
- **Prisma Version Adapters**: Capability-based adapters support Prisma 5/6 (Legacy), Prisma 7, and Prisma 8 without hardcoded or scattered version assumptions.

## V1 Scope

PrismaFlow V1 is local-first and open source. It does not require an account, cloud sync, billing, AI, team workspace, or hosted service.

Included in V1:

- Project detection for `schema.prisma`, migrations, provider, Prisma version, package manager, and `DATABASE_URL` state.
- Migration timeline for applied, pending, failed, and unverified migrations.
- Drift inspection with SQL evidence and plan-only recovery guidance.
- Heuristic risk analysis for destructive SQL, dropped tables/columns, type changes, constraints, nullable changes, and index changes.
- Migration SQL simulation and destructive-statement analysis; execution verification is provider-dependent (shadow database execution on SQLite; static analysis on other providers).
- Schema explorer for models, fields, relations, enums, indexes, and constraints.
- Health and deployment-review summaries with fail-closed blocker evaluation.
- Actionable deployment plans with blockers, next commands, and review guidance.
- Local JSON/Markdown reports for reviews and CI artifacts.
- CI-friendly checks with structured exit codes.
- Token-protected local dashboard API bound to loopback `127.0.0.1`.

## Requirements

- Node.js 20 or newer.
- npm 10 or newer.
- A Prisma project with `prisma/schema.prisma` or another supported Prisma schema layout.
- `DATABASE_URL` for checks that require a live database connection.

## Compatibility Matrix

PrismaFlow pre-1.0 uses capability-based adapters to interact with different Prisma CLI generations. Support levels distinguish between implemented adapter support, unit-tested compatibility, and real CI-tested integration.

### Prisma Versions

| Prisma Version | Generation / Adapter | Migration Status & Drift | Shadow Simulation | Schema Explorer | Support Level |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Prisma 5.x** | Legacy (`PrismaLegacyAdapter`) | Supported (CLI `migrate status` & diff) | SQLite shadow DB / Static analysis | Supported (`@prisma/internals` 5.22) | **Supported** (Fixture integration verified) |
| **Prisma 6.x** | Legacy (`PrismaLegacyAdapter`) | Supported (CLI `migrate status` & diff) | SQLite shadow DB / Static analysis | Supported | **Supported** (Unit & contract verified) |
| **Prisma 7.x** | Prisma 7 (`Prisma7Adapter`) | Supported (`--from-schema` / `--to-config-datasource`) | SQLite shadow DB / Static analysis | Limited / Experimental (Internals decoupling ongoing) | **Supported** (Adapter & CLI paths verified) |
| **Prisma 8.x** (prerelease / RC) | Prisma 8 (`Prisma8Adapter`) | Unsupported for deployment | Unsupported | Unsupported | **Experimental** (Detection only; fails closed) |
| **Prisma ≤4 / ≥9 / Unknown** | Unsupported (`UnsupportedPrismaAdapter`) | Unsupported (fails closed) | Unsupported | Unsupported | **Unsupported** (Blocks deployment readiness) |

### Database Providers

| Database Provider | Migration & Drift Visibility | Heuristic Risk Analysis | Simulation Mode | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **SQLite** | Supported | Supported | Full shadow DB execution (when `sqlite3` available) + static analysis | **Integration verified in CI** (Real fixture & package smoke test) |
| **PostgreSQL** | Supported (SQL diff parser implemented) | Supported | Heuristic static statement analysis only | **Partially verified** (Unit-tested parser & status maps) |
| **MySQL** | Supported (SQL diff parser implemented) | Supported | Heuristic static statement analysis only | **Partially verified** (Unit-tested parser & status maps) |

## Quick start

```bash
cd your-prisma-project
npx prisma-flow
```

The default command detects the Prisma project, starts the local API server, and opens the bundled dashboard at `http://127.0.0.1:5555?token=<session-token>`.

## Installation

```bash
# One-off usage
npx prisma-flow

# Project dependency
npm install --save-dev prisma-flow

# Global install
npm install -g prisma-flow
```

The package exposes both command names:

```bash
prisma-flow status
pf status
```

## CLI commands

| Command | Purpose | Useful options |
| --- | --- | --- |
| `prisma-flow` / `prisma-flow dashboard` | Start the local API and bundled dashboard on loopback. | `--port <port>`, `--no-open` |
| `prisma-flow status` | Print database, verification, migration, drift, risk, health, and readiness state. | `--json`, `--quiet` |
| `prisma-flow check` | CI-friendly migration review gate (fails closed on unverified state). | `--ci`, `--json`, `--fail-on-risk <level>`, `--quiet` |
| `prisma-flow plan` | Generate a deploy-review plan with blockers and next commands. | `--format human\|json\|markdown`, `--json`, `--ci` |
| `prisma-flow report` | Generate a local review or CI report. | `--format json\|markdown`, `--json`, `--output <path>` |
| `prisma-flow doctor` | Validate Node, Prisma CLI, schema, config, git, and database reachability. | `--json` |
| `prisma-flow init` | Create `prismaflow.config.ts`. | `--force` |
| `prisma-flow inspect <migration>` | Inspect SQL, risk factors, analysis, and optional rollback guidance. | `--json`, `--sql`, `--rollback` |
| `prisma-flow simulate <migration>` | Preview SQL and flag destructive statements; distinguishes executed vs static analysis. | `--json`, `--fail-on-destructive` |
| `prisma-flow diff` | Compare Prisma schema against a live database. | `--from <url>`, `--json`, `--breaking-only` |
| `prisma-flow rollback <migration>` | Generate best-effort rollback guidance / SQL for review. | `--json`, `--print-sql`, `--include-manual` |
| `prisma-flow repair` | Detect drift and generate plan-only recovery guidance. | `--json` |
| `prisma-flow compare` | Compare migration state across configured environments. | `--envs dev,staging,prod`, `--json` |
| `prisma-flow history` | Show migration history with risk and optional git metadata. | `--limit <n>`, `--json`, `--git` |

## Dashboard

The dashboard is built as a static Next.js application, bundled into the CLI package, and served by the local PrismaFlow API process on `127.0.0.1`.

- **Overview**: health/readiness summary, detected project, next actions, and migration summary.
- **Migrations**: applied, pending, failed, and unverified migration timeline.
- **Drift**: detected schema/database differences and plan-only recovery guidance.
- **Risks**: heuristic migration risk scores and destructive-change factors.
- **Simulate**: migration analysis output, execution verification badges, and destructive SQL warnings.
- **Schema**: parsed Prisma models, fields, relations, enums, indexes, and constraints.

The dashboard reads the session token from `?token=...` and preserves it while navigating.

## Reports and CI

Generate local artifacts:

```bash
prisma-flow plan --format markdown --output prismaflow-plan.md
prisma-flow report --format json --output prismaflow-report.json
prisma-flow report --format markdown --output prismaflow-report.md
```

Use PrismaFlow as a CI review signal:

```bash
npx prisma-flow plan --ci --json
npx prisma-flow check --ci --json --fail-on-risk high
```

Exit codes:

| Code | Meaning |
| --- | --- |
| `0` | All checks verified and ready |
| `1` | Pending migrations |
| `2` | Schema drift detected |
| `3` | Failed migrations |
| `4` | Runtime error, unreachable database, or unverified migration state |
| `5` | Risk threshold exceeded with `--fail-on-risk` |

GitHub Actions example:

```yaml
- name: PrismaFlow migration check
  run: npx prisma-flow check --ci --json --fail-on-risk high
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Configuration

Create a config file:

```bash
prisma-flow init
```

`prismaflow.config.ts` supports local settings for the dashboard, logging, risk thresholds, environments, feature flags, audit-log rotation, and optional webhook definitions.

Environment overrides include:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DATABASE
PRISMAFLOW_HOST=127.0.0.1
PRISMAFLOW_PORT=5555
PRISMAFLOW_LOG_LEVEL=info
PRISMAFLOW_NO_OPEN=1
PRISMAFLOW_RISK_THRESHOLD=medium
PRISMAFLOW_TELEMETRY=on
```

Telemetry is disabled by default. When explicitly enabled, it sends command/event metadata, a migration-count bucket, Node major version, and OS platform. It does not send project paths, schema content, SQL, database URLs, or user data.

## Local API & Security Model

- PrismaFlow is designed for local developer and CI use.
- Server binds to loopback (`127.0.0.1`) by default.
- Each server start generates a random session token.
- API routes require the token; static dashboard assets and `/health` do not.
- CORS is restricted to localhost/loopback origins.
- Request logs sanitize URL query parameters and never log tokens.
- Child processes use argument arrays rather than shell interpolation.
- Local audit entries are written to `.prismaflow/audit.jsonl` and should not be committed.
- `.env`, credentials, database URLs, private keys, build output, and generated PrismaFlow state are ignored.

## Development

```bash
npm install
npm run build
npm test
npm run typecheck
npm run lint
npm run format:check
npm run security:audit
npm run verify:release
```

Focused commands:

```bash
npm run dev --workspace=apps/website
npm run dev --workspace=apps/dashboard
npm run dev --workspace=packages/cli
npm test --workspace=packages/cli
npm test --workspace=apps/dashboard
```

## Repository Structure

```text
prisma-flow/
  apps/
    dashboard/    # private Next.js static dashboard bundled into the CLI
    website/      # private Next.js documentation and marketing site (Vercel)
  packages/
    cli/          # the ONLY public npm package (prisma-flow): CLI, Hono API, adapters
    shared/       # private/internal Zod schemas, types, and structured errors
  docs/           # architecture, roadmap, product, and documentation notes
  test-project/   # sample Prisma project
  .github/        # CI, release, security, issue forms, and PR templates
```

## Open Source

The V1 local product is free and open-source with no artificial limits on projects, databases, or local usage.

- [Contributing](./CONTRIBUTING.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Roadmap](./docs/ROADMAP.md)
- [Security](./SECURITY.md)
- [Support](./SUPPORT.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

## License

[MIT](./LICENSE)
