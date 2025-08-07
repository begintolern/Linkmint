// lib/apiHandlers/floatLogsHandler.ts
import { prisma } from "@/lib/db";

export async function fetchFloatLogs() {
  try {
    const floatLogs = await prisma.floatLog.findMany({
      orderBy: { createdAt: "desc" },
    });

    return { success: true, floatLogs };
  } catch (error) {
    console.error("Failed to fetch float logs:", error);
    return { success: false, error: "Unable to fetch float logs." };
  }
}
