"use client";

import { useState } from "react";

export default function SmartLinkGenerator() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [program, setProgram] = useState<"amazon" | "cj">("amazon");

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/smartlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, program }),
      });

      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Failed to generate link");
      } else {
        setResult(json.link);
      }
    } catch (err) {
      setError("Server error, try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl p-5 border border-gray-200 shadow-sm bg-white">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Generate Smart Link</h2>
        <select
          value={program}
          onChange={(e) => setProgram(e.target.value as "amazon" | "cj")}
          className="text-sm border rounded px-2 py-1"
        >
          <option value="amazon">Amazon Associates</option>
          <option value="cj">CJ Affiliate</option>
        </select>
      </div>

      <input
        type="text"
        placeholder="Paste a product URL from Amazon or CJ"
        className="w-full border rounded px-3 py-2 mb-3 text-sm"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <button
        onClick={handleGenerate}
        disabled={loading || !url}
        className={`px-4 py-2 rounded text-white ${
          loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      >
        {loading ? "Generating..." : "Generate"}
      </button>

      {error && (
        <div className="mt-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-3 text-sm text-green-700 bg-green-100 border border-green-200 rounded p-2">
          ✅ Smart link generated:{" "}
          <a href={result} target="_blank" rel="noopener noreferrer" className="underline">
            {result}
          </a>
        </div>
      )}
    </div>
  );
}
