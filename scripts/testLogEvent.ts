// scripts/testLogEvent.ts
import { prisma } from "@/lib/db";

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "refbase@test.com" },
  });

  if (!user) {
    console.error("User not found.");
    return;
  }

  const testLog = await prisma.eventLogs.create({
    data: {
      userId: user.id,
      type: "test",
      detail: "This is a test log event.",
    },
  });

  console.log("✅ Log created:", testLog.id);
}

main()
  .catch((\1: any) => console.error("❌ Error:", e))
  .finally(() => prisma.$disconnect());
