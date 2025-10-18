// app/admin/enter-key/page.tsx
"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function Page() {
  // Wrap the form in Suspense so useSearchParams() is safe
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading…</div>}>
      <EnterKeyForm />
    </Suspense>
  );
}

function EnterKeyForm() {
  const [key, setKey] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const sp = useSearchParams();
  const router = useRouter();

  const next = sp?.get("next") || "/admin/maintenance";

  async function submit() {
    setErr(null);
    const r = await fetch("/api/admin/set-key", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key }),
    });
    const res = await r.json().catch(() => ({} as any));
    if (res?.ok) {
      router.replace(next);
    } else {
      setErr(res?.error || "Invalid key");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">Admin Access</h1>
        <p className="mt-1 text-xs text-gray-500">Enter your admin key to continue.</p>

        <label className="mt-4 block text-xs text-gray-700">
          <span className="mb-1 block">Admin Key</span>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="ADMIN_API_KEY"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </label>

        {err && <p className="mt-3 text-xs text-red-600">{err}</p>}

        <button
          onClick={submit}
          className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Continue
        </button>
      </div>
    </main>
  );
}
