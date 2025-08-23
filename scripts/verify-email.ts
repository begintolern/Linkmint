import { prisma } from "@/lib/db";

async function main() {
  const email = process.argv.find(a => a.startsWith("--email="))?.split("=")[1];
  if (!email) throw new Error("Usage: tsx scripts/verify-email.ts --email=user@example.com");

  const user = await prisma.user.update({
    where: { email },
    data: { emailVerifiedAt: new Date() },
    select: { id: true, email: true, emailVerifiedAt: true },
  });

  console.log("Verified:", user);
}

main().finally(() => prisma.$disconnect());
