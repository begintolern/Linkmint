export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function TermsPage() {
  const updated = new Date().toISOString().slice(0, 10);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-sm text-gray-500">Last updated: {updated}</p>

      <p>
        These Terms of Service (“Terms”) govern your access to and use of
        <strong> Linkmint</strong> (“we”, “us”, “our”) and any related websites,
        applications, and services (collectively, the “Service”). By accessing or
        using the Service, you agree to be bound by these Terms.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">1) Eligibility</h2>
        <p>
          You must be at least 18 years old and capable of forming a binding
          contract. You may use the Service only in compliance with these Terms
          and all applicable laws and regulations.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">2) Accounts & Verification</h2>
        <p>
          You’re responsible for your account and for maintaining the security of
          your login credentials. We may require identity or email verification
          and may suspend or terminate accounts that fail verification or appear
          to be engaged in fraud or abuse.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">3) Use of the Service</h2>
        <p>
          You agree to use the Service only for lawful purposes and in accordance
          with these Terms. You will not (a) interfere with or disrupt the
          Service; (b) reverse engineer or scrape non-public areas; (c) submit
          fraudulent, misleading, or harmful content or traffic; (d) violate
          affiliate network rules, advertiser policies, or applicable law.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">
          4) Affiliate Links, Tracking & Earnings
        </h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            The Service may provide referral or affiliate links. We and users may
            receive commissions for qualifying actions from advertisers or
            networks.
          </li>
          <li>
            Tracking depends on third-party cookies, pixels, SubIDs, postbacks,
            and advertiser/network systems. We do not guarantee tracking or
            attribution when third-party systems fail, are blocked, or change.
          </li>
          <li>
            Earnings are estimates until confirmed by the applicable network or
            advertiser and are subject to adjustment, reversal, holdback, and
            compliance review.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">5) Payouts</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            Payout timing and eligibility depend on network/advertiser payments,
            fraud checks, and minimum thresholds. See our{" "}
            <a className="text-blue-600 underline" href="/payouts">
              Payout Policy
            </a>
            .
          </li>
          <li>
            We may pause payouts and/or adjust balances if we detect suspected
            fraud, abuse, policy violations, or unconfirmed/withheld earnings.
          </li>
          <li>
            You are responsible for providing accurate payout details and for any
            fees charged by payment providers (e.g., PayPal).
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">
          6) Chargebacks, Reversals & Compliance Holds
        </h2>
        <p>
          Advertisers and networks may reverse transactions, hold funds, or
          reject traffic. We may reflect such adjustments in your balance. We may
          delay or deny payouts until investigations are complete.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">7) Prohibited Conduct</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Fraudulent clicks, fake leads, or cookie stuffing</li>
          <li>Misleading claims, false advertising, or brand infringement</li>
          <li>Malware, spam, scraping, or unauthorized access</li>
          <li>Activities violating laws, advertiser policies, or network terms</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">8) Intellectual Property</h2>
        <p>
          The Service, including content and software, is owned by us or our
          licensors and is protected by intellectual property laws. You receive a
          limited, non-exclusive, non-transferable license to use the Service in
          accordance with these Terms.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">9) Privacy</h2>
        <p>
          Our{" "}
          <a className="text-blue-600 underline" href="/privacy">
            Privacy Policy
          </a>{" "}
          explains how we collect and use information. By using the Service, you
          consent to those practices.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">10) Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED “AS IS” WITHOUT WARRANTIES OF ANY KIND.
          WE DISCLAIM ALL IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not warrant continuous,
          error-free operation, or guaranteed earnings or payouts.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">11) Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY
          INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR
          ANY LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL, ARISING OUT OF OR
          RELATED TO YOUR USE OF THE SERVICE.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">12) Indemnification</h2>
        <p>
          You agree to indemnify and hold us harmless from any claims, damages,
          liabilities, and expenses arising from your use of the Service or your
          violation of these Terms.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">13) Suspension & Termination</h2>
        <p>
          We may suspend or terminate access to the Service at any time for any
          reason, including suspected fraud, abuse, or policy violations. Upon
          termination, your right to use the Service ceases immediately.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">14) Governing Law</h2>
        <p>
          These Terms are governed by the laws of [Your State/Country], without
          regard to conflict of laws principles. The exclusive venue for disputes
          shall be the courts located in [Your Venue].
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">15) Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. Changes are effective when
          posted. Your continued use of the Service signifies acceptance of the
          updated Terms.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">16) Contact</h2>
        <p>
          Email: <a className="text-blue-600 underline" href="mailto:support@linkmint.co">support@linkmint.co</a>
          <br />
          Address: Linkmint, [Your Business Address]
        </p>
      </section>
    </main>
  );
}
