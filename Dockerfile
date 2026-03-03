# ─────────────────────────────────────────────────────
# Auto Prop Firm – Multi-stage Dockerfile
# ─────────────────────────────────────────────────────
# Build:   docker build -t autoprop-shell .
# Run:     docker run -p 3001:3001 --env-file apps/shell/.env autoprop-shell

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ── 1. Install dependencies ──
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/shell/package.json apps/shell/package.json
COPY packages/vault-sdk/package.json packages/vault-sdk/package.json
RUN pnpm install --frozen-lockfile

# ── 2. Build ──
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/shell/node_modules ./apps/shell/node_modules
COPY --from=deps /app/packages/vault-sdk/node_modules ./packages/vault-sdk/node_modules
COPY . .

# Generate Prisma client
RUN cd apps/shell && pnpm exec prisma generate

# Build vault-sdk first (workspace dependency)
RUN cd packages/vault-sdk && pnpm build

# Build Next.js (standalone output)
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/shell && pnpm build

# ── 3. Production image ──
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built app
COPY --from=builder /app/apps/shell/public ./apps/shell/public
COPY --from=builder /app/apps/shell/.next/standalone ./
COPY --from=builder /app/apps/shell/.next/static ./apps/shell/.next/static

# Prisma needs the client at runtime
COPY --from=builder /app/apps/shell/prisma ./apps/shell/prisma
COPY --from=builder /app/apps/shell/node_modules/.prisma ./apps/shell/node_modules/.prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3001

CMD ["node", "apps/shell/server.js"]
