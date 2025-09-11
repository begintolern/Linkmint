// lib/db.ts
import { PrismaClient } from "@prisma/client";

// Single Prisma instance across hot reloads in dev
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Note: No middleware here. We use a DB trigger for soft-delete on User.
