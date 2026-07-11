# Stage 1: Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml tsconfig.json ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Stage 2: Runtime stage
FROM node:22-alpine AS runner
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile
COPY --from=builder /app/.mastra /app/.mastra
COPY --from=builder /app/src/database/migrations /app/src/database/migrations
EXPOSE 3000
CMD ["node", ".mastra/output/index.mjs"]
