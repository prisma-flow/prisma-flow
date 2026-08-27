# Contributing to PrismaFlow

Thank you for contributing to PrismaFlow. The project is pre-1.0 and currently maintainer-led, so focused changes with clear tests and rationale are preferred over broad rewrites.

## Before opening an issue or pull request

Use the right collaboration channel:

- **Questions, setup help, and troubleshooting:** use [GitHub Discussions — Q&A](https://github.com/prisma-flow/prisma-flow/discussions/categories/q-a).
- **Early ideas, design proposals, and project direction:** use [GitHub Discussions — Ideas](https://github.com/prisma-flow/prisma-flow/discussions/categories/ideas).
- **Reproducible bugs and concrete implementation work:** use [GitHub Issues](https://github.com/prisma-flow/prisma-flow/issues).
- **Security vulnerabilities:** use [GitHub private vulnerability reporting](https://github.com/prisma-flow/prisma-flow/security/advisories/new), never a public issue or discussion.

Search existing issues and discussions before creating a new thread. Redact database URLs, credentials, private schema details, and migration SQL from public reports.

## Code of Conduct

Be respectful and constructive. See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Development setup

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- A Prisma project or fixture for the area you are testing
- PostgreSQL, SQLite, or Docker when a change requires database integration coverage

### Setup

```bash
git clone https://github.com/prisma-flow/prisma-flow.git
cd prisma-flow
npm install
```

For checks that need a live database, copy the example environment file and use test-only credentials:

```bash
cp .env.example .env
```

Never commit real database credentials or private migration data.

## Development workflow

```text
main          <- protected default branch and release source
feature/xxx   <- feature branches created from main
fix/xxx       <- bug-fix branches created from main
chore/xxx     <- maintenance/documentation/tooling branches
```

1. Fork the repository or create a branch from the latest `main` if you have write access.
2. Keep the change focused on one concern.
3. Add or update tests for behavior changes.
4. Update documentation when public behavior, configuration, commands, or compatibility changes.
5. Run the relevant local verification commands.
6. Open a pull request targeting `main`.
7. Resolve review conversations and keep the branch current if GitHub reports it as behind.

Direct pushes to `main` are not part of the normal workflow. The repository ruleset requires pull requests and passing CI checks.

## Commit and pull request convention

Use [Conventional Commits](https://www.conventionalcommits.org/) for commits and pull request titles:

```text
type(scope): short description
```

Common types:

| Type | Use for |
| --- | --- |
| `feat` | New functionality |
| `fix` | Bug fixes |
| `docs` | Documentation-only changes |
| `refactor` | Internal restructuring without intended behavior changes |
| `test` | Test additions or corrections |
| `chore` | Tooling, dependencies, repository maintenance |
| `perf` | Performance improvements |

A good pull request explains **why** the change is needed, what changed, how it was verified, and any compatibility or migration impact.

PRs are squash-merged into `main` after required checks pass.

## Required verification

Run the checks relevant to your change. Before requesting review for a normal code change, the expected baseline is:

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run security:audit
npm run build
```

For release-sensitive changes, also run:

```bash
npm run verify:release
```

The protected `main` branch currently requires the repository CI matrix, unit/integration tests, and CodeQL analysis to pass before merge.

## Testing expectations

CLI tests live with the CLI package and dashboard tests live with the dashboard package.

Useful focused commands include:

```bash
npm test --workspace=packages/cli
npm test --workspace=apps/dashboard
```

When changing migration state, drift detection, readiness, simulation, repair, schema parsing, or Prisma compatibility, include regression tests for failure and unknown states—not only the success path.

Changes that claim support for a Prisma version or database provider should include integration evidence appropriate to that claim.

## Project structure

```text
prisma-flow/
├── apps/
│   ├── dashboard/     # private Next.js static dashboard bundled into the CLI
│   └── website/       # private Next.js documentation and marketing site (Vercel)
├── packages/
│   ├── cli/           # the ONLY public npm package (prisma-flow): CLI, Hono API, adapters
│   └── shared/        # private/internal Zod schemas, derived types, structured errors
├── docs/              # architecture, roadmap, product notes
├── test-project/      # local Prisma fixture
└── .github/           # CI, release, security, issue and PR configuration
```

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) and [docs/ROADMAP.md](./docs/ROADMAP.md) before proposing large architectural changes.

## Scope and design principles

For the current V1, PrismaFlow is a local-first open-source developer tool. Avoid introducing cloud accounts, billing, multi-tenancy, enterprise controls, or speculative commercial architecture unless the roadmap explicitly changes.

PrismaFlow should complement Prisma rather than reimplement Prisma's migration engine. Version-specific behavior should move toward explicit capability/adaptor boundaries instead of scattered version checks.

Safety-related output must distinguish verified results from heuristics or unknown states. If verification fails, do not turn that failure into a green result.

## Releases

Releases are automated with Release Please. Conventional Commits merged into `main` feed the release PR. The release workflow performs the production gate, publishes package versions that do not already exist, and creates the corresponding GitHub release/tag.

Do not manually change package versions as part of an ordinary feature or fix PR unless the release process specifically requires it.

Before merging a release PR:

```bash
npm run verify:release
```

Published artifacts should be smoke-tested from a clean project after release.

## Governance

See [GOVERNANCE.md](./GOVERNANCE.md) for the current maintainer model and how project decisions are made.

## Questions

Use [GitHub Discussions](https://github.com/prisma-flow/prisma-flow/discussions) for questions, ideas, and design conversation. Use Issues when the work is concrete and actionable.
