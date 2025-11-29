// app/dashboard/merchants/page.tsx

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/db";
import Link from "next/link";

type MerchantRule = {
  id: string;
  merchantName: string | null;
  network: string | null;
  market: string | null;
  commissionType: string | null;
  commissionRate: any;
  notes: string | null;
  status: string | null;
  domainPattern: string | null;
  active: boolean;
};

function asPlainString(x: unknown): string {
  if (x == null) return "—";
  try {
    // Handle Prisma Decimal or objects with toString()
    // @ts-ignore
    if (typeof x === "object" && typeof (x as any).toString === "function") {
      return (x as any).toString();
    }
    return String(x);
  } catch {
    return "—";
  }
}

function deriveHomepage(m: MerchantRule): string | null {
  const raw = (m.domainPattern ?? "").trim();
  if (!raw) return null;

  // If already a full URL, just return it
  if (/^https?:\/\//i.test(raw)) return raw;

  // Otherwise treat it as a hostname / domain
  return `https://${raw.replace(/^\./, "")}`;
}

function StatusPill({
  status,
  active,
}: {
  status: string | null;
  active: boolean;
}) {
  const s = (status || "").toUpperCase();
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium";

  if (!active) {
    return (
      <span className={`${base} bg-gray-50 text-gray-600 border-gray-300`}>
        DISABLED
      </span>
    );
  }

  if (s === "ACTIVE" || s === "APPROVED") {
    return (
      <span className={`${base} bg-green-50 text-green-700 border-green-300`}>
        ACTIVE
      </span>
    );
  }

  if (s === "REJECTED") {
    return (
      <span className={`${base} bg-red-50 text-red-700 border-red-300`}>
        REJECTED
      </span>
    );
  }

  return (
    <span className={`${base} bg-yellow-50 text-yellow-700 border-yellow-300`}>
      PENDING
    </span>
  );
}

export default async function MerchantsBrowsePage() {
  // Step 1: load all ACTIVE merchants
  const allActive: MerchantRule[] = await prisma.merchantRule.findMany({
    where: {
      active: true,
    },
    orderBy: {
      merchantName: "asc",
    },
    select: {
      id: true,
      merchantName: true,
      network: true,
      commissionType: true,
      commissionRate: true,
      notes: true,
      status: true,
      // @ts-ignore (market exists on your model)
      market: true,
      domainPattern: true,
      active: true,
    },
  });

  // Step 2: location-based filter (PH-first + Global)
  const visible = allActive.filter((m) => {
    const mk = (m.market || "").toUpperCase().trim();

    // No market set → treat as generic, still show
    if (!mk) return true;

    // PH rollout: show PH + GLOBAL only
    if (mk === "PH" || mk === "GLOBAL") return true;

    // Hide US-only or other markets from normal users for now
    return false;
  });

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Browse Merchants
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            These merchants are currently enabled inside{" "}
            <span className="font-semibold">linkmint.co</span> for your region.
            Visit a merchant, choose a product, copy the product URL, then
            create a SmartLink from that URL to start earning.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Empty state */}
      {!visible.length && (
        <div className="rounded-xl border border-dashed bg-white p-4 text-sm text-gray-500">
          No merchants are visible for your region yet. Please check back later.
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {visible.map((m) => {
          const name = m.merchantName ?? "Unnamed merchant";
          const network = m.network ?? "—";
          const market = m.market ?? "—";
          const commissionRate = asPlainString(m.commissionRate);
          const commissionType = m.commissionType ?? "PERCENT";
          const notes = m.notes ?? "";
          const homepage = deriveHomepage(m);

          return (
            <div
              key={m.id}
              className="flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="truncate text-base font-semibold">
                      {name}
                    </h2>

                    <StatusPill status={m.status} active={m.active} />

                    <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                      Network: {network}
                    </span>

                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                      Market: {market}
                    </span>
                  </div>

                  {homepage && (
                    <div className="mt-1 text-sm text-gray-700">
                      Website:{" "}
                      <a
                        href={homepage}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all font-mono text-xs text-teal-700 hover:text-teal-900"
                      >
                        {homepage}
                      </a>
                    </div>
                  )}

                  <div className="mt-1 text-sm text-gray-600">
                    Commission:{" "}
                    <span className="font-mono">
                      {commissionType} @ {commissionRate}
                    </span>
                  </div>

                  {notes && (
                    <div className="mt-1 text-xs text-gray-500">{notes}</div>
                  )}
                </div>

                {homepage && (
                  <div className="shrink-0">
                    <a
                      href={homepage}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full bg-teal-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1"
                    >
                      Visit merchant
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-1 border-t pt-2 text-xs text-gray-500">
                To promote this merchant: open their website, choose a product,
                copy the full product URL, then create a SmartLink in your
                dashboard. linkmint.co will handle the tracking behind the
                scenes.
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
