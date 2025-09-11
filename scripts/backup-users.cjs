// Backs up Users to /backups as JSON + CSV (no passwords/tokens)
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const prisma = new PrismaClient();

(async () => {
  try {
    const rows = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true, email: true, name: true,
        role: true, trustScore: true,
        referralCode: true, referredById: true, referralGroupId: true,
        createdAt: true, updatedAt: true, deletedAt: true,
        // EXCLUDES: password, tokens, etc.
      },
    });

    const dir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    const ts = new Date()
      .toISOString().replace(/[:.]/g, "-").replace("T","_").slice(0,19);

    // JSON
    const jsonPath = path.join(dir, `users_${ts}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2));

    // CSV
    const headers = Object.keys(rows[0] || {
      id: "", email: "", name: "", role: "", trustScore: "",
      referralCode: "", referredById: "", referralGroupId: "",
      createdAt: "", updatedAt: "", deletedAt: ""
    });
    const csv = [
      headers.join(","),
      ...rows.map(r => headers.map(h => {
        const v = r[h];
        if (v == null) return "";
        const s = (v instanceof Date ? v.toISOString() : String(v));
        return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
      }).join(","))
    ].join("\n");
    const csvPath = path.join(dir, `users_${ts}.csv`);
    fs.writeFileSync(csvPath, csv);

    console.log(`✅ Backed up ${rows.length} users to:`);
    console.log(`   ${jsonPath}`);
    console.log(`   ${csvPath}`);
  } catch (e) {
    console.error("❌ Backup failed:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
