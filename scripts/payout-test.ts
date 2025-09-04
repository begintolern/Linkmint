// scripts/payout-test.ts
import { prisma } from "@/lib/db";
import { PayoutProvider, PayoutStatus } from "@prisma/client";

async function main() {
  const [action, ...rest] = process.argv.slice(2);

  if (action === "create") {
    // usage: create --email you@example.com --amount 12.34
    const email = arg("--email", rest);
    const amountStr = arg("--amount", rest);
    if (!email || !amountStr) throw new Error('Usage: create --email <email> --amount <number>');

    const amount = Number(amountStr);
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) throw new Error(`User not found: ${email}`);

    const payout = await prisma.payout.create({
      data: {
        userId: user.id,
        amount,
        method: PayoutProvider.PAYPAL,
        status: PayoutStatus.PENDING,
      },
      select: { id: true, amount: true, status: true, userId: true },
    });
    console.log("Created payout:", payout);
    return;
  }

  if (action === "approve") {
  // usage: approve --id <payoutId>
  const id = arg("--id", rest);
  if (!id) throw new Error("Usage: approve --id <payoutId>");

  const updated = await prisma.payout.update({
    where: { id },
    data: { status: PayoutStatus.PROCESSING }, // use PROCESSING instead of APPROVED
    select: { id: true, status: true, createdAt: true },
  });
  console.log("Moved payout to PROCESSING:", updated);
  return;
}

  if (action === "pay") {
    // usage: pay --id <payoutId> [--txn ABC123]
    const id = arg("--id", rest);
    const txn = arg("--txn", rest) ?? null;
    if (!id) throw new Error("Usage: pay --id <payoutId> [--txn <transactionId>]");

    const updated = await prisma.payout.update({
      where: { id },
      data: { status: PayoutStatus.PAID, paidAt: new Date(), transactionId: txn },
      select: { id: true, status: true, paidAt: true, transactionId: true },
    });
    console.log("Paid payout:", updated);
    return;
  }

  if (action === "sum") {
    // usage: sum --email you@example.com
    const email = arg("--email", rest);
    if (!email) throw new Error("Usage: sum --email <email>");

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) throw new Error(`User not found: ${email}`);

    const groups = await prisma.payout.groupBy({
      by: ["status"],
      where: { userId: user.id },
      _sum: { amount: true },
    });
    console.log("Payout sums by status:", groups);
    return;
  }

  throw new Error(
    "Usage:\n" +
      '  create  --email <email> --amount <number>\n' +
      '  approve --id <payoutId>\n' +
      '  pay     --id <payoutId> [--txn <transactionId>]\n' +
      '  sum     --email <email>\n'
  );
}

function arg(flag: string, args: string[]) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

main()
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
