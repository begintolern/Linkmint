// app/admin/merchant-rules/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/db";
import Link from "next/link";
import AddRuleForm from "./AddRuleForm";
import DeleteRuleButton from "./DeleteRuleButton";
import StatusSelect from "./StatusSelect";

type Status = "PENDING" | "ACTIVE" | "REJECTED";

// Matches the fields selected in prisma.merchantRule.findMany below
type Rule = {
  id: string;
  active: boolean;
  status: string | null; // normalized below to Status
  merchantName: string | null;
  network: string | null;
  domainPattern: string | null;
  commissionType: string | null;
  commissionRate: unknown; // Decimal | number | string | null
  notes: string | null;
};

function normalizeStatus(s: unknown): Status {
  if (s === "ACTIVE" || s === "REJECTED" || s === "PENDING") return s;
  return "PENDING";
}

function asPlainString(x: unknown): string {
  if (x == null) return "—";
  try {
    // Handle Prisma Decimal or anything with toString()
    // @ts-ignore
    if (typeof x === "object" && typeof (x as any).toString === "function") {
      return (x as any).toString();
    }
    return String(x);
  } catch {
    return "—";
  }
}

function StatusBadge({ status }: { status: Status }) {
  const theme =
    status === "ACTIVE"
      ? "bg-green-50 text-green-700 border-green-300"
      : status === "PENDING"
      ? "bg-yellow-50 text-yellow-700 border-yellow-300"
      : "bg-red-50 text-red-700 border-red-300";
  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${theme}`}>
      {status}
    </span>
  );
}

type PageProps = {
  searchParams?: {
    show?: string;
  };
};

export default async function MerchantRulesPage({ searchParams }: PageProps) {
  const showParam = searchParams?.show ?? "all";
  const activeOnly = showParam === "active";

  // 🔎 IMPORTANT: "active only" = enabled AND status ACTIVE (approved)
  const rules: Rule[] = await prisma.merchantRule.findMany({
    where: activeOnly ? { active: true, status: "ACTIVE" } : {},
    orderBy: { merchantName: "asc" },
    select: {
      id: true,
      active: true,
      status: true, // may be null on old rows; we normalize below
      merchantName: true,
      network: true,
      domainPattern: true,
      commissionType: true,
      commissionRate: true, // Decimal | number | null
      notes: true,
    },
  });

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Merchant Rules</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage how linkmint.co treats each merchant (status, domain, and
            commission rules).
          </p>
        </div>
        <Link href="/admin" className="text-sm text-blue-600 hover:underline">
          ← Back to Admin
        </Link>
      </div>

      {/* Filter controls */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">Filter:</span>
        <Link
          href="/admin/merchant-rules"
          className={`text-xs px-3 py-1 rounded-full border ${
            !activeOnly
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          All rules
        </Link>
        <Link
          href="/admin/merchant-rules?show=active"
          className={`text-xs px-3 py-1 rounded-full border ${
            activeOnly
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          Active & approved only
        </Link>
        <span className="ml-auto text-xs text-gray-500">
          Showing <strong>{rules.length}</strong>{" "}
          {activeOnly ? "active + approved" : "total"} merchant rules
        </span>
      </div>

      {!rules.length && (
        <div className="text-sm opacity-70">No rules found.</div>
      )}

      {/* Add new */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <AddRuleForm />
      </div>

      {/* List */}
      <div className="space-y-3">
        {rules.map((r: Rule) => {
          const status = normalizeStatus(r.status);
          const commissionRateStr = asPlainString(r.commissionRate);
          const networkStr = r.network ?? "—";
          const domainStr = r.domainPattern ?? "—";
          const notesStr = r.notes ?? "";
          const merchantName = r.merchantName ?? "—";

          return (
            <div
              key={r.id}
              className={`rounded-2xl border bg-white p-4 shadow-sm ${
                status === "PENDING" ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-lg font-semibold truncate">
                      {merchantName}{" "}
                      <span className="text-sm text-gray-400">
                        ({networkStr})
                      </span>
                    </div>

                    {/* Read-only badge */}
                    <StatusBadge status={status} />

                    {/* Inline editor */}
                    <StatusSelect id={r.id} initial={status} />

                    {/* Active toggle indicator */}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        r.active
                          ? "bg-blue-50 text-blue-700 border-blue-300"
                          : "bg-gray-50 text-gray-600 border-gray-300"
                      }`}
                    >
                      {r.active ? "Enabled" : "Disabled"}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 mt-1">
                    Domain: <span className="font-mono">{domainStr}</span>
                  </div>

                  <div className="text-sm text-gray-600">
                    Commission:{" "}
                    <span className="font-mono">
                      {r.commissionType ?? "—"} @ {commissionRateStr}
                    </span>
                  </div>

                  {notesStr ? (
                    <div className="text-sm text-gray-500 mt-1">
                      {notesStr}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <DeleteRuleButton id={r.id} name={merchantName} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
