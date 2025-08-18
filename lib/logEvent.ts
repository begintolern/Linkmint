// lib/logEvent.ts
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type LogDetail = Prisma.InputJsonValue;

export async function logEvent(input: {
  type: string;
  message: string;
  userId?: string | null;
  detail?: LogDetail | null;
}) {
  return prisma.eventLogs.create({
    data: {
      type: input.type,
      message: input.message,
      userId: input.userId ?? null,
      detail: input.detail ?? Prisma.JsonNull,
    },
    select: { id: true },
  });
}
