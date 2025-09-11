// app/admin/waitlist/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options"; // ✅ fixed import
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminWaitlist() {
  // ✅ Only allow ADMIN role
  const session = (await getServerSession(authOptions)) as any;
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const [total, rows] = await Promise.all([
    prisma.waitlist.count(),
    prisma.waitlist.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Waitlist</h1>
        <p className="text-sm text-gray-600">Total collected: {total}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Source</th>
              <th className="py-3 px-4">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-3 px-4">{r.email}</td>
                <td className="py-3 px-4">{r.source ?? "-"}</td>
                <td className="py-3 px-4">
                  {new Date(r.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="py-6 px-4 text-gray-500" colSpan={3}>
                  No entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
