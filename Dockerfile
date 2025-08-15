# ---------- 1) Deps ----------
FROM node:20-alpine AS deps
WORKDIR /app
# Optional, helps some native deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
# Install without running postinstall scripts (safer for CI)
RUN if [ -f package-lock.json ]; then npm ci --ignore-scripts; else npm i --ignore-scripts; fi

# ---------- 2) Builder ----------
FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (if you use Prisma)
RUN npx prisma generate

# Build Next.js in standalone mode (requires output:'standalone')
RUN npm run build

# ---------- 3) Runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Non-root user for security
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 nextjs

# Copy the standalone server output (this is what your error couldn’t find)
COPY --from=builder /app/.next/standalone ./
# Static assets
COPY --from=builder /app/.next/static ./.next/static
# Public files (favicons, robots.txt, etc.)
COPY --from=builder /app/public ./public
# Prisma bits needed at runtime (safe to copy even if unused)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

# The standalone build includes server.js at repo root after the COPY above
CMD ["node", "server.js"]
