import { prisma } from "@/lib/db";

async function main() {
  const u = await prisma.user.findUnique({
    where: { id: "cmeubtbbp0000ps0e08pu8k3s" },
    select: { id: true, email: true, name: true, role: true },
  });
  console.log(u);
}
main().finally(() => prisma.$disconnect());
