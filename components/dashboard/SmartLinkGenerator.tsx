// components/dashboard/SmartLinkGenerator.tsx
"use client";

import { useState } from "react";

type Merchant = {
  id: string;
  merchantName: string;
  status: "PENDING" | "ACTIVE" | "REJECTED";
  active: boolean;
};

async function getMerchantByName(name: string): Promise<Merchant | null> {
  try {
    const res = await fetch("/api/public/merchants?all=true", { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const merchants: Merchant[] = json.merchants ?? [];
    const match = merchants.find(
      (m) => m.merchantName.toLowerCase() === name.trim().toLowerCase()
    );
    return match ?? null;
  } catch {
    return null;
  }
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

export default function SmartLinkGenerator() {
  const [merchantName, setMerchantName] = useState("");
  const [rawUrl, setRawUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setResultUrl(null);

    const name = merchantName.trim();
    if (!name) {
      setErr("Please enter a merchant name.");
      return;
    }
    if (!rawUrl.trim()) {
      setErr("Please paste a product/merchant URL.");
      return;
    }

    setLoading(true);
    try {
      // ✅ Check merchant status before generating
      const m = await getMerchantByName(name);
      if (!m) {
        setErr("Merchant not found. Try selecting one from the list first.");
        return;
      }
      const isActive = m.status === "ACTIVE" && m.active;
      if (!isActive) {
        setErr(
          m.status === "PENDING"
            ? "This merchant is pending approval. You’ll be able to create links once it’s approved."
            : "This merchant is not available (rejected/disabled). Please pick a different merchant."
        );
        return;
      }

      // 🔗 Call your existing API to build a Smart Link (provision stub is okay)
      const res = await fetch("/api/smartlinks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: rawUrl }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to generate link");
      }
      const json = await res.json();
      const link = json?.link ?? json?.shortUrl ?? null;

      if (!link) {
        setErr("No link returned by the server.");
        return;
      }

      setResultUrl(link);
      const ok = await copy(link);
      showToast(ok ? "Smartlink copied ✅" : "Link ready — click to copy.");

    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative rounded-2xl border bg-white p-4 shadow-sm">
      {/* toast */}
      {toast && (
        <div className="absolute right-4 top-4 rounded-lg border bg-white px-3 py-1.5 text-xs shadow">
          {toast}
        </div>
      )}

      <form onSubmit={handleGenerate} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm block mb-1">Merchant name</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g., The Original Muck Boot Company"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm block mb-1">Product / merchant URL</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Paste a URL to convert"
              value={rawUrl}
              onChange={(e) => setRawUrl(e.target.value)}
            />
          </div>
        </div>

        {err && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            {err}
          </div>
        )}

        {resultUrl && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg break-all">
            Link created:{" "}
            <button
              type="button"
              onClick={() => copy(resultUrl).then((ok) => showToast(ok ? "Copied ✅" : "Copy failed"))}
              className="underline"
              title="Copy to clipboard"
            >
              {resultUrl}
            </button>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-lg border ${
              loading ? "bg-gray-200 text-gray-500" : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            {loading ? "Generating..." : "Generate Smart Link"}
          </button>
        </div>
      </form>
    </div>
  );
}

