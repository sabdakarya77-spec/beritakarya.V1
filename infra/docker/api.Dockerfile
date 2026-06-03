# ─────────────────────────────────────────────────────────────
# Stage 1: Dependencies
# Install semua dependencies monorepo (workspace packages + api)
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Salin manifest monorepo terlebih dahulu (layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/config/package.json ./packages/config/

RUN npm install -g pnpm && pnpm install --frozen-lockfile

# ─────────────────────────────────────────────────────────────
# Stage 2: Builder
# Build semua packages (types, utils, config) lalu build API
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++ font-noto font-noto-cjk fontconfig
RUN fc-cache -f
WORKDIR /app

RUN npm install -g pnpm turbo

# Salin seluruh source code
COPY . .

# Pakai node_modules dari stage deps
COPY --from=deps /app/node_modules ./node_modules

# Re-install untuk memastikan semua workspace links ter-setup dengan benar
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm --filter @beritakarya/api run db:generate

# Rebuild native modules (sharp) untuk arsitektur Alpine linux/amd64
RUN cd apps/api && npm rebuild sharp

# Build packages pendukung terlebih dahulu (types, utils, config)
RUN pnpm turbo run build --filter=@beritakarya/types --force
RUN pnpm turbo run build --filter=@beritakarya/utils --force
RUN pnpm turbo run build --filter=@beritakarya/config --force

# Build API — pastikan tsc menghasilkan dist/main.js
RUN pnpm --filter @beritakarya/api run build

# Verifikasi bahwa build berhasil menghasilkan dist/main.js
RUN test -f /app/apps/api/dist/main.js || \
    (echo "ERROR: Build failed — dist/main.js tidak ditemukan!" && exit 1)

# ─────────────────────────────────────────────────────────────
# Stage 3: Runner (Production Image)
# Image final yang ringan, hanya berisi file yang diperlukan
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl libc6-compat curl font-noto font-noto-cjk fontconfig
RUN fc-cache -f
RUN npm install -g pnpm

WORKDIR /app

# Buat user non-root untuk keamanan
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 apiuser

# Salin artifacts dari builder stage
COPY --from=builder --chown=apiuser:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=apiuser:nodejs /app/packages /app/packages
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/dist /app/apps/api/dist
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/package.json /app/apps/api/package.json
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/prisma /app/apps/api/prisma
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/scripts /app/apps/api/scripts
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/src /app/apps/api/src
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/tsconfig.scripts.json /app/apps/api/tsconfig.scripts.json
COPY --from=builder --chown=apiuser:nodejs /app/package.json /app/package.json
COPY --from=builder --chown=apiuser:nodejs /app/pnpm-workspace.yaml /app/pnpm-workspace.yaml

# Pastikan folder uploads ada dengan izin yang benar
RUN mkdir -p /app/apps/api/uploads/kyc && \
    chown -R apiuser:nodejs /app/apps/api/uploads

USER apiuser
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

WORKDIR /app/apps/api
CMD ["sh", "-c", "pnpm run db:migrate:deploy && node dist/main.js"]
