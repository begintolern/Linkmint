// /lib/db.ts
import { PrismaClient } from "@prisma/client";

// Reuse a single client in dev and on serverless to avoid too many connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Only pass the datasource override if the env var actually exists.
// If it's missing at build time, Prisma can still be constructed and the
// real URL will be present at runtime in Railway.
const url = process.env.DATABASE_URL;

const prismaClient =
  globalForPrisma.prisma ??
  new PrismaClient(url ? { datasources: { db: { url } } } : undefined);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaClient;

export const prisma = prismaClient;
export default prisma;
