// components/merchant/MerchantCard.tsx
import MerchantStatusBadge from "./MerchantStatusBadge";

export type MerchantItem = {
  id: string;
  name: string | null;
  domain: string | null;
  network: string | null;
  status: "ACTIVE" | "PENDING" | "REJECTED" | string;
  commissionType: string | null;   // "PERCENT" | "FIXED"
  commissionRate: number | null;   // 0.65 => 65%
  cookieDays: number | null;
  payoutDelayDays: number | null;
  notes: string | null;
  allowed: string | null;
  disallowed: string | null;
};

function formatCommission(type: string | null, rate: number | null) {
  if (!type) return "—";
  if (type === "PERCENT" && typeof rate === "number") {
    return `${(rate * 100).toFixed(0)}%`;
  }
  if (type === "FIXED" && typeof rate === "number") {
    return `$${rate.toFixed(2)}`;
  }
  return type;
}

export default function MerchantCard({ m }: { m: MerchantItem }) {
  const isPending = m.status === "PENDING";
  const isRejected = m.status === "REJECTED";

  return (
    <div
      className={[
        "rounded-2xl border p-4 transition",
        isPending ? "opacity-60" : "",
        isRejected ? "opacity-70" : "",
        "bg-white shadow-sm",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold leading-tight">
            {m.name ?? m.domain ?? "Merchant"}
          </h3>
          <p className="text-xs text-gray-500">
            {m.domain ? m.domain : "—"} {m.network ? `• ${m.network}` : ""}
          </p>
        </div>
        <MerchantStatusBadge status={m.status} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
          <div className="text-gray-500">Commission</div>
          <div className="font-medium">{formatCommission(m.commissionType, m.commissionRate)}</div>
        </div>
        <div className="space-y-1">
          <div className="text-gray-500">Cookie</div>
          <div className="font-medium">{m.cookieDays ?? "—"} days</div>
        </div>
        <div className="space-y-1">
          <div className="text-gray-500">Payout Delay</div>
          <div className="font-medium">
            {m.payoutDelayDays !== null && m.payoutDelayDays !== undefined
              ? `${m.payoutDelayDays} days`
              : "—"}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-gray-500">Notes</div>
          <div className="line-clamp-2">{m.notes ?? "—"}</div>
        </div>
      </div>

      {(m.allowed || m.disallowed) && (
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          {m.allowed && (
            <div>
              <div className="font-semibold">Allowed</div>
              <div className="text-gray-700 whitespace-pre-wrap">{m.allowed}</div>
            </div>
          )}
          {m.disallowed && (
            <div>
              <div className="font-semibold">Disallowed</div>
              <div className="text-gray-700 whitespace-pre-wrap">{m.disallowed}</div>
            </div>
          )}
        </div>
      )}

      {isPending && (
        <div className="mt-3 text-xs text-amber-600">
          Pending programs are greyed out until approved.
        </div>
      )}
      {isRejected && (
        <div className="mt-3 text-xs text-red-600">
          Rejected programs are listed for transparency (not usable).
        </div>
      )}
    </div>
  );
}
