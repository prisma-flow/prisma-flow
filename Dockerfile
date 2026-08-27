# ─── Stage 1 — Build shared package ─────────────────────────────────────────
FROM node:20-alpine AS shared-builder

WORKDIR /build

# Install dependencies
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY turbo.json ./

RUN npm ci --workspace=packages/shared --ignore-scripts

# Build shared
COPY packages/shared ./packages/shared
COPY tsconfig.base.json ./
RUN npm run build --workspace=packages/shared


# ─── Stage 2 — Build Next.js dashboard ───────────────────────────────────────
FROM node:20-alpine AS dashboard-builder

WORKDIR /build

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/dashboard/package*.json ./apps/dashboard/
COPY turbo.json ./

RUN npm ci --workspace=apps/dashboard --ignore-scripts

# Copy shared dist from stage 1
COPY --from=shared-builder /build/packages/shared/dist ./packages/shared/dist
COPY --from=shared-builder /build/packages/shared/package.json ./packages/shared/

# Copy and build dashboard
COPY apps/dashboard ./apps/dashboard
COPY tsconfig.base.json ./
RUN npm run build --workspace=apps/dashboard


# ─── Stage 3 — Build CLI ─────────────────────────────────────────────────────
FROM node:20-alpine AS cli-builder

WORKDIR /build

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/cli/package*.json ./packages/cli/
COPY turbo.json ./

RUN npm ci --workspace=packages/cli --ignore-scripts

# Copy shared dist
COPY --from=shared-builder /build/packages/shared/dist ./packages/shared/dist
COPY --from=shared-builder /build/packages/shared/package.json ./packages/shared/

# Copy dashboard out/ so the copy-dashboard script has it
COPY --from=dashboard-builder /build/apps/dashboard/out ./apps/dashboard/out

# Copy CLI source and build
COPY packages/cli ./packages/cli
COPY tsconfig.base.json ./
# Run the full build (copy-dashboard.mjs → tsup)
RUN npm run build --workspace=packages/cli
# Pack workspace tarball for clean runtime installation
RUN npm pack --workspace=packages/cli


# ─── Stage 4 — Minimal production runtime ────────────────────────────────────
FROM node:20-alpine AS runtime

LABEL org.opencontainers.image.title="prisma-flow" \
      org.opencontainers.image.description="Visual Prisma migration management" \
      org.opencontainers.image.source="https://github.com/prisma-flow/prisma-flow"

# Non-root user for security
RUN addgroup -S prismaflow && adduser -S prismaflow -G prismaflow

WORKDIR /app

ENV NODE_ENV=production \
    PRISMAFLOW_PORT=5555 \
    PRISMAFLOW_NO_OPEN=1

# Copy packed tarballs from builder
COPY --from=cli-builder /build/*.tgz /app/

# Install the packed prisma-flow package globally
RUN npm install -g /app/*.tgz && \
    rm -rf /app/*.tgz && \
    npm cache clean --force

USER prismaflow

EXPOSE ${PRISMAFLOW_PORT}

# The CLI runs against the project mounted at /project
VOLUME ["/project"]
WORKDIR /project

ENTRYPOINT ["prisma-flow"]
CMD ["dashboard", "--no-open"]
