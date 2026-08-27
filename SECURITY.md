# Security Policy

PrismaFlow is a local-first observability and review layer for Prisma projects. Treat database URLs, migration SQL, and schema metadata as sensitive.

## Supported Versions

Security fixes target the latest released version and the current `main` branch.

## Reporting a Vulnerability

Please do not open public issues for suspected vulnerabilities. Use GitHub private vulnerability reporting:

https://github.com/prisma-flow/prisma-flow/security/advisories/new

If private vulnerability reporting is not enabled yet, contact a maintainer privately and share only redacted details until a private channel is available.

Include:

- Affected version or commit
- Reproduction steps
- Impact summary
- Relevant logs with secrets redacted

## V1 Security & Hardening Model

1. **Loopback-Only Binding**:
   - The dashboard and API server explicitly bind to `127.0.0.1` by default (`PRISMAFLOW_HOST=127.0.0.1`).
   - CORS is restricted to loopback and localhost origins (`127.0.0.1`, `localhost`, `[::1]`).
2. **Ephemeral Session Authentication**:
   - Every `/api/*` endpoint requires an ephemeral per-session bearer token generated on server startup.
   - Request logs sanitize URL query parameters to avoid leaking tokens.
3. **Fail-Closed Principle (`UNKNOWN != SAFE`)**:
   - Unverified migration or drift states fail closed (`deploymentReadiness: 'blocked'`).
   - Unclassified Prisma CLI errors or datasource connection failures are never reported as clean or safe.
4. **Plan-Only Drift Recovery**:
   - PrismaFlow V1 is strictly plan-only. It never automatically mutates database schemas or migration histories.
5. **Simulation Trust Model**:
   - Static SQL analysis is never presented as executed verification. Executed verification is explicitly distinguished from heuristic analysis.
6. **Execution Safety**:
   - Child processes use structured `execFile` with explicit argument arrays to prevent shell injection.
   - Sensitive connection strings, passwords, and tokens are redacted from all telemetry and logs.

## User Responsibilities

- Do not commit `.env` files or database credentials.
- Use least-privilege database credentials for CI checks where possible.
- Review drift and risk reports before deploying migrations to production.
