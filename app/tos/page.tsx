// app/tos/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Terms of Service</h1>
      <Link href="/tos/tl" className="text-sm underline text-gray-600">
        View Tagalog 🇵🇭
      </Link>

      <p className="mt-4 text-sm text-gray-700">
        Welcome to linkmint.co. By accessing or using our platform, you agree to
        the following terms and conditions. These Terms of Service (“Terms”)
        govern your use of the Linkmint website, services, and associated
        features (“Platform”).
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
      <p className="text-sm text-gray-700">
        By using linkmint.co, you confirm that you are at least 18 years old and
        capable of entering into legally binding agreements. If you are under 18,
        you may use Linkmint only under the supervision of a parent or legal
        guardian.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">2. Platform Purpose</h2>
      <p className="text-sm text-gray-700">
        Linkmint enables users to generate and share affiliate links to partner
        merchants. When people make purchases through your shared links, you may
        earn commissions as outlined in our payout policies.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">3. Earnings and Payouts</h2>
      <p className="text-sm text-gray-700">
        Commissions are credited only after the merchant confirms and releases
        payment to Linkmint. Payouts to users occur once affiliate funds are
        received, verified, and cleared. Early payouts, if offered, are subject
        to eligibility and TrustScore standing. PayPal and GCash fees, if any,
        will be deducted from the user’s payout amount.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">4. User Conduct</h2>
      <p className="text-sm text-gray-700">
        Users may not engage in fraudulent activity, self-buying, misleading
        advertising, or any conduct that violates affiliate program rules.
        Violations may result in suspension, forfeiture of earnings, or account
        termination.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">5. Termination</h2>
      <p className="text-sm text-gray-700">
        Linkmint reserves the right to suspend or terminate any account found in
        violation of these Terms or suspected of fraud or abuse. Outstanding
        earnings related to fraudulent activity will not be paid.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">6. Limitation of Liability</h2>
      <p className="text-sm text-gray-700">
        Linkmint is not liable for any indirect, incidental, or consequential
        damages arising from the use of the platform. Your use of the service is
        at your own risk.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">7. Changes to Terms</h2>
      <p className="text-sm text-gray-700">
        We may modify these Terms at any time. Updates will be posted on this
        page, and continued use of the platform after such changes constitutes
        acceptance of the updated Terms.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">8. Contact</h2>
      <p className="text-sm text-gray-700">
        For questions, please contact us at{" "}
        <a href="mailto:admin@linkmint.co" className="underline text-teal-600">
          admin@linkmint.co
        </a>
        .
      </p>

      <p className="text-xs text-gray-500 mt-8">
        Last updated: October 2025. These Terms are legally binding and governed
        by the laws of the Republic of the Philippines.
      </p>
    </div>
  );
}
