# ---- Runtime+Build (single stage) ----
FROM node:18-alpine

# System deps sometimes needed by bcrypt
RUN apk add --no-cache python3 make g++ openssl

WORKDIR /app

# Copy only what's needed for dependency install & prisma generate
COPY package.json package-lock.json* ./
COPY prisma/schema.prisma prisma/schema.prisma

# Install deps (clean, reproducible)
RUN npm ci

# Generate Prisma client (available at build and runtime)
RUN npx prisma generate

# Now copy the rest of the app
COPY . .

# Build Next.js (reads env at build as needed, but DB URL is required only at runtime)
RUN npm run build

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

EXPOSE 3000

# Start the Next.js server
CMD ["npm", "start"]
