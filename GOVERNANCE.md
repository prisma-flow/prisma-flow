# PrismaFlow Governance

PrismaFlow is an open-source project currently in its pre-1.0, single-maintainer phase. Governance is intentionally lightweight so the project can accept outside contributions without creating process that the current community does not need yet.

## Project stewardship

The current project maintainer is `@GitHackerz`.

Maintainers are responsible for:

- protecting the project's local-first open-source scope;
- reviewing and merging pull requests;
- triaging correctness, security, compatibility, and release issues;
- maintaining release quality and supported-version documentation;
- making final decisions when a discussion does not reach clear consensus.

## How decisions are made

Routine fixes, documentation improvements, tests, and small implementation changes are decided through normal pull-request review.

Changes that materially affect public APIs, migration semantics, safety behavior, compatibility guarantees, package structure, or V1 scope should first have a GitHub issue or discussion describing the problem and proposed direction.

The maintainer should prefer decisions that are:

1. safe for users and databases;
2. explicit about uncertainty and unsupported states;
3. compatible with Prisma rather than duplicating Prisma's migration engine;
4. maintainable by the actual contributor base;
5. consistent with the documented local-first OSS scope.

## Contributions

Contributions are welcome from anyone. See [CONTRIBUTING.md](./CONTRIBUTING.md) for development and pull-request requirements.

Contributors do not need prior approval to work on a clearly scoped bug or documentation issue. For large architectural work, open an issue first so effort is not wasted on a direction the project cannot maintain.

## Maintainer growth

Additional maintainers may be invited after sustained, high-quality contributions that demonstrate:

- sound technical judgment;
- respectful review and collaboration;
- understanding of PrismaFlow's safety model and scope;
- reliable follow-through on issues and pull requests;
- willingness to help maintain releases and contributor quality.

Maintainer access is based on demonstrated project stewardship, not a fixed contribution count.

## Security

Security vulnerabilities must follow [SECURITY.md](./SECURITY.md) and should not be disclosed in public issues before a safe remediation path exists.

## Governance changes

This document can evolve as the contributor community grows. More formal voting, working groups, or maintainer teams should only be introduced when the project actually needs them.
