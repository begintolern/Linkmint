// lib/prisma.ts

import { PrismaClient } from "@prisma/client";

// Avoid creating multiple PrismaClient instances in development
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Reuse the existing instance if it exists, otherwise create a new one
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Assign it to global in development mode
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
