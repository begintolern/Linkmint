// app/referrals/page.tsx
export const dynamic = "force-dynamic";

export default function PublicReferralsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="text-center">
        <h1 className="text-3xl font-bold">Linkmint Referral Program</h1>
        <p className="mt-3 text-slate-600">
          Share your link. When someone you invite earns, you earn too.
        </p>
      </header>

      {/* How it works */}
      <section className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border p-6">
          <h3 className="text-lg font-semibold">1) Sign up</h3>
          <p className="mt-2 text-sm text-slate-600">
            Create your account in minutes. No followers or website needed.
          </p>
        </div>
        <div className="rounded-xl border p-6">
          <h3 className="text-lg font-semibold">2) Get your link</h3>
          <p className="mt-2 text-sm text-slate-600">
            Your personal referral link appears in your dashboard.
          </p>
        </div>
        <div className="rounded-xl border p-6">
          <h3 className="text-lg font-semibold">3) Share to earn</h3>
          <p className="mt-2 text-sm text-slate-600">
            Share in chats or groups. When invited users earn commissions, you
            receive a referral cut automatically.
          </p>
        </div>
      </section>

      {/* Split / transparency */}
      <section className="mt-10 rounded-xl border p-6 bg-green-50">
        <h3 className="text-xl font-semibold text-green-700">Transparent split</h3>
        <p className="mt-2 text-slate-700">
          Creators keep <strong>85%</strong> of each commission. Linkmint takes a
          <strong> 15%</strong> platform fee to cover payouts & operations.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Referral bonuses are layered on top and shown clearly in your dashboard.
        </p>
      </section>

      {/* Example */}
      <section className="mt-10 rounded-xl border p-6">
        <h3 className="text-lg font-semibold">Example</h3>
        <p className="mt-2 text-sm text-slate-600">
          You invite Alex. Alex shares links and earns a $10 commission. Alex
          keeps $8.50, Linkmint takes $1.50, and <em>you</em> receive a referral
          bonus according to the current program—automatically tracked in your
          dashboard as <strong>Pending → Approved → Paid</strong>.
        </p>
      </section>

      {/* CTAs */}
      <section className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
        <a
          href="/signup"
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-5 py-3 text-white"
        >
          Sign up to get your link
        </a>
        <a
          href="/login?next=/dashboard/referrals"
          className="inline-flex items-center justify-center rounded-md border px-5 py-3 text-slate-700"
        >
          Log in & view dashboard
        </a>
      </section>

      {/* FAQ */}
      <section className="mt-12">
        <h3 className="text-lg font-semibold">FAQ</h3>
        <div className="mt-4 space-y-4 text-sm text-slate-700">
          <div>
            <p className="font-medium">Do I need followers?</p>
            <p>No. Anyone can share a link and earn—this is a micro-affiliate model.</p>
          </div>
          <div>
            <p className="font-medium">When are payouts sent?</p>
            <p>
              Networks pay after 30–90 days. Once commissions are approved, Linkmint
              pays out promptly via your selected method.
            </p>
          </div>
          <div>
            <p className="font-medium">Where do I find my referral link?</p>
            <p>
              After you sign in, go to <code>Dashboard → Referrals</code> to copy your
              personal link.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
