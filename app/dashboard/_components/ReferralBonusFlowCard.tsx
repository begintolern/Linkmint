"use client";

import React from "react";

export default function ReferralBonusFlowCard() {
  const steps = [
    {
      title: "1. Invite 3 friends",
      body: "Share your unique invite link. When 3 friends successfully join, you unlock a 90-day bonus window.",
      tag: "Batch of 3",
    },
    {
      title: "2. 90-day bonus window starts",
      body: "As soon as your 3rd invite completes signup, your 90-day 5% bonus window starts counting down.",
      tag: "90 days",
    },
    {
      title: "3. Your friends earn their own commission",
      body: "Your friends share smartlinks and earn their own commissions at 70–85% depending on their tier.",
      tag: "Their earnings",
    },
    {
      title: "4. Commissions get approved",
      body: "When the affiliate network approves a purchase and funds arrive at linkmint.co, the commission becomes eligible for payout.",
      tag: "Approved only",
    },
    {
      title: "5. You earn 5% from Linkmint’s share",
      body: "For each approved commission your invited friends earn during your window, you get 5% on top. This comes from Linkmint’s margin, not from your friends’ earnings.",
      tag: "5% override",
    },
    {
      title: "6. Margin safety check",
      body: "If paying the 5% would break the minimum 15% platform margin (usually only at 85% tier on small commissions), the bonus for that specific commission may be skipped to keep the system safe.",
      tag: "Safety",
    },
    {
      title: "7. Window ends after 90 days",
      body: "When your 90 days end, the 5% bonus stops—unless you unlock a new window by inviting another batch of 3 friends.",
      tag: "Repeatable",
    },
  ];

  return (
    <section className="w-full max-w-3xl mx-auto rounded-2xl border border-gray-200 bg-white shadow-sm p-6 md:p-8">
      <header className="mb-6">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
          Referral Bonus Flow
        </h2>
        <p className="mt-2 text-sm md:text-base text-gray-600">
          Here&apos;s exactly how the{" "}
          <span className="font-semibold">5% referral bonus</span> works at
          linkmint.co – simple, fair, and fully transparent.
        </p>
      </header>

      <div className="grid gap-4">
        {steps.map((step, idx) => (
          <div
            key={step.title}
            className="relative flex gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 md:px-4 md:py-4"
          >
            {/* Step number bubble */}
            <div className="flex flex-col items-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
                {idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div className="mt-1 hidden h-full w-px flex-1 bg-gradient-to-b from-teal-500/40 to-transparent md:block" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm md:text-base font-semibold text-gray-900">
                  {step.title}
                </h3>
                {step.tag && (
                  <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700 border border-teal-100">
                    {step.tag}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs md:text-sm text-gray-700">
                {step.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Key guarantees */}
      <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
        <h4 className="text-sm font-semibold text-emerald-900">
          What you should remember
        </h4>
        <ul className="mt-2 space-y-1 text-xs md:text-sm text-emerald-900">
          <li>• Your friends keep their full 70–85% earnings. Nothing is taken from them.</li>
          <li>• Your 5% bonus comes from linkmint.co’s margin, not from your invitees.</li>
          <li>• Only approved commissions inside your 90-day window qualify.</li>
          <li>• The system will always protect at least 15% platform margin for stability.</li>
        </ul>
      </div>
    </section>
  );
}
