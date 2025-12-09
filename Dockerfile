# syntax=docker/dockerfile:1
# Optimized for Next.js 16 + React 19 + pnpm
# Based on Payload CMS optimized dockerfile structure

# --- 1. Base Stage ---
FROM node:22-slim AS base

# Setup pnpm environment
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Install OpenSSL and CA certificates (required for Prisma/MongoDB clients)
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# --- 2. Deps Stage ---
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies using cache mount for faster builds
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  corepack enable pnpm && pnpm install --frozen-lockfile

# --- 3. Builder Stage ---
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=true
ENV NODE_ENV=production
# Dummy env vars to pass validation during build
ENV MONGODB_URI="mongodb://localhost:27017/build_mock_db"
ENV AUTH_SECRET="build_mock_secret_at_least_32_chars_long"
ENV AUTH_URL="http://localhost:3000"

# Build the application
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  corepack enable pnpm && pnpm run build

# --- 4. Runner Stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
  PORT=3000 \
  HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public
# Create .next directory and set permissions
RUN mkdir .next && chown nextjs:nodejs .next

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
