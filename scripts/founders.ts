// scripts/founders.ts
import { prisma } from "@/lib/db";

const founders = [
  // ← put 3–10 emails here to start; example:
  "ertorig3@gmail.com",           // you (already exists)
  "epo78741@gmail.com",           // your test account
  // "wife.email@example.com",    // add when ready
  // "friend1@example.com",
  // "friend2@example.com",
];

async function main() {
  const out: Array<{ email: string; id: string; referralCode: string; link: string }> = [];

  for (const email of founders) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {}, // no-op; don’t change role here
      create: {
        email,
        role: "USER",            // keep minimal; you can promote later
        emailVerifiedAt: new Date(), // mark verified for ease of testing
      },
      select: { id: true, email: true, referralCode: true },
    });

    // ensure referralCode exists (older users will already have one)
    let referralCode = user.referralCode;
    if (!referralCode) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {}, // prisma will generate referralCode via default if your schema does; if not, you can add generator here
        select: { referralCode: true },
      });
      referralCode = updated.referralCode!;
    }

    const origin = process.env.APP_ORIGIN || "https://linkmint.co";
    out.push({
      email: user.email,
      id: user.id,
      referralCode,
      link: `${origin}/signup?ref=${referralCode}`,
    });
  }

  console.log("\nFounder links:");
  for (const f of out) {
    console.log(`- ${f.email} → ${f.link}`);
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
