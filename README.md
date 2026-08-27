# PrismaFlow

**Visual Prisma Operations** — an open-source, local-first CLI and dashboard for Prisma migration visibility, schema drift, heuristic migration risk, and deployment review.

PrismaFlow turns Prisma migration state into a review workflow: what changed, what looks risky, whether drift was detected, and what should be checked before deployment.

> [!IMPORTANT]
> PrismaFlow is **pre-1.0 software**. Risk and readiness output should be treated as advisory while the current hardening issues are completed. Do not rely on PrismaFlow as the sole control protecting a production database.

## Current stability and known limitations

The project is actively hardening four correctness areas before broader production-oriented promotion:

- [#33 — Fail closed when migration or drift verification is unknown](https://github.com/prisma-flow/prisma-flow/issues/33)
- [#34 — Remove unsafe auto-repair semantics from V1](https://github.com/prisma-flow/prisma-flow/issues/34)
- [#35 — Distinguish executed verification from static simulation analysis](https://github.com/prisma-flow/prisma-flow/issues/35)
- [#36 — Unify shared runtime schemas and TypeScript contracts](https://github.com/prisma-flow/prisma-flow/issues/36)

Until those are resolved:

- Treat deployment readiness as guidance, not an authoritative production guarantee.
- Treat migration risk scores as heuristics.
- Do not use mutating repair / `repair --apply` against important databases.
- Static migration analysis is not equivalent to executing a migration against a shadow database.

## V1 scope

PrismaFlow V1 is local-first and open source. It does not require an account, cloud sync, billing, AI, team workspace, or hosted service.

Included in V1:

- Project detection for `schema.prisma`, migrations, provider, Prisma version, package manager, and `DATABASE_URL` state.
- Migration timeline for applied, pending, and failed migrations.
- Drift inspection with SQL evidence and recovery guidance.
- Heuristic risk analysis for destructive SQL, dropped tables/columns, type changes, constraints, nullable changes, and index changes.
- Migration SQL inspection and destructive-statement analysis; execution verification is provider-dependent.
- Schema explorer for models, fields, relations, enums, indexes, and constraints.
- Health and deployment-review summaries.
- Actionable deployment plans with blockers, next commands, and review guidance.
- Local JSON/Markdown reports for reviews and CI artifacts.
- CI-friendly checks with structured exit codes.
- Token-protected local dashboard API.

## Requirements

- Node.js 20 or newer.
- npm 10 or newer.
- A Prisma project with `prisma/schema.prisma` or another supported Prisma schema layout.
- `DATABASE_URL` for checks that require a live database connection.

## Quick start

```bash
cd your-prisma-project
npx prisma-flow
```

The default command detects the Prisma project, starts the local API server, and opens the bundled dashboard at `http://localhost:5555?token=<session-token>`.

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
| `prisma-flow` / `prisma-flow dashboard` | Start the local API and bundled dashboard. | `--port <port>`, `--no-open` |
| `prisma-flow status` | Print database, migration, drift, risk, health, and readiness state. | `--json`, `--quiet` |
| `prisma-flow check` | CI-friendly migration review gate. | `--ci`, `--json`, `--fail-on-risk <level>`, `--quiet` |
| `prisma-flow plan` | Generate a deploy-review plan with blockers and next commands. | `--format human\|json\|markdown`, `--json`, `--ci` |
| `prisma-flow report` | Generate a local review or CI report. | `--format json\|markdown`, `--json`, `--output <path>` |
| `prisma-flow doctor` | Validate Node, Prisma CLI, schema, config, git, and database reachability. | `--json` |
| `prisma-flow init` | Create `prismaflow.config.ts`. | `--force` |
| `prisma-flow inspect <migration>` | Inspect SQL, risk factors, analysis, and optional rollback guidance. | `--json`, `--sql`, `--rollback` |
| `prisma-flow simulate <migration>` | Analyze a migration and flag destructive statements; execution verification is provider-dependent. | `--json`, `--fail-on-destructive` |
| `prisma-flow diff` | Compare Prisma schema against a live database. | `--from <url>`, `--json`, `--breaking-only` |
| `prisma-flow rollback <migration>` | Generate best-effort rollback guidance / SQL for review. | `--json`, `--print-sql`, `--include-manual` |
| `prisma-flow repair` | Detect drift and generate recovery guidance. | `--json` |
| `prisma-flow compare` | Compare migration state across configured environments. | `--envs dev,staging,prod`, `--json` |
| `prisma-flow history` | Show migration history with risk and optional git metadata. | `--limit <n>`, `--json`, `--git` |

> [!WARNING]
> A mutating `repair --apply` path currently exists but should not be used against important databases until [#34](https://github.com/prisma-flow/prisma-flow/issues/34) is resolved.

## Dashboard

The dashboard is built as a static Next.js application, bundled into the CLI package, and served by the local PrismaFlow API process.

- **Overview**: health/readiness summary, detected project, next actions, and migration summary.
- **Migrations**: applied, pending, and failed migration timeline.
- **Drift**: detected schema/database differences and recovery guidance.
- **Risks**: heuristic migration risk scores and destructive-change factors.
- **Simulate**: migration analysis output and destructive SQL warnings.
- **Schema**: parsed Prisma models, fields, relations, enums, indexes, and constraints.

The dashboard reads the session token from `?token=...` and preserves it while navigating.

## Reports and CI

Generate local artifacts:

```bash
prisma-flow plan --format markdown --output prismaflow-plan.md
prisma-flow report --format json --output prismaflow-report.json
prisma-flow report --format markdown --output prismaflow-report.md
```

Use PrismaFlow as an additional CI review signal:

```bash
npx prisma-flow plan --ci --json
npx prisma-flow check --ci --json --fail-on-risk high
```

Current exit codes:

| Code | Meaning |
| --- | --- |
| `0` | Ready under the current readiness model |
| `1` | Pending migrations |
| `2` | Schema drift detected |
| `3` | Failed migrations |
| `4` | Runtime or configuration error |
| `5` | Risk threshold exceeded with `--fail-on-risk` |

Until [#33](https://github.com/prisma-flow/prisma-flow/issues/33) is resolved, do not treat a green PrismaFlow CI result as proof that every migration/drift verification path succeeded.

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
PRISMAFLOW_PORT=5555
PRISMAFLOW_LOG_LEVEL=info
PRISMAFLOW_NO_OPEN=1
PRISMAFLOW_RISK_THRESHOLD=medium
PRISMAFLOW_TELEMETRY=on
```

Telemetry is disabled by default. When explicitly enabled, it sends command/event metadata, a migration-count bucket, Node major version, and OS platform. It does not send project paths, schema content, SQL, database URLs, or user data.

## Local API

The dashboard uses a local REST/SSE API. `/api/*` endpoints require the generated token via `Authorization: Bearer <token>` or `?token=<token>`.

Key endpoints include project status, deployment plans, migrations, drift, risks, schema, migration analysis, rollback guidance, repair guidance, diff, environment comparison, git metadata, audit entries, config, and server-sent events.

The mutating repair endpoint is considered experimental and should not be used against important databases until [#34](https://github.com/prisma-flow/prisma-flow/issues/34) is resolved.

## Security model

- PrismaFlow is designed for local developer/CI use.
- Each server start generates a 192-bit random session token.
- API routes require the token; static dashboard assets and `/health` do not.
- CORS is restricted to localhost origins.
- Request logs avoid full tokenized URLs.
- Child processes use argument arrays rather than shell interpolation.
- Local audit entries are written to `.prismaflow/audit.jsonl` and should not be committed.
- `.env`, credentials, database URLs, private keys, build output, and generated PrismaFlow state are ignored.

Explicit loopback binding is part of the security hardening backlog; do not intentionally expose the dashboard server to an untrusted network.

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
npm run dev --workspace=packages/website
npm run dev --workspace=packages/dashboard
npm run dev --workspace=packages/cli
npm test --workspace=packages/cli
npm test --workspace=packages/dashboard
```

## Repository structure

```text
prisma-flow/
  packages/
    cli/          # prisma-flow npm package, Commander CLI, Hono API
    dashboard/    # Next.js static dashboard bundled into the CLI
    shared/       # shared TypeScript types, Zod schemas, and errors
    website/      # public documentation and marketing website
  docs/           # architecture, roadmap, product, and documentation notes
  test-project/   # sample Prisma project
  .github/        # CI, release, security, issue forms, and PR templates
```

## Open source

The V1 local product remains free with no artificial limits on projects, databases, or local usage.

- [Contributing](./CONTRIBUTING.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Roadmap](./docs/ROADMAP.md)
- [Security](./SECURITY.md)
- [Support](./SUPPORT.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

## License

[MIT](./LICENSE)
