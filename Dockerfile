# Dockerfile for Linkmint (Node 20 + Prisma generate + Alpine build tools)

# 1) Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
# Native build deps for bcrypt, etc.
RUN apk add --no-cache python3 make g++ libc6-compat
COPY package*.json ./
# Avoid running postinstall (which calls prisma generate) here
RUN if [ -f package-lock.json ]; then npm ci --ignore-scripts; else npm install --ignore-scripts; fi

# 2) Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy prisma and generate client BEFORE building Next.js
COPY prisma ./prisma
RUN npx prisma generate
# Bring in the rest of the app
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3) Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "start"]
