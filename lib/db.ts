// lib/db.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// ✅ Allow self-signed certs in *development* only
if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// Build a pg Pool that ignores self-signed cert validation (Railway/maglev)
function buildPoolFromEnv() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return new pg.Pool({
    connectionString: url,
    ssl: { require: true, rejectUnauthorized: false },
    max: 5,
  });
}

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  (() => {
    const pool = buildPoolFromEnv();
    const adapter = new PrismaPg(pool);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  })();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
