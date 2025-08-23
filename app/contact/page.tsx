// app/contact/page.tsx
"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"IDLE"|"SENDING"|"OK"|"ERR">("IDLE");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("SENDING");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed");
      setStatus("OK");
      setName(""); setEmail(""); setMessage("");
    } catch (err) {
      setStatus("ERR");
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Contact Us</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            className="mt-1 w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Message</label>
          <textarea
            className="mt-1 w-full border rounded px-3 py-2"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={status === "SENDING"}
          className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
        >
          {status === "SENDING" ? "Sending…" : "Send"}
        </button>

        {status === "OK" && (
          <p className="text-green-600 text-sm">Thanks! We’ll get back to you soon.</p>
        )}
        {status === "ERR" && (
          <p className="text-red-600 text-sm">Something went wrong. Please try again.</p>
        )}
      </form>
    </div>
  );
}
