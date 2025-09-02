# ---------- Base (deps + build tools)
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm" \
    NODE_ENV=production
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates git \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---------- Deps
FROM base AS deps
# Copy manifests + prisma schema first so postinstall can find it
COPY package.json package-lock.json* pnpm-lock.yaml* .npmrc* ./
COPY prisma ./prisma
RUN if [ -f pnpm-lock.yaml ]; then corepack pnpm i --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm i --production=false; fi

# ---------- Generate Prisma client
FROM deps AS prisma-gen
COPY prisma ./prisma
# Generate Prisma client at build-time (no DB needed)
RUN npx prisma generate

# ---------- Build
FROM prisma-gen AS build
# Copy the rest of the app
COPY . .
# Ensure node_modules from deps are available
# (they are, we’re in the same layer ancestry)
RUN npm run build

# ---------- Runtime
FROM node:20-slim AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# System certs for TLS
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy only what the app needs at runtime
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
# Keep schema so Prisma can validate at runtime (no generate needed here)
COPY --from=build /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "start"]
