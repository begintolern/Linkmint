# ---------- Base (no NODE_ENV here)
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates git \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---------- Deps (install including devDeps)
FROM base AS deps
# Copy manifests + prisma schema first so postinstall can find it
COPY package.json package-lock.json* pnpm-lock.yaml* .npmrc* ./
COPY prisma ./prisma
# Force include dev deps for build
RUN if [ -f pnpm-lock.yaml ]; then corepack pnpm i --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci --include=dev; \
    else npm i --production=false; fi

# ---------- Build (uses deps with dev deps present)
FROM deps AS build
COPY . .
RUN npx prisma generate && npm run build

# ---------- Runtime (production-only)
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
CMD ["npm", "start"]
