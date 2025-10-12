// app/page.tsx
"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Hero Section */}
      <section className="text-center mt-24 px-6">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Turn everyday links into income
        </h1>
        <p className="text-gray-300 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          Share smart links, earn passive income, and join the new wave of micro-affiliates.
        </p>
        <Link
          href="/signup"
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          Get Started Free
        </Link>
      </section>

      {/* Tutorial Video Section (restored original phone-size look) */}
      <section className="mt-16 mb-24 px-4 w-full flex justify-center">
        <div className="relative mx-auto w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg rounded-xl overflow-hidden border border-gray-700 shadow-lg">
          <video
            src="/video/tutorial.mp4"
            controls
            playsInline
            preload="metadata"
            className="w-full h-auto object-contain"
          >
            <track
              src="/video/tutorial.vtt"
              kind="subtitles"
              srcLang="en"
              label="English"
              default
            />
          </video>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="text-center mb-32 px-6">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">How it works</h2>
        <div className="max-w-4xl mx-auto text-gray-300 space-y-4 text-lg">
          <p>
            1. Create or share smart links for trending merchants.
          </p>
          <p>
            2. Earn commissions when people buy through your links.
          </p>
          <p>
            3. Withdraw your earnings directly to PayPal after approval.
          </p>
        </div>
      </section>

      {/* Trust Center Snippet */}
      <section className="text-center mb-24 px-6">
        <h2 className="text-2xl font-semibold mb-3">Trust and Transparency</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          linkmint.co ensures every payout is tied to verified affiliate earnings.  
          Funds are released only after merchants confirm transactions.  
          Learn more in our{" "}
          <Link href="/trust-center" className="text-emerald-400 hover:underline">
            Trust Center
          </Link>.
        </p>
      </section>

      {/* Footer */}
      <footer className="text-gray-500 text-sm mb-6">
        <p>© {new Date().getFullYear()} linkmint.co — All rights reserved.</p>
        <p className="mt-2">
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>{" "}
          ·{" "}
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
        </p>
      </footer>
    </main>
  );
}
