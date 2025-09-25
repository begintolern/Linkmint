// scripts/list-users.ts
import { prisma } from "@/lib/db";

async function main() {
  console.log("Listing latest users…");

  // Quick sanity: how many rows are in User?
 const [{ count }] = await prisma.$queryRaw<{ count: number }[]>`
  SELECT COUNT(*)::int AS count FROM "User";
`;

  console.log("Total users:", count);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, email: true, role: true, createdAt: true },
  });

  if (!users.length) {
    console.log("No users found.");
  } else {
    for (const u of users) {
      console.log(
        `${u.createdAt.toISOString()}  ${u.id}  ${u.role?.padEnd(6)}  ${u.email}`
      );
    }
  }
}

main()
  .catch((e) => {
    console.error("Error listing users:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
