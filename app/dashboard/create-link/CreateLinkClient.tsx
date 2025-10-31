// app/dashboard/create-link/CreateLinkClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CreateResponse = {
  ok: boolean;
  id?: string;
  error?: string;
  shortUrl?: string;
  merchant?: string;
};

const PH_MERCHANTS = [
  { id: "cmfvvoxsj0000oij8u4oadeo5", name: "Lazada PH" },
  { id: "cmfu940920003oikshotzltnp", name: "Shopee" },
];

export default function CreateLinkClient() {
  const router = useRouter();
  const [productUrl, setProductUrl] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const res = await fetch("/api/smartlinks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId,
          destinationUrl: productUrl,
          source: "dashboard",
        }),
      });

      const data: CreateResponse = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to create link");

      router.push("/dashboard/smart-links");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">Create Smart Link</h1>

      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Merchant</label>
          <select
            value={merchantId}
            onChange={(e) => setMerchantId(e.target.value)}
            required
            className="w-full border rounded p-2"
          >
            <option value="">Select merchant...</option>
            {PH_MERCHANTS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Product URL</label>
          <input
            type="url"
            required
            placeholder="https://www.lazada.com.ph/..."
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          {busy ? "Creating..." : "Create Link"}
        </button>
      </form>
    </div>
  );
}
