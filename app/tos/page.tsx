// app/tos/page.tsx
export default function TermsOfServicePage() {
  return (
    <main className="prose mx-auto max-w-3xl px-6 py-10">
      <h1>Terms of Service</h1>
      <p>
        Welcome to <strong>linkmint.co</strong>. By using our platform, you agree
        to the following Terms of Service. Please read carefully before using
        our services.
      </p>

      <h2>1. Platform Purpose</h2>
      <p>
        linkmint.co provides tools to generate, track, and share promotional
        links from approved affiliate merchants. Users may earn commissions when
        purchases are completed through their links and approved by the merchant
        network.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old and legally capable of entering into a
        binding agreement in your jurisdiction. By using linkmint.co, you confirm
        your eligibility.
      </p>

      <h2>3. Commissions &amp; Payouts</h2>
      <ul>
        <li>
          Commissions are only credited when the merchant or affiliate network
          confirms and pays linkmint.co for the transaction.
        </li>
        <li>
          If a merchant <strong>voids, reverses, or denies</strong> a
          transaction, no commission will be paid to the user.
        </li>
        <li>
          Payouts to users are <strong>only made after linkmint.co has received
          cleared funds</strong> from the merchant. We do not advance payments.
        </li>
        <li>
          Merchants may take up to <strong>90 days</strong> to approve and release
          payment for commissions. Delays are outside of our control.
        </li>
        <li>
          A minimum payout threshold may apply (displayed in your dashboard).
        </li>
        <li>
          Payout methods are currently limited to PayPal. Transaction fees
          (including PayPal fees) are deducted from the payout.
        </li>
      </ul>

      <h2>4. User Responsibilities</h2>
      <p>
        Users must comply with all merchant and affiliate program rules. Any
        fraudulent activity, misuse of links, or violation of affiliate terms
        may result in suspension or permanent ban from linkmint.co, with
        forfeiture of unpaid commissions.
      </p>

      <h2>5. No Guarantee of Earnings</h2>
      <p>
        linkmint.co does not guarantee that you will earn commissions or income.
        Success depends on merchant approvals, traffic, and external factors.
      </p>

      <h2>6. Termination</h2>
      <p>
        We reserve the right to suspend or terminate any account at our sole
        discretion, particularly in cases of suspected fraud or policy
        violations.
      </p>

      <h2>7. Limitation of Liability</h2>
      <p>
        linkmint.co is not liable for lost profits, delayed payments, voided
        transactions, or other indirect damages. Our maximum liability is
        limited to the unpaid commission balance in your account.
      </p>

      <h2>8. Modifications</h2>
      <p>
        We may update these Terms of Service from time to time. Continued use of
        the platform after changes are posted constitutes acceptance of the new
        terms.
      </p>

      <h2>9. Contact</h2>
      <p>
        For questions, please contact us at{" "}
        <a href="mailto:admin@linkmint.co">admin@linkmint.co</a>.
      </p>
    </main>
  );
}
