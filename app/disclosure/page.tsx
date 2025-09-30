// app/disclosure/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export const metadata = {
  title: "Affiliate Disclosure | linkmint.co",
  description:
    "Transparency about how Linkmint earns commission from partner merchants and affiliate networks.",
};

export default function DisclosurePage() {
  const updated = new Date().toISOString().slice(0, 10);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Earnings & FTC Disclosure</h1>
      <p className="text-sm text-gray-500">Last updated: {updated}</p>

      <p>
        <strong>Linkmint</strong> participates in affiliate programs. This means we may earn a
        commission when users click links and complete qualifying actions (such as purchases or
        sign-ups) with partner advertisers or networks. There is <em>no additional cost</em> to you.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">What This Means</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            Some links on our site and in our app are tracking links. If you click them and take a
            qualifying action, we may receive a commission.
          </li>
          <li>Commissions are paid by advertisers/networks and do not increase your price.</li>
          <li>
            Earnings shown in the dashboard are estimates until confirmed by the applicable
            advertiser or network and may be adjusted or reversed.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Integrity & Independence</h2>
        <p>
          We aim to present accurate information and fairly represent partner offers. Compensation
          may influence placement or availability of offers, but it does not change our commitment
          to transparency.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">User Earnings</h2>
        <p>
          Users may receive a portion of qualifying commissions according to our payout policy and
          any applicable program rules. Amounts are subject to advertiser/network confirmation,
          fraud checks, holdbacks, and compliance review.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Offer Accuracy & Changes</h2>
        <p>
          We strive for accuracy, but offers can change without notice. Always check the merchant’s
          site for current price, terms, and eligibility before you purchase or sign up.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Transparency & Your Privacy</h2>
        <p>
          For more details on how Linkmint works, please review our{" "}
          <Link href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Questions</h2>
        <p>
          If you have questions about our disclosures or how affiliate commissions work, contact us
          at{" "}
          <a className="text-blue-600 underline" href="mailto:support@linkmint.co">
            support@linkmint.co
          </a>
          .
        </p>
      </section>
    </main>
  );
}
