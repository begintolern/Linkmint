// lib/db.ts
import { PrismaClient } from "@prisma/client";

// Reuse a single instance in dev / serverless
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Only pass a datasource override if the URL really exists (Railway injects at runtime)
const url = process.env.DATABASE_URL;
const prismaClient =
  globalForPrisma.prisma ??
  new PrismaClient(url ? { datasources: { db: { url } } } : undefined);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaClient;
}

export const prisma = prismaClient;
export default prisma;
