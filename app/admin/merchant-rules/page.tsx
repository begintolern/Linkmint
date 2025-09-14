// app/admin/merchant-rules/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/db";
import AddRuleForm from "./AddRuleForm";
import DeleteRuleButton from "./DeleteRuleButton";

function asStringArray(v: any): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)) : [];
}

export default async function Page() {
  const rules = await prisma.merchantRule.findMany({
    orderBy: { merchantName: "asc" },
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Merchant Rules</h1>
        <AddRuleForm />
      </div>

      {!rules.length && (
        <div className="text-sm opacity-70">No rules found.</div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {rules.map((r: any) => {
          const allowed = asStringArray(r.allowedSources);
          const disallowed = asStringArray(r.disallowed);
          const rateStr =
            r.commissionRate?.toString?.() ??
            (typeof r.rate === "number" ? String(r.rate) : "");

          const regions: string[] = Array.isArray(r.allowedRegions)
            ? r.allowedRegions
            : [];

          const cardMuted = !r.active; // grey out inactive entries

          return (
            <div
              key={r.id}
              className={`rounded-xl border p-4 space-y-2 ${
                cardMuted ? "opacity-70" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {r.merchantName}{" "}
                  <span className="opacity-60">({r.network ?? "—"})</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Status chip */}
                  {r.status && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                      {r.status}
                    </span>
                  )}
                  {/* Active/Inactive chip */}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      r.active ? "bg-green-100" : "bg-gray-200"
                    }`}
                  >
                    {r.active ? "Active" : "Inactive"}
                  </span>
                  <DeleteRuleButton
                    id={r.id}
                    name={`${r.merchantName} (${r.network ?? "—"})`}
                  />
                </div>
              </div>

              {r.domainPattern && (
                <div className="text-sm">Domain: {r.domainPattern}</div>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Cookie: {r.cookieWindowDays ?? "—"} days</div>
                <div>Payout delay: {r.payoutDelayDays ?? "—"} days</div>
                <div>
                  Commission: {r.commissionType ?? "—"}{" "}
                  {rateStr ? `@ ${rateStr}` : ""}
                </div>
                <div>
                  Regions:{" "}
                  {regions.length
                    ? regions.join(", ")
                    : "—"}
                </div>
              </div>

              {!!allowed.length && (
                <div className="text-sm">
                  <div className="font-semibold">Allowed</div>
                  <div className="opacity-80">{allowed.join(", ")}</div>
                </div>
              )}

              {!!disallowed.length && (
                <div className="text-sm">
                  <div className="font-semibold">Disallowed</div>
                  <div className="opacity-80">{disallowed.join(", ")}</div>
                </div>
              )}

              {r.inactiveReason && !r.active && (
                <div className="text-sm">
                  <div className="font-semibold">Inactive reason</div>
                  <div className="opacity-80">{r.inactiveReason}</div>
                </div>
              )}

              {r.notes && (
                <div className="text-sm">
                  <div className="font-semibold">Notes</div>
                  <div className="opacity-80">{r.notes}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
