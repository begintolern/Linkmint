"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function SmartLinkGenerator() {
  const [url, setUrl] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/smartlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();

      if (!json.ok) throw new Error(json.error || "Failed to create link");

      // ✅ Success toast
      toast.success("Smart link created!");

      // reset field
      setUrl("");
    } catch (err: any) {
      toast.error(err.message || "Error creating link");
    } finally {
      setCreating(false);
    }
  }

  return (
    <form
      onSubmit={handleCreate}
      className="rounded-lg border bg-white p-4 shadow-sm flex gap-3"
    >
      <input
        type="url"
        placeholder="Paste a product URL (Amazon, CJ, etc.)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="flex-1 border rounded px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={creating}
        className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
      >
        {creating ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
