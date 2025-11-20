// app/referrals/page.tsx
export const dynamic = "force-dynamic";

export default function PublicReferralsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      {/* Hero */}
      <header className="text-center">
        <h1 className="text-3xl font-bold">Linkmint Referral Program</h1>
        <p className="mt-3 text-slate-600">
          Invite friends to linkmint.co. When they earn, you earn a bonus on top.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Every <strong>3 friends</strong> you invite creates a referral batch. For each
          batch, you earn a <strong>5% bonus</strong> on their{" "}
          <strong>approved commissions</strong> for <strong>90 days</strong>.
        </p>
      </header>

      {/* How it works */}
      <section className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border p-6">
          <h3 className="text-lg font-semibold">1) Share your referral link</h3>
          <p className="mt-2 text-sm text-slate-600">
            Sign up and grab your personal referral link from{" "}
            <code>Dashboard → Referrals</code>. Share it with friends, family, and
            community groups.
          </p>
        </div>
        <div className="rounded-xl border p-6">
          <h3 className="text-lg font-semibold">2) Fill a 3-person batch</h3>
          <p className="mt-2 text-sm text-slate-600">
            When <strong>3 new users</strong> join linkmint.co with your link, we create
            a <strong>referral batch</strong> for you. New signups after that start
            filling the next batch.
          </p>
        </div>
        <div className="rounded-xl border p-6">
          <h3 className="text-lg font-semibold">3) Earn 5% for 90 days</h3>
          <p className="mt-2 text-sm text-slate-600">
            For each active batch, you earn a <strong>5% bonus</strong> on your
            invitees&apos; <strong>approved commissions</strong> for{" "}
            <strong>90 days</strong>. They keep 100% of their own share.
          </p>
        </div>
      </section>

      {/* Batch & split explanation */}
      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border p-6 bg-green-50">
          <h3 className="text-xl font-semibold text-green-700">
            Batch-based bonus, not a deduction
          </h3>
          <p className="mt-2 text-slate-700">
            Your 5% referral bonus comes from linkmint.co&apos;s platform share,{" "}
            <strong>not</strong> from your friends&apos; earnings. They receive their
            normal commission; your bonus is layered on top.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Batches are independent. When a 90-day window ends, that batch stops
            generating bonus for you, but your invitees continue earning normally.
            You can keep unlocking new batches by inviting more people.
          </p>
        </div>

        {/* Example */}
        <div className="rounded-xl border p-6">
          <h3 className="text-lg font-semibold">Example: one full batch</h3>
          <p className="mt-2 text-sm text-slate-600">
            You invite <strong>3 friends</strong>: Ana, Mark, and Jessa. They sign up
            with your referral link and start sharing links.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Over the next 90 days, they generate <strong>$200</strong> in{" "}
            <strong>approved commissions</strong> combined.
          </p>
          <ul className="mt-3 list-disc space-y-1 text-sm text-slate-600 pl-5">
            <li>Your friends receive their full earnings (based on their tier).</li>
            <li>
              Linkmint keeps its normal platform margin to cover operations and payouts.
            </li>
            <li>
              You receive an extra <strong>5% of $200 = $10</strong> as a referral bonus
              for that batch.
            </li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Only <strong>approved</strong> commissions inside the 90-day window count
            toward your referral bonus. Pending, cancelled, or rejected commissions do
            not qualify.
          </p>
        </div>
      </section>

      {/* Badges / TrustScore */}
      <section className="mt-10 rounded-xl border p-6">
        <h3 className="text-lg font-semibold">Badges & TrustScore</h3>
        <p className="mt-2 text-sm text-slate-600">
          The referral program also helps build your{" "}
          <strong>TrustScore</strong> on linkmint.co. Clean, organic referrals from real
          people make it easier for us to approve payouts faster over time.
        </p>
        <ul className="mt-3 grid gap-4 text-sm text-slate-700 md:grid-cols-3">
          <li className="rounded-lg bg-slate-50 p-3">
            <p className="font-semibold">Inviter</p>
            <p className="mt-1 text-xs">
              Unlock this when you successfully invite your first friend who starts
              earning.
            </p>
          </li>
          <li className="rounded-lg bg-slate-50 p-3">
            <p className="font-semibold">Active Referrer</p>
            <p className="mt-1 text-xs">
              Unlock this when you complete your first 3-person batch with approved
              commissions.
            </p>
          </li>
          <li className="rounded-lg bg-slate-50 p-3">
            <p className="font-semibold">Power Referrer</p>
            <p className="mt-1 text-xs">
              Unlock this by completing multiple batches while keeping a clean history
              (no fraud, no fake signups, no abuse).
            </p>
          </li>
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Exact badge rules may evolve as the platform grows, but the core idea stays
          the same: invite good users, help the ecosystem grow, and you earn more.
        </p>
      </section>

      {/* CTAs */}
      <section className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
        <a
          href="/signup"
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-5 py-3 text-white"
        >
          Sign up to get your referral link
        </a>
        <a
          href="/login?next=/dashboard/referrals"
          className="inline-flex items-center justify-center rounded-md border px-5 py-3 text-slate-700"
        >
          Log in & view referral dashboard
        </a>
      </section>

      {/* FAQ */}
      <section className="mt-12">
        <h3 className="text-lg font-semibold">FAQ</h3>
        <div className="mt-4 space-y-4 text-sm text-slate-700">
          <div>
            <p className="font-medium">Do my friends lose anything because of my 5%?</p>
            <p>
              No. Your 5% bonus comes from linkmint.co&apos;s platform share, not from
              your invitees. They keep their full eligible commission.
            </p>
          </div>
          <div>
            <p className="font-medium">How long does each referral batch last?</p>
            <p>
              Each batch has a <strong>90-day</strong> bonus window starting from the day
              the 3rd invitee in that batch signs up. After 90 days, that batch stops
              generating bonus for you, but you can unlock new batches with new invitees.
            </p>
          </div>
          <div>
            <p className="font-medium">Is there a limit to how many batches I can have?</p>
            <p>
              There&apos;s no fixed limit, but all referral activity is monitored for
              fraud. Focus on genuine users who will actually share and shop.
            </p>
          </div>
          <div>
            <p className="font-medium">Where do I find my referral link?</p>
            <p>
              After you sign in, go to <code>Dashboard → Referrals</code> to copy your
              personal link and see your active and past batches.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
