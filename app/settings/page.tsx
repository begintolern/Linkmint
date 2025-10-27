// app/settings/page.tsx
export const runtime = "nodejs";         // ensure Prisma uses Node TLS
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function SettingsPage() {
  const session = (await getServerSession(authOptions as any)) as any;

  if (!session?.user?.email) {
    return (
      <main className="min-h-screen bg-white text-gray-900">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <h1 className="text-xl font-semibold mb-2">Settings</h1>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You need to be signed in to view your settings.
          </div>
          <div className="mt-4">
            <Link
              href="/login"
              className="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email as string },
    select: {
      id: true,
      email: true,
      name: true,
      defaultPayoutMethod: true, // ignore if missing in schema
    },
  });

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6">
        {!me ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            We couldn’t load your account. Please sign out and sign in again.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card title="Account">
              <Field label="Name" value={me.name || "—"} />
              <Field label="Email" value={me.email || "—"} />
              {"defaultPayoutMethod" in me && (
                <Field
                  label="Default payout"
                  value={(me as any).defaultPayoutMethod || "—"}
                />
              )}
            </Card>

            <Card title="Security">
              <p className="text-sm text-gray-600">
                For your security, password and login methods are managed in the
                authentication provider.
              </p>
              <div className="mt-3">
                <Link
                  href="/logout"
                  className="inline-block rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Sign out
                </Link>
              </div>
            </Card>
          </div>
        )}
      </section>
    </main>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
