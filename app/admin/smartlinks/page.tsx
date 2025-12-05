// app/admin/smartlinks/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type SearchParams = {
  q?: string;
};

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function AdminSmartlinksPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const session = (await getServerSession(authOptions)) as Session | null;

  const user = session?.user as any;
  const isAdmin =
    user &&
    (user.role === "admin" ||
      user.role === "ADMIN" ||
      user.email === "ertorig3@gmail.com"); // your main admin email

  if (!isAdmin) {
    redirect("/dashboard");
  }

  const q = (searchParams?.q ?? "").trim();

  let smartlinks: any[] = [];
  if (q) {
    smartlinks = await prisma.smartLink.findMany({
      where: {
        OR: [
          { id: q },
          { originalUrl: { contains: q, mode: "insensitive" } },
          { merchantName: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
        merchantRule: {
          select: {
            id: true,
            merchantName: true,
            network: true,
            commissionType: true,
            commissionRate: true,
          },
        },
        _count: {
          select: { clicks: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
        <header>
          <h1 className="text-xl font-semibold">SmartLink lookup</h1>
          <p className="mt-1 text-xs text-slate-400">
            Admin-only tool. Paste a <code className="font-mono">sub_id</code>{" "}
            from Involve Asia (or a SmartLink ID / product URL) to see which
            user owns it.
          </p>
        </header>

        <form className="flex flex-col gap-2 sm:flex-row" action="/admin/smartlinks">
          <input
            name="q"
            defaultValue={q}
            placeholder="SmartLink ID / sub_id / part of URL / merchant name"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-400"
          >
            Search
          </button>
        </form>

        {!q && (
          <p className="text-xs text-slate-500">
            Tip: paste the <code className="font-mono">sub_id</code> from IA
            (e.g. <code>cminfufni0001oip8bo6j97gg</code>) or a product URL.
          </p>
        )}

        {q && smartlinks.length === 0 && (
          <p className="text-xs text-slate-400">
            No SmartLinks found for <span className="font-mono">{q}</span>.
          </p>
        )}

        {smartlinks.length > 0 && (
          <div className="space-y-3">
            {smartlinks.map((sl) => (
              <article
                key={sl.id}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-xs"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-teal-300">
                      SmartLink ID: {sl.id}
                    </p>
                    <p className="text-xs text-slate-400">
                      Created:{" "}
                      {new Date(sl.createdAt).toLocaleString("en-PH", {
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-200">
                    Clicks: {sl._count?.clicks ?? 0}
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="font-semibold text-slate-200">Owner</p>
                    <p className="mt-0.5 text-slate-100">
                      {sl.user?.name || "(no name)"}{" "}
                      <span className="text-slate-400">
                        · {sl.user?.email || "no email"}
                      </span>
                    </p>
                    <p className="mt-0.5 text-slate-500">
                      User ID:{" "}
                      <span className="font-mono text-[10px]">
                        {sl.user?.id}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">Merchant</p>
                    <p className="mt-0.5 text-slate-100">
                      {sl.merchantRule?.merchantName || sl.merchantName || "—"}
                    </p>
                    <p className="mt-0.5 text-slate-400">
                      Network: {sl.merchantRule?.network || "—"}
                    </p>
                    {sl.merchantRule?.commissionType && (
                      <p className="mt-0.5 text-slate-400">
                        Commission: {sl.merchantRule.commissionType} @{" "}
                        {String(sl.merchantRule.commissionRate ?? "—")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <p className="font-semibold text-slate-200">Original URL</p>
                  <p className="break-all font-mono text-[10px] text-slate-300">
                    {sl.originalUrl}
                  </p>
                  <p className="mt-2 font-semibold text-slate-200">
                    Tracked outbound
                  </p>
                  <p className="break-all font-mono text-[10px] text-slate-300">
                    {sl.shortUrl}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
