// app/tutorial/page.tsx
export const dynamic = "force-dynamic";

export const metadata = {
  title: "How Linkmint Works — Earn Real ₱ from Everyday Sharing",
  description:
    "See how linkmint.co turns your shared links into real commissions. Create → Share → Earn → GCash payout, all transparent and ethical.",
  openGraph: {
    title: "How Linkmint Works",
    description:
      "Create Smart Links, share anywhere, earn commissions, and get paid directly to GCash. Transparent, PH-first.",
    url: "https://linkmint.co/tutorial",
    siteName: "linkmint.co",
    images: [{ url: "/og/tutorial.png", width: 1200, height: 630 }],
    locale: "en_PH",
    type: "article",
  },
  alternates: { canonical: "https://linkmint.co/tutorial" },
};

import Link from "next/link";

export default function TutorialPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="border-b bg-white sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-block h-6 w-6 rounded-md bg-emerald-500" />
            <span>linkmint.co</span>
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
          >
            Back
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-12 space-y-10">
        <h1 className="text-3xl font-bold">How Linkmint Works</h1>
        <p className="text-gray-700 text-lg leading-relaxed">
          linkmint.co turns everyday sharing into real earnings. Here’s a simple
          breakdown of how you can start earning using just your phone.
        </p>

        <div className="space-y-10">
          <Step
            number="1"
            title="Create a Smart Link"
            desc="Choose a merchant or product. linkmint.co automatically formats your link and ensures it complies with merchant policies."
          />
          <Step
            number="2"
            title="Share It Anywhere"
            desc="Post your smart link on Facebook, Messenger, TikTok, or any platform. Each click is tracked safely."
          />
          <Step
            number="3"
            title="Earn Commissions"
            desc="When someone buys through your link, you earn a small commission. You can monitor all status updates in your dashboard."
          />
          <Step
            number="4"
            title="Get Paid via GCash"
            desc="Once the merchant pays linkmint.co, your balance becomes eligible for payout. Withdraw directly to your GCash account—simple and transparent."
          />
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Try It Now
          </Link>
        </div>
      </section>

      <footer className="border-t mt-10">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500 flex justify-between">
          <span>© {new Date().getFullYear()} linkmint.co</span>
          <span>Built for ethical micro-sales</span>
        </div>
      </footer>
    </main>
  );
}

function Step({
  number,
  title,
  desc,
}: {
  number: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
      <div className="text-emerald-600 text-4xl font-bold">{number}</div>
      <h3 className="mt-2 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-gray-700 text-base">{desc}</p>
    </div>
  );
}
