// app/trust/legitimacy/page.tsx
export const dynamic = "force-dynamic";

export default function LegitimacyPage() {
  return (
    <>
      {/* SEO: Google FAQ Schema for rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Is Linkmint.co legit?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text":
                    "Yes. Linkmint.co is a real micro-affiliate platform with verified payouts via PayPal. It automates affiliate sharing for everyday users and does not require any investment or MLM activity."
                }
              }
            ]
          }),
        }}
      />

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-gray-800">
        <section>
          <h1 className="text-3xl font-bold mb-4">Is Linkmint.co Legit?</h1>
          <p className="text-lg">
            If you’re searching <strong>“legit ba ang Linkmint?”</strong> — good news,
            you’re in the right place. We get this question a lot, especially from new
            users who want to be sure before sharing their first link.
          </p>
          <p className="mt-4">
            ✅ <strong>Yes — Linkmint.co is a real, operating micro-affiliate platform.</strong>{" "}
            It was built to help ordinary people earn small but real commissions by
            sharing verified product links from trusted merchants like Lazada, Shopee,
            and Rakuten. Every peso that appears in your dashboard comes from{" "}
            <strong>actual affiliate sales</strong> that merchants approve and send to
            Linkmint first. We only pay out what we receive — nothing hidden, no
            “investment” or get-rich-quick tricks.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-3">Who runs Linkmint?</h2>
          <p>
            Linkmint is powered by <strong>Linkmint Technologies</strong>, an independent
            digital platform created and managed by its founding team. We use{" "}
            <strong>PayPal’s verified business system</strong> for all payouts to keep
            every transaction traceable and safe. Our contact email is{" "}
            <a
              href="mailto:admin@linkmint.co"
              className="text-blue-600 hover:underline"
            >
              admin@linkmint.co
            </a>
            , and we respond to all support messages directly.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-3">How the system works</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>You share a “smart link” created inside your dashboard.</li>
            <li>Someone clicks and buys from an approved merchant.</li>
            <li>The merchant reports the sale → sends commission to Linkmint.</li>
            <li>
              Once the payment clears (usually 30 days), you can request your payout.
            </li>
          </ol>
          <p className="mt-4">
            All commissions go through the same networks used by big creators — we just
            automate the process for everyday users.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-3">Why we built it</h2>
          <p>
            Because affiliate programs were designed for influencers, not for regular
            people. Linkmint flips that: anyone with friends, classmates, or online
            circles can earn from honest recommendations — no ads, no spam.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-3">Our promise</h2>
          <p>
            We operate with <strong>transparency, fairness, and verified payouts.</strong>{" "}
            All fees (like PayPal deductions) are shown on your dashboard. If you ever
            doubt a transaction, you can contact us — we’ll provide the affiliate proof
            or correct the entry if needed.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-3">Bottom line</h2>
          <p>
            <strong>
              Linkmint.co is not an investment, not an MLM, and not a scam.
            </strong>{" "}
            It’s a growing community of sharers turning real clicks into real income —
            slowly, honestly, and with full visibility.
          </p>
        </section>

        <footer className="text-sm text-gray-500 mt-10">
          Updated November 2025 — This statement is part of Linkmint’s public Trust
          Center. You may share or quote this page when asked about Linkmint’s
          legitimacy.
        </footer>
      </main>
    </>
  );
}
