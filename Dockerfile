# ---- Node version used by all stages ----
ARG NODE_VERSION=20

# ---- 1) Dependencies (install dev deps for build, skip scripts) ----
FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy only manifests for layer caching
COPY package*.json ./

# Install deps but DO NOT run postinstall (which may call prisma generate)
RUN npm ci --ignore-scripts

# ---- 2) Builder (compile Next.js, generate Prisma client) ----
FROM node:${NODE_VERSION}-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Reuse deps from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copy Prisma schema BEFORE generate
COPY prisma ./prisma

# Generate Prisma client inside the image
RUN npx prisma generate

# Copy the rest of the source
COPY . .

# Build Next.js output
RUN npm run build

# Keep only prod deps for runtime image
RUN npm ci --omit=dev && npm cache clean --force

# ---- 3) Runner (small, production) ----
FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Minimal OS deps for Prisma at runtime
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Run as non-root
RUN useradd -m nextjs
USER nextjs

# Bring in production deps and build output
COPY --chown=nextjs:nextjs --from=builder /app/node_modules ./node_modules
COPY --chown=nextjs:nextjs --from=builder /app/package.json ./package.json
COPY --chown=nextjs:nextjs --from=builder /app/.next ./.next
COPY --chown=nextjs:nextjs --from=builder /app/public ./public
# Include Prisma schema in runtime (for tooling like db pull)
COPY --chown=nextjs:nextjs --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "run", "start"]
