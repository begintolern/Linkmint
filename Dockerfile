# ---------- Base
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl git \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---------- Deps (install with dev deps for build)
FROM base AS deps
# Copy minimal files needed to install deps and generate Prisma client
COPY package.json package-lock.json* pnpm-lock.yaml* .npmrc* ./
COPY prisma ./prisma
# Install deps (prefer pnpm if lock exists; otherwise npm)
RUN if [ -f pnpm-lock.yaml ]; then corepack pnpm i --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci --include=dev; \
    else npm i --production=false; fi

# ---------- Build
# ---------- Build (uses deps with dev deps present)
FROM deps AS build
COPY . .
# Force-regenerate Prisma Client so types (ip/userAgent) are fresh
RUN rm -rf node_modules/.prisma node_modules/@prisma/client \
  && npx prisma generate --schema=prisma/schema.prisma \
  && npm run build

# ---------- Runtime
FROM node:20-slim AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy runtime artifacts
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma

EXPOSE 3000
# Generate Prisma Client at runtime too (safe/no-op if already generated), then start
CMD ["sh", "-c", "npx prisma generate && npm start"]
