import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/db";

// Accept both { email } or { id }.
// Optional: { mode: "hard" } to hard-delete related rows (best for TEST users only).

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// ── auth: require admin key (cookie or header) ────────────────────────────────
function isAdmin() {
  const jar = cookies();
  const h = headers();
  const adminKey = process.env.ADMIN_API_KEY || "";
  const cookieKey = jar.get("admin_key")?.value || "";
  const headerKey = h.get("x-admin-key") || "";
  return adminKey && (cookieKey === adminKey || headerKey === adminKey);
}

function safeJsonParse(raw: string) {
  if (!raw?.trim()) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export async function POST(req: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const raw = await req.text();
  const body = safeJsonParse(raw);
  const src = typeof body === "object" && body && "data" in body ? (body as any).data : body;

  const id = typeof src?.id === "string" ? src.id.trim() : undefined;
  const email = typeof src?.email === "string" ? src.email.trim().toLowerCase() : undefined;
  const mode = (typeof src?.mode === "string" ? src.mode : "soft").toLowerCase() as "soft" | "hard";

  if (!id && !email) {
    return NextResponse.json({ ok: false, error: "Provide user id or email" }, { status: 400 });
  }

  // Find user
  const user = await prisma.user.findFirst({
    where: { OR: [{ id }, { email }] },
    select: { id: true, email: true, createdAt: true },
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  // Common cleanup: remove sensitive tokens/creds, detach references
  const now = new Date();

  if (mode === "soft") {
    // Soft-delete + redact PII, detach references, clear tokens
    const redactedEmail = `${user.id}+deleted@redacted.invalid`;

    const result = await prisma.$transaction(async (tx) => {
      // Detach logs from user
      await tx.policyCheckLog.updateMany({
        where: { userId: user.id },
        data: { userId: null },
      });

      // Clear tokens / credentials that could be used to login
      await tx.verificationToken.deleteMany({ where: { userId: user.id } });
      await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await tx.pinCredential.deleteMany({ where: { userId: user.id } });

      // Optionally detach group/referrer relations
      await tx.user.update({
        where: { id: user.id },
        data: {
          deletedAt: now,
          email: redactedEmail,
          name: null,
          password: null,
          referralGroupId: null,
          referredById: null,
          tosAcceptedIp: null,
          defaultBankAccountNumber: null,
          defaultBankName: null,
          defaultGcashNumber: null,
          // keep audit fields; leave bonus/score as-is
        },
      });

      return { redactedEmail };
    });

    return NextResponse.json({
      ok: true,
      mode: "soft",
      id: user.id,
      was: user.email,
      now: result.redactedEmail,
    });
  }

  // HARD DELETE (dangerous): cascade through likely dependents.
  // Intended for TEST data only. If your schema grows, add new relations here.
  // If a foreign-key lacks onDelete: Cascade, explicit deleteMany handles it.
  const counts: Record<string, number> = {};
  await prisma.$transaction(async (tx) => {
    const del = async (name: string, p: Promise<{ count: number }>) => {
      const { count } = await p; counts[name] = (counts[name] || 0) + count;
    };

    await del("PolicyCheckLog.detach", tx.policyCheckLog.updateMany({ where: { userId: user.id }, data: { userId: null } }));

    await del("VerificationToken", tx.verificationToken.deleteMany({ where: { userId: user.id } }));
    await del("PasswordResetToken", tx.passwordResetToken.deleteMany({ where: { userId: user.id } }));
    await del("PinCredential", tx.pinCredential.deleteMany({ where: { userId: user.id } }));

    await del("SmartLink", tx.smartLink.deleteMany({ where: { userId: user.id } }));

    await del("Commission", tx.commission.deleteMany({ where: { userId: user.id } }));
    await del("EventLog", tx.eventLog.deleteMany({ where: { userId: user.id } }));

    await del("Payout", tx.payout.deleteMany({ where: { userId: user.id } }));
    await del("PayoutAccount", tx.payoutAccount.deleteMany({ where: { userId: user.id } }));
    await del("PayoutLog", tx.payoutLog.deleteMany({ where: { userId: user.id } }));
    await del("PayoutRequest", tx.payoutRequest.deleteMany({ where: { userId: user.id } }));

    await del("OverrideCommission.Invitee", tx.overrideCommission.deleteMany({ where: { inviteeId: user.id } }));
    await del("OverrideCommission.Referrer", tx.overrideCommission.deleteMany({ where: { referrerId: user.id } }));

    await del("ReferralBatch", tx.referralBatch.deleteMany({ where: { referrerId: user.id } }));

    // Remove from groups (m2m)
    // If you used implicit join tables, detaching happens when user is deleted; otherwise add explicit cleanup.

    // Finally, delete user
    await tx.user.delete({ where: { id: user.id } });
  });

  return NextResponse.json({
    ok: true,
    mode: "hard",
    id: user.id,
    email: user.email,
    counts,
  });
}
