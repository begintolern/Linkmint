// app/disclosure/page.tsx
export const dynamic = "force-static";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclosure",
  description:
    "How linkmint.co makes money, how commissions work, and what you should expect when you click or purchase through our links.",
  alternates: { canonical: "/disclosure" },
};

export default function DisclosurePage() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-10 prose prose-slate">
      <h1 className="!mb-2">Disclosure</h1>
      <p className="text-sm text-gray-500 !mt-0">Last updated: {new Date().toLocaleDateString()}</p>

      <h2>Plain-English summary</h2>
      <p>
        linkmint.co is an affiliate-link platform. When you click a link we host and then buy something,
        the merchant may pay a commission. That commission never changes your price. We show clear labels
        so you know when a link can earn.
      </p>

      <h2>How it works</h2>
      <ul>
        <li>
          <strong>Smart links:</strong> Our users generate “smart links” that point to merchant pages
          (e.g., product detail pages). When a purchase is confirmed by the merchant or network, a
          commission is recorded.
        </li>
        <li>
          <strong>No extra cost:</strong> The purchase price you see at the merchant is the same whether
          or not a link earns a commission.
        </li>
        <li>
          <strong>Timing:</strong> Many merchants take time (often 7–45 days) to approve commissions
          to account for returns, fraud checks, and policy review.
        </li>
        <li>
          <strong>Payouts to sharers:</strong> After commissions are approved and funds are received from
          the network/merchant, eligible users can request payout (see our “Trust Center” and “Payouts”
          pages for timing and rules).
        </li>
      </ul>

      <h2>Our relationships</h2>
      <p>
        We participate in multiple affiliate programs and networks. Examples include:
      </p>
      <ul>
        <li>Marketplace programs (e.g., Lazada, Shopee) via their official affiliate programs or approved networks.</li>
        <li>General affiliate networks (e.g., impact.com, CJ, Rakuten, and others as onboarded).</li>
      </ul>
      <p>
        Each program has its own rules. If a merchant or network disallows a category (e.g., gift cards,
        coupon stacking, self-purchase), we aim to block or flag it in our tools. Final approval is always
        the merchant/network’s decision.
      </p>

      <h2>Disclosures you’ll see on linkmint.co</h2>
      <ul>
        <li>
          <strong>“This link can earn a commission.”</strong> Placed near shareable links and on pages
          where users create or view smart links.
        </li>
        <li>
          <strong>“Commission pending/approved.”</strong> Appears in dashboard areas and admin views to
          clarify status.
        </li>
      </ul>

      <h2>Example scenarios</h2>
      <ul>
        <li>
          <strong>Product review → purchase:</strong> You read a user’s mini-review and click the link to
          a merchant. If you buy, a commission may be paid to linkmint.co and the sharer.
        </li>
        <li>
          <strong>Coupon code applied:</strong> If the merchant pays commission with coupons, the purchase
          may still qualify. Some merchants disallow coupon + affiliate combo; in that case, no commission
          is paid.
        </li>
        <li>
          <strong>Return/refund:</strong> If you return your item, the commission is usually voided.
        </li>
      </ul>

      <h2>Editorial independence</h2>
      <p>
        linkmint.co provides tools that let users share links. We do not accept payment to alter prices at
        merchants, and we don’t inflate or change merchant pricing. Recommendations by users are their own.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this disclosure? Email <a href="mailto:admin@linkmint.co">admin@linkmint.co</a>.
      </p>

      <hr />

      <p className="text-xs text-gray-500">
        Note: We may update program participation and wording as merchants or networks change their rules.
        When that happens, we’ll update this page and adjust our tools.
      </p>
    </main>
  );
}
