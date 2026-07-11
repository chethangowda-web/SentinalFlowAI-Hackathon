# =============================================================================
# SentinelFlow Backend - Production Dockerfile (Multi-stage)
# =============================================================================
# Builds the Mastra AI backend into a minimal production container.
# =============================================================================

# ---- Stage 1: Install dependencies ----
FROM node:22-alpine AS deps

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY backend/package.json backend/pnpm-lock.yaml* ./

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile --prod || pnpm install --prod

# ---- Stage 2: Build (if source available) ----
FROM node:22-alpine AS build

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ .

# If Mastra CLI is installed, rebuild; otherwise use pre-built output
RUN if [ -f "node_modules/.bin/mastra" ]; then \
      npx mastra build; \
    else \
      echo "Using pre-built Mastra output"; \
    fi

# ---- Stage 3: Production runtime ----
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV WS_PORT=3001

RUN apk add --no-cache tini

# Copy built output
COPY --from=build /app/.mastra/output /app/.mastra/output

# Copy production node_modules only
COPY --from=deps /app/node_modules /app/node_modules

# Copy package.json for metadata
COPY backend/package.json /app/

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

EXPOSE 3000
EXPOSE 3001

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", ".mastra/output/index.mjs"]
