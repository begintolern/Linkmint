"use client";

import { useState } from "react";

export default function PolicyCheckClient() {
  const [input, setInput] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const urlInput = input.trim();
    if (!urlInput) {
      setResult({ ok: false, error: "Missing URL" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // --- Policy check first
      const checkRes = await fetch("/api/policy-check/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: urlInput,
          description: description || "Policy check run",
        }),
      });

      const checkData = await checkRes.json();
      console.log("Policy check result:", checkData);

      // --- SmartLink creation
      const linkRes = await fetch("/api/smartlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: urlInput,
          description: description || "SmartLink created via PolicyCheck tool",
        }),
      });

      const linkData = await linkRes.json();
      console.log("SmartLink creation result:", linkData);

      setResult({
        check: checkData,
        smartlink: linkData,
      });
    } catch (err: any) {
      console.error("Error:", err);
      setResult({ ok: false, error: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Policy Pre-Check (AI-assisted)
      </h1>

      <p className="text-sm text-gray-600 mb-4">
        Paste your link title/description. We’ll flag common merchant/network
        risks (gift cards, coupon stacking, self-purchase, etc.). Results are
        suggestions — not legal advice.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste merchant URL (e.g. Shopee product link)"
          className="w-full border rounded p-2 text-sm"
        />

        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description (optional)"
          className="w-full border rounded p-2 text-sm"
        />

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Checking..." : "Run Policy Check"}
        </button>
      </form>

      {result && (
        <div className="mt-6 border-t pt-4 text-sm">
          <h2 className="font-medium mb-2">Result:</h2>
          <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
