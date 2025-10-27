// app/admin/settings/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_KEY_NAME = "admin_key";

export default async function AdminSettingsPage() {
  // Check admin cookie (middleware also enforces this, but we render-friendly guard here)
  const cookieStore = await cookies();
  const cookieKey = cookieStore.get(ADMIN_KEY_NAME)?.value;
  const envKey = process.env.ADMIN_API_KEY || "";

  if (!envKey || cookieKey !== envKey) {
    // No valid admin cookie → send to enter-key
    redirect("/admin/enter-key?next=/admin/settings");
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <h1 className="text-lg font-semibold">Admin · Settings</h1>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card title="Access">
            <Row label="Admin key cookie">
              <Badge ok={cookieKey === envKey}>
                {cookieKey === envKey ? "Present" : "Missing"}
              </Badge>
            </Row>
            <Row label="ADMIN_API_KEY in env">
              <Badge ok={!!envKey}>{envKey ? "Set" : "Not set"}</Badge>
            </Row>
          </Card>

          <Card title="Cron">
            <Row label="CRON_SECRET in env">
              <Badge ok={!!process.env.CRON_SECRET}>
                {process.env.CRON_SECRET ? "Set" : "Not set"}
              </Badge>
            </Row>
          </Card>
        </div>

        <div className="mt-8">
          <a
            href="/admin/enter-key?next=/admin/settings"
            className="inline-block rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Update admin key cookie
          </a>
        </div>
      </section>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-600">{label}</span>
      <span>{children}</span>
    </div>
  );
}

function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`rounded-md px-2 py-1 text-xs font-medium ${
        ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
      }`}
    >
      {children}
    </span>
  );
}
