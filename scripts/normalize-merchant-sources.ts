// scripts/normalize-merchant-sources.ts
// Normalizes MerchantRule.allowedSources / disallowed (Json?) into clean string[] or NULL.
// Compatible with schema:
//   allowedSources Json?
//   disallowed     Json?
//
// Run with:
//   npx ts-node scripts/normalize-merchant-sources.ts

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

function coerceToStringArray(v: unknown): string[] | null {
  if (v == null) return null;

  if (Array.isArray(v)) {
    const arr = v.map((x) => String(x).trim()).filter(Boolean);
    return arr.length ? arr : null;
  }

  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;

    // Try JSON first (e.g., '["tiktok","reddit"]' or '"single"')
    if (
      (s.startsWith("[") && s.endsWith("]")) ||
      (s.startsWith('"') && s.endsWith('"'))
    ) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          const arr = parsed.map((x: any) => String(x).trim()).filter(Boolean);
          return arr.length ? arr : null;
        }
        // fall through to CSV split
      } catch {
        // fall through to CSV split
      }
    }

    // Fallback: CSV like "tiktok, reddit , youtube"
    const parts = s.split(",").map((x) => x.trim()).filter(Boolean);
    return parts.length ? parts : null;
  }

  // Common legacy shapes:
  if (typeof v === "object") {
    const obj = v as Record<string, any>;

    // { sources: [...] }
    if (Array.isArray(obj.sources)) {
      const arr = obj.sources.map((x: any) => String(x).trim()).filter(Boolean);
      return arr.length ? arr : null;
    }

    // Map-like { tiktok: true, reddit: true, youtube: false }
    const truthy = Object.entries(obj)
      .filter(([, val]) => val === true || val === "true" || val === 1)
      .map(([key]) => key.trim())
      .filter(Boolean);
    return truthy.length ? truthy : null;
  }

  return null;
}

function arraysEqual(a: string[] | null, b: string[] | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  const A = [...a].sort();
  const B = [...b].sort();
  for (let i = 0; i < A.length; i++) {
    if (A[i] !== B[i]) return false;
  }
  return true;
}

async function main() {
  const rows = await prisma.merchantRule.findMany({
    select: {
      id: true,
      merchantName: true,
      allowedSources: true, // Json?
      disallowed: true,     // Json?
    },
  });

  let updated = 0;
  for (const r of rows) {
    const normalizedAllowed = coerceToStringArray((r as any).allowedSources);
    const normalizedDisallowed = coerceToStringArray((r as any).disallowed);

    // Determine if update is necessary by comparing to current array-if-array
    const currentAllowed =
      Array.isArray((r as any).allowedSources)
        ? ((r as any).allowedSources as any[]).map((x) => String(x).trim()).filter(Boolean)
        : coerceToStringArray((r as any).allowedSources);

    const currentDisallowed =
      Array.isArray((r as any).disallowed)
        ? ((r as any).disallowed as any[]).map((x) => String(x).trim()).filter(Boolean)
        : coerceToStringArray((r as any).disallowed);

    const needAllowedUpdate = !arraysEqual(currentAllowed, normalizedAllowed);
    const needDisallowedUpdate = !arraysEqual(currentDisallowed, normalizedDisallowed);

    if (!needAllowedUpdate && !needDisallowedUpdate) continue;

    await prisma.merchantRule.update({
      where: { id: r.id },
      data: {
        allowedSources:
          normalizedAllowed === null ? Prisma.DbNull : normalizedAllowed,
        disallowed:
          normalizedDisallowed === null ? Prisma.DbNull : normalizedDisallowed,
      },
    });

    updated++;
    // console.log(`Updated ${r.merchantName} (${r.id})`);
  }

  console.log(`Normalized sources on ${updated} merchant(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
