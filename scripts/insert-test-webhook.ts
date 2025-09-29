// scripts/insert-test-webhook.ts
import { prisma } from "@/lib/db";

async function main() {
  const log = await prisma.eventLog.create({
    data: {
      type: "WEBHOOK_INCOMING",
      message: "TEST-EVENT-001",
      detail: JSON.stringify({
        subid: "cmfzz461m0001oihgnbsi00hb",
        amount: 12.34,
        currency: "USD",
        merchant: "Test Merchant",
        network: "TestNet",
        transaction_id: "TX123",
      }),
    },
  });

  console.log("Inserted test webhook log:", log.id);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
