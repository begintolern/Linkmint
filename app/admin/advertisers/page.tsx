// app/admin/advertisers/page.tsx
import { PrismaClient, AdvertiserApplication } from "@prisma/client";

const prisma = (globalThis as any).prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") (globalThis as any).prisma = prisma;

export const dynamic = "force-dynamic";

export default async function AdvertisersPage() {
  const rows: AdvertiserApplication[] = await prisma.advertiserApplication.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Advertiser Applications</h1>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Advertiser</th>
              <th className="text-left p-3">Advertiser ID</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Applied</th>
              <th className="text-left p-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: AdvertiserApplication) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.name}</td>
                <td className="p-3">{r.advertiserId}</td>
                <td className="p-3 capitalize">
                  <span
                    className={
                      "px-2 py-1 rounded text-xs " +
                      (r.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : r.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-700")
                    }
                  >
                    {r.status}
                  </span>
                </td>
                <td className="p-3">
                  {r.appliedAt
                    ? new Date(r.appliedAt).toLocaleString()
                    : "—"}
                </td>
                <td className="p-3">
                  {r.updatedAt
                    ? new Date(r.updatedAt).toLocaleString()
                    : "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan={5}>
                  No applications yet. Run the sync or apply to advertisers.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form
        action="/api/admin/rakuten/sync"
        method="post"
        className="mt-4 flex items-center gap-2"
      >
        <input type="hidden" name="status" value="PENDING" />
        <button
          type="submit"
          className="px-3 py-2 rounded bg-black text-white text-sm"
        >
          Sync Pending from Rakuten
        </button>
      </form>
    </main>
  );
}
