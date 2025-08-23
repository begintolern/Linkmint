export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function ContactPage() {
  const updated = new Date().toISOString().slice(0, 10);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <p className="text-sm text-gray-500">Last updated: {updated}</p>

      <section className="space-y-3">
        <p>
          We’re here to help. Reach out for support, partnership inquiries, or
          general questions.
        </p>

        <div className="rounded-lg border p-4 bg-white">
          <h2 className="text-lg font-semibold mb-2">Primary Contact</h2>
          <p>
            Email:{" "}
            <a className="text-blue-600 underline" href="mailto:support@linkmint.co">
              support@linkmint.co
            </a>
          </p>
          <p>
            Address: Linkmint, <span className="text-gray-600">[Your Business Address]</span>
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Send us a message</h2>
        {/* Simple non-auth form that emails via mailto fallback for now */}
        <form
          className="space-y-4"
          action="mailto:support@linkmint.co"
          method="post"
          encType="text/plain"
        >
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">
              Your name
            </label>
            <input
              id="name"
              name="name"
              required
              className="w-full rounded-md border px-3 py-2"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md border px-3 py-2"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="message">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              className="w-full rounded-md border px-3 py-2"
              placeholder="How can we help?"
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-black text-white px-4 py-2 hover:opacity-90"
            title="This uses your email client (mailto) for now."
          >
            Send
          </button>
        </form>

        <p className="text-xs text-gray-500">
          Submitting opens your email client (mailto). For direct support, email{" "}
          <a className="text-blue-600 underline" href="mailto:support@linkmint.co">
            support@linkmint.co
          </a>.
        </p>
      </section>
    </main>
  );
}
