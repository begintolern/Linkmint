// lib/detectors/sharedPayoutEmail.ts
import type { PrismaClient } from "@prisma/client";

export type WarningFinding = {
  userId: string;
  type: "SHARED_PAYOUT_EMAIL";
  message: string;
  evidence: {
    payoutEmail: string;
    userIds: string[];
    count: number;
  };
  createdAt: string;
};

const CANDIDATE_COLUMNS = [
  "payoutEmail",
  "payout_email",
  "paypalEmail",
  "payoutPaypalEmail",
  "paypal_payout_email",
  "payout_paypal_email",
  "paypal",
] as const;

type Candidate = (typeof CANDIDATE_COLUMNS)[number];

async function getExistingEmailColumns(prisma: PrismaClient): Promise<Candidate[]> {
  const rows: Array<{ column_name: string }> = await prisma.$queryRawUnsafe(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'User'
        AND column_name = ANY($1::text[])
    `,
    CANDIDATE_COLUMNS as unknown as string[]
  );

  const found = new Set(rows.map((r) => r.column_name));
  return CANDIDATE_COLUMNS.filter((c) => found.has(c));
}

export async function detectSharedPayoutEmails(
  prisma: PrismaClient,
  {
    minAccounts = 2,
    limitEmails = 100,
    limitRows = 10000,
  }: { minAccounts?: number; limitEmails?: number; limitRows?: number } = {}
): Promise<WarningFinding[]> {
  let cols: Candidate[] = [];
  try {
    cols = await getExistingEmailColumns(prisma);
  } catch {
    return [];
  }
  if (cols.length === 0) return [];

  const parts: string[] = [];
  for (const c of cols) {
    parts.push(
      `SELECT id::text AS id, lower("${c}") AS email FROM "User" WHERE "${c}" IS NOT NULL`
    );
  }
  const unionSql = parts.join(" UNION ALL ");

  type Row = { id: string; email: string | null };
  let rows: Row[] = [];
  try {
    rows = await prisma.$queryRawUnsafe<Row[]>(
      `
        SELECT * FROM (
          ${unionSql}
        ) AS t
        WHERE email IS NOT NULL
        LIMIT ${Number(limitRows) || 10000}
      `
    );
  } catch {
    return [];
  }

  const emailToUsers = new Map<string, Set<string>>();
  for (const r of rows) {
    const email = (r.email || "").trim();
    if (!email) continue;
    const set = emailToUsers.get(email) ?? new Set<string>();
    set.add(r.id);
    emailToUsers.set(email, set);
  }

  const findings: WarningFinding[] = [];
  const now = new Date().toISOString();
  let processed = 0;

  for (const [email, uidSet] of emailToUsers) {
    const userIds = Array.from(uidSet);
    if (userIds.length >= minAccounts) {
      for (const uid of userIds) {
        findings.push({
          userId: uid,
          type: "SHARED_PAYOUT_EMAIL",
          message: `Payout email is shared across ${userIds.length} accounts.`,
          evidence: { payoutEmail: email, userIds: userIds.slice(0, 50), count: userIds.length },
          createdAt: now,
        });
      }
      processed += 1;
      if (processed >= limitEmails) break;
    }
  }

  return findings;
}
