// app/admin/layout.tsx
import "@/app/globals.css";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = (await getServerSession(authOptions)) as any;
  const isAuthed = Boolean(session?.user?.id);

  return (
    <div className="min-h-screen flex">
      {isAuthed ? (
        <aside className="w-64 shrink-0 border-r bg-white">
          <div className="p-4 font-semibold">Admin</div>
          <nav className="px-4 space-y-2 text-sm">
            <Link href="/admin/users" className="block hover:underline">
              Users
            </Link>
            <Link href="/admin/referrals" className="block hover:underline">
              Referrals
            </Link>
            <Link href="/admin/payouts" className="block hover:underline">
              Payouts
            </Link>
            <Link href="/admin/logs" className="block hover:underline">
              Logs
            </Link>
            <Link href="/admin/settings" className="block hover:underline">
              Settings
            </Link>
          </nav>
          <div className="mt-auto p-4">
            {/* Sign out only when authenticated */}
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-red-600 hover:underline"
              >
                Log out
              </button>
            </form>
          </div>
        </aside>
      ) : null}

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
