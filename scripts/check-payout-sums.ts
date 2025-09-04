import { prisma } from "@/lib/db";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "ertorig3@gmail.com" },
    select: { id: true, email: true },
  });
  if (!user) throw new Error("Test user not found");

  const groups = await prisma.payout.groupBy({
    by: ["status"],
    where: { userId: user.id },
    _sum: { amount: true },
    orderBy: { status: "asc" },
  });

  console.log("User:", user.email, user.id);
  console.log("Payout sums by status:", groups);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
