// app/faq/page.tsx
"use client";

import { useEffect, useRef } from "react";

function Section({
  id,
  title,
  children,
  defaultOpen = false,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const ref = useRef<HTMLDetailsElement | null>(null);

  // Set initial open state (uncontrolled) on mount
  useEffect(() => {
    if (ref.current && defaultOpen) {
      ref.current.open = true;
    }
  }, [defaultOpen]);

  // If navigated with #hash, auto-open and scroll into view
  useEffect(() => {
    if (!id || !ref.current) return;
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (hash === id) {
      ref.current.open = true;
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }, [id]);

  return (
    <details ref={ref} id={id} className="rounded-xl border bg-white p-4 shadow-sm transition">
      <summary className="cursor-pointer list-none select-none">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <span className="ml-4 text-gray-500">▼</span>
        </div>
      </summary>
      <div className="mt-3 text-gray-700">{children}</div>
    </details>
  );
}

export default function FAQPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">FAQ</h1>
      <p className="text-gray-600">Quick answers about Linkmint’s referrals, commissions, payouts, and compliance.</p>

      <div className="grid gap-4">
        <Section title="General" defaultOpen>
          <ul className="list-disc pl-5 space-y-1">
            <li>Linkmint helps creators and partners track commissions, referrals, and payouts in one place.</li>
            <li>Accounts must be verified before participating in referral programs or receiving payouts.</li>
          </ul>
        </Section>

        <Section title="Referral Policy">
          <ul className="list-disc pl-5 space-y-1">
            <li>Inviting 3 verified accounts within 90 days activates referral bonuses.</li>
            <li>Batches expire after 90 days if not fully verified.</li>
            <li>Referral overrides provide 5% of invitee commissions during the active window.</li>
          </ul>
        </Section>

        {/* Anchor matches /faq#payout-policy */}
        <Section id="payout-policy" title="Payout Policy">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Payouts progress through stages: <strong>Pending → Approved → Paid</strong>.
            </li>
            <li>A clearance period allows attribution and fraud checks before approval.</li>
            <li>Payouts can be processed automatically (admin toggle) or via manual approval.</li>
            <li>PayPal and ACH supported; standard processor fees may apply.</li>
            <li>All payout events are logged for audit and reconciliation.</li>
          </ul>
        </Section>

        <Section title="Compliance">
          <ul className="list-disc pl-5 space-y-1">
            <li>Automated flags detect abnormal click/purchase patterns.</li>
            <li>Admins can review events and reverse payouts in edge cases.</li>
            <li>Fraudulent activity may result in batch cancellation and forfeiture of payouts.</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
