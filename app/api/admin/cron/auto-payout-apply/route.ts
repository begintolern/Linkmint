// add this import at the top with your others:
import { autoPayoutApply } from "@/lib/engines/payout/autoApply";

// ...

export async function POST(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const on = await isAutoPayoutEnabled();
  const disburse = await isAutoDisburseEnabled();
  if (!on) {
    return NextResponse.json({ ok: false, error: "auto_payout_disabled" }, { status: 400 });
  }

  // optional: allow a limit from body
  let limit = 20;
  const body = await req.json().catch(() => ({} as any));
  if (typeof body?.limit === "number" && body.limit > 0 && body.limit <= 100) {
    limit = body.limit | 0;
  }

  const result = await autoPayoutApply({ limit });

  return NextResponse.json({
    ...result,
    mode: disburse ? "DISBURSE" : "DRY_RUN",
  });
}
