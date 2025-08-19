// scripts/testLogEvent.ts
import { prisma } from "@/lib/db";

async function main() {
  const email = "seeduser@test.com";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`User not found: ${email}`);

  const log = await prisma.eventLog.create({
    data: {
      userId: user.id,
      type: "test",
      detail: "Test event log from script",
      message: "This is a test log entry",
    },
  });

  console.log("Created event log:", log.id, log.type, log.createdAt);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
