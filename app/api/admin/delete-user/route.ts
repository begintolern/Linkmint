// app/api/admin/delete-user/route.ts
import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// ── auth: require admin key (cookie or header) ────────────────────────────────
function isAdmin() {
  const jar = cookies();
  const h = headers();
  const adminKey = (process.env.ADMIN_API_KEY || "").trim();
  const cookieKey = (jar.get("admin_key")?.value || "").trim();
  const headerKey = (h.get("x-admin-key") || "").trim();
  return !!adminKey && (cookieKey === adminKey || headerKey === adminKey);
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
  const src: any = (body && typeof body === "object" && "data" in body) ? (body as any).data : body;

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

  // ── SOFT DELETE: redact and detach ──────────────────────────────────────────
  if (mode === "soft") {
    const redactedEmail = `${user.id}+deleted@redacted.invalid`;
    try {
      await prisma.$transaction(async (tx) => {
        // Detach logs from user
        await tx.policyCheckLog.updateMany({
          where: { userId: user.id },
          data: { userId: null },
        });

        // Clear tokens / credentials
        await tx.verificationToken.deleteMany({ where: { userId: user.id } });
        await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
        await tx.pinCredential.deleteMany({ where: { userId: user.id } });

        // Redact PII and mark deleted
        await tx.user.update({
          where: { id: user.id },
          data: {
            deletedAt: new Date(),
            email: redactedEmail,
            name: null,
            password: null,
            referralGroupId: null,
            referredById: null,
            tosAcceptedIp: null,
            defaultBankAccountNumber: null,
            defaultBankName: null,
            defaultGcashNumber: null,
          },
        });
      });

      return NextResponse.json({
        ok: true,
        mode: "soft",
        id: user.id,
        was: user.email,
        now: redactedEmail,
      });
    } catch (e: any) {
      console.error("[admin/delete-user][soft] error:", e?.message || e);
      return NextResponse.json({ ok: false, error: "Soft delete failed", detail: String(e?.message || e) }, { status: 500 });
    }
  }

  // ── HARD DELETE: cascade delete dependents then user ────────────────────────
  const counts: Record<string, number> = {};
  try {
    await prisma.$transaction(async (tx) => {
      const del = async (name: string, p: Promise<{ count: number }>) => {
        const { count } = await p; counts[name] = (counts[name] || 0) + count;
      };

      // Detach references
      await del("PolicyCheckLog.detach",
        tx.policyCheckLog.updateMany({ where: { userId: user.id }, data: { userId: null } })
      );

      // Token/creds
      await del("VerificationToken",   tx.verificationToken.deleteMany({ where: { userId: user.id } }));
      await del("PasswordResetToken",  tx.passwordResetToken.deleteMany({ where: { userId: user.id } }));
      await del("PinCredential",       tx.pinCredential.deleteMany({ where: { userId: user.id } }));

      // User-owned entities
      await del("SmartLink",           tx.smartLink.deleteMany({ where: { userId: user.id } }));

      // Financial/event trails
      await del("Commission",          tx.commission.deleteMany({ where: { userId: user.id } }));
      await del("EventLog",            tx.eventLog.deleteMany({ where: { userId: user.id } }));
      await del("Payout",              tx.payout.deleteMany({ where: { userId: user.id } }));
      await del("PayoutAccount",       tx.payoutAccount.deleteMany({ where: { userId: user.id } }));
      await del("PayoutLog",           tx.payoutLog.deleteMany({ where: { userId: user.id } }));
      await del("PayoutRequest",       tx.payoutRequest.deleteMany({ where: { userId: user.id } }));

      // Overrides/referrals
      await del("OverrideCommission.Invitee", tx.overrideCommission.deleteMany({ where: { inviteeId: user.id } }));
      await del("OverrideCommission.Referrer", tx.overrideCommission.deleteMany({ where: { referrerId: user.id } }));

      // Referral group(s) created by this user (as referrer)
      await del("ReferralGroup",       tx.referralGroup.deleteMany({ where: { referrerId: user.id } }));

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
  } catch (e: any) {
    console.error("[admin/delete-user][hard] error:", e?.message || e);
    return NextResponse.json({ ok: false, error: "Hard delete failed", detail: String(e?.message || e) }, { status: 500 });
  }
}
