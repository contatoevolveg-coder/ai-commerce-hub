FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 1. Prune the workspace for the worker
FROM base AS builder
# Set working directory
WORKDIR /app
RUN pnpm add -g turbo
COPY . .
RUN turbo prune @ai-commerce/worker --docker

# 2. Installer
FROM base AS installer
WORKDIR /app
# First install dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN pnpm install

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .
# In turborepo, building the worker app might require building packages first
RUN pnpm turbo run build --filter=@ai-commerce/worker...

# 3. Runner
FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker_user
USER worker_user

COPY --from=installer /app .

# Start the worker (assuming src/index.ts is the entrypoint compiled or run with tsx)
CMD ["pnpm", "turbo", "run", "start", "--filter=@ai-commerce/worker"]
