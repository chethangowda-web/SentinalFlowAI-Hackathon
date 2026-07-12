# Stage 1: Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runtime stage
FROM node:22-alpine AS runner
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/.mastra /app/.mastra
COPY --from=builder /app/src/database/migrations /app/src/database/migrations
EXPOSE 3000
CMD ["node", ".mastra/output/index.mjs"]