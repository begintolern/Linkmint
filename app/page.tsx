"use client";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-800 flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center flex-1 text-center px-6 py-20 bg-gradient-to-b from-slate-50 to-white">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-slate-900">
          Turn everyday links into income.
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-xl mb-8">
          Linkmint.co makes affiliate marketing effortless. Create a smart link,
          share it anywhere, and earn when people buy — with full transparency
          and instant PayPal payouts once approved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="/signup"
            className="rounded-xl bg-emerald-600 text-white px-6 py-3 font-medium hover:bg-emerald-700 transition"
          >
            Get Started Free
          </a>
          <a
            href="/login"
            className="rounded-xl border border-slate-300 px-6 py-3 font-medium hover:bg-slate-50 transition"
          >
            Log In
          </a>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-6">How it works</h2>
          <div className="grid gap-8 sm:grid-cols-3 text-left sm:text-center">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-emerald-700">
                1. Create
              </h3>
              <p className="text-sm text-slate-600">
                Choose a product or store, and Linkmint builds a smart affiliate
                link that follows the merchant’s rules automatically.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-emerald-700">
                2. Share
              </h3>
              <p className="text-sm text-slate-600">
                Post your link on TikTok, Facebook, Reddit, or anywhere you
                connect with others — no complex setup required.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-emerald-700">
                3. Earn
              </h3>
              <p className="text-sm text-slate-600">
                When someone buys through your link, you get a verified
                commission. Payouts go directly to your PayPal after approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust snippet */}
      <section className="px-6 py-12 text-center">
        <p className="text-sm text-slate-600 max-w-2xl mx-auto">
          Linkmint.co is built for transparency. You’ll always know when funds
          are cleared and how commissions are split — no hidden rules, no delays.
        </p>
        <a
          href="/trust"
          className="mt-4 inline-block text-emerald-700 font-medium hover:underline"
        >
          Visit the Trust Center →
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 text-center text-sm text-slate-500 py-6">
        <p>
          © {new Date().getFullYear()} linkmint.co •{" "}
          <a href="/privacy" className="hover:underline">
            Privacy
          </a>{" "}
          •{" "}
          <a href="/terms" className="hover:underline">
            Terms
          </a>
        </p>
      </footer>
    </main>
  );
}
