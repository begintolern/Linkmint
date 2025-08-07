// scripts/forceDeleteUser.ts
import { prisma } from "@/lib/db";

async function forceDeleteUser(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log("❌ User not found.");
      return;
    }

    console.log(`🔍 Deleting user: ${email} (id: ${user.id})`);

    // Delete related records (if cascade isn't enabled)
    await prisma.eventLogs.deleteMany({ where: { userId: user.id } });
    await prisma.payout.deleteMany({ where: { userId: user.id } });
    await prisma.referralGroup.deleteMany({ where: { referrerId: user.id } });

    // Finally, delete the user
    await prisma.user.delete({ where: { email } });

    console.log("✅ User and related records deleted.");
  } catch (error) {
    console.error("❌ Error deleting user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

forceDeleteUser("epo78741@yahoo.com");
