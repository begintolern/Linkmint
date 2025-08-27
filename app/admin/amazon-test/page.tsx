'use client';

import React from 'react';

export default function AmazonTestPage() {
  const [asin, setAsin] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [resultUrl, setResultUrl] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  async function getLink(e?: React.FormEvent) {
    e?.preventDefault();
    const a = asin.trim();
    if (!a) {
      setErr('Enter an ASIN (e.g., B09V21IWHK).');
      return;
    }
    setLoading(true);
    setErr(null);
    setCopied(false);
    setResultUrl(null);
    try {
      const res = await fetch(`/api/amazon/link?asin=${encodeURIComponent(a)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to generate link');
      setResultUrl(json.url as string);
    } catch (e: any) {
      setErr(e.message || 'Server error');
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!resultUrl) return;
    try {
      await navigator.clipboard.writeText(resultUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErr('Could not copy to clipboard');
    }
  }

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-semibold">Amazon · Link Generator (No PA‑API)</h1>

      <form onSubmit={getLink} className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">ASIN</label>
          <input
            value={asin}
            onChange={(e) => setAsin(e.target.value)}
            placeholder="e.g., B09V21IWHK"
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {loading ? 'Generating…' : 'Generate Tagged Link'}
        </button>
      </form>

      {err && <div className="text-red-700 text-sm">{err}</div>}

      {resultUrl && (
        <div className="space-y-3">
          <div className="text-sm">
            <span className="font-medium">Tagged URL:</span>
            <div className="mt-1 break-all border rounded p-3 bg-gray-50">{resultUrl}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyLink}
              className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <a
              href={resultUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Open in New Tab
            </a>
          </div>
          <p className="text-xs text-gray-600">
            Tip: Open in an incognito window to test the redirect. Any purchase through this URL
            will credit your tag <code>linkmint20-20</code>.
          </p>
        </div>
      )}
    </div>
  );
}
