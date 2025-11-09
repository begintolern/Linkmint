"use client";

import { useState } from "react";

export default function PolicyCheckClient() {
  const [input, setInput] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const urlInput = input.trim();
    if (!urlInput) {
      setResult({ ok: false, error: "Missing URL" });
      return;
    }

    setLoading(true);
    setResult(null);
    setCopied(false);

    try {
      // Policy check
      const checkRes = await fetch("/api/policy-check/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: urlInput,
          description: description || "Policy check run",
        }),
      });
      const checkData = await checkRes.json();

      // SmartLink creation (accepts destinationUrl or url)
      const linkRes = await fetch("/api/smartlinks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationUrl: urlInput,
          description: description || "SmartLink created via PolicyCheck tool",
        }),
      });
      const linkData = await linkRes.json();

      setResult({ check: checkData, smartlink: linkData });
    } catch (err: any) {
      setResult({ ok: false, error: err.message || "Unknown error" });
    } finally {
      setLoading(false);
    }
  }

  async function copyShortUrl() {
    const url = result?.smartlink?.shortUrl;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // noop
    }
  }

  const shortUrl = result?.smartlink?.shortUrl as string | undefined;
  const merchant = result?.smartlink?.merchant as string | undefined;
  const domain = result?.smartlink?.domain as string | undefined;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Policy Pre-Check (AI-assisted)</h1>

      <p className="text-sm text-gray-600 mb-4">
        Paste a merchant product URL. We’ll run a quick policy check and create a SmartLink for you.
        Results are suggestions — not legal advice.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste merchant URL (e.g., https://www.lazada.com.ph/...)"
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
          {loading ? "Checking…" : "Run Policy Check"}
        </button>
      </form>

      {/* Smart output */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Quick summary card */}
          {(shortUrl || merchant) && (
            <div className="rounded-lg border p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Merchant</div>
                  <div className="font-medium">{merchant || "Unknown"}</div>
                  {domain && <div className="text-xs text-gray-500">{domain}</div>}
                </div>
                <div className="flex items-center gap-2">
                  {shortUrl && (
                    <>
                      <a
                        href={shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm rounded border px-3 py-1 hover:bg-gray-50"
                      >
                        Open
                      </a>
                      <button
                        onClick={copyShortUrl}
                        className="text-sm rounded border px-3 py-1 hover:bg-gray-50"
                      >
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </>
                  )}
                </div>
              </div>
              {shortUrl && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-500 mr-2">Short link:</span>
                  <code className="break-all">{shortUrl}</code>
                </div>
              )}
            </div>
          )}

          {/* Raw JSON (for debugging) */}
          <div className="border rounded bg-gray-50 p-3 text-xs overflow-x-auto">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
