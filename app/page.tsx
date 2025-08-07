"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-100 text-gray-800">
      {/* Hero Section */}
      <section className="text-center px-4 pt-12 pb-16 bg-white shadow">
        {/* Logo */}
        <div className="w-full flex justify-center mb-4">
          <img
            src="/logo.png"
            alt="Linkmint Logo"
            className="w-full max-w-[900px] max-h-[400px] object-contain shadow-lg"
          />
        </div>

        {/* Slogan */}
        <p className="text-xl text-gray-600 mb-6 mt-4">
          Earn from every link you share. No followers required.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:space-y-0 space-y-3 flex-wrap">
          <button
            className="bg-teal-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-teal-700 transition"
            onClick={() => router.push("/signup")}
          >
            Sign Up Now
          </button>
          <button
            className="border border-teal-600 text-teal-700 px-6 py-3 rounded-full font-semibold hover:bg-teal-600 hover:text-white transition"
            onClick={() => router.push("/login")}
          >
            Log In
          </button>
          <button
            className="border border-teal-600 text-teal-700 px-6 py-3 rounded-full font-semibold hover:bg-teal-600 hover:text-white transition"
            onClick={() => router.push("/trust-center")}
          >
            Trust Center
          </button>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 bg-slate-50">
        <h2 className="text-2xl font-bold text-center mb-10 text-teal-700">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          {[
            { title: "1. Share a Link", text: "Get a smart link and share it anywhere — TikTok, Reddit, Messenger, or text." },
            { title: "2. Someone Buys", text: "They click your link and make a purchase. We track it back to you." },
            { title: "3. You Get Paid", text: "Once we receive the commission from the store, we send your payout via PayPal." }
          ].map((step, index) => (
            <div key={index} className="bg-white shadow-md border-l-4 border-teal-500 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold mb-2 text-teal-700">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Snippet */}
      <section className="px-6 py-14 bg-white text-center border-t border-teal-100">
        <h2 className="text-xl font-bold text-teal-700 mb-4">Built for Trust</h2>
        <p className="text-sm text-gray-700 max-w-2xl mx-auto">
          Linkmint only pays you once we’ve been paid by the store. No gimmicks, no fake earnings.
          We explain it all in our{" "}
          <span
            className="underline cursor-pointer text-teal-600 hover:text-teal-800"
            onClick={() => router.push("/trust-center")}
          >
            Trust Center
          </span>.
        </p>
      </section>

      {/* Call to Action */}
      <section className="px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4 text-teal-700">Ready to Start Earning?</h2>
        <p className="mb-6 text-gray-700">Join hundreds of early users already earning micro-commissions with Linkmint.</p>
        <button
          className="bg-teal-600 text-white px-6 py-3 rounded-xl text-lg font-semibold shadow hover:bg-teal-700 transition"
          onClick={() => router.push("/signup")}
        >
          Create Your Account
        </button>
      </section>

      {/* Footer with Links */}
      <footer className="bg-teal-700 text-white py-6 text-center text-sm space-y-2">
        <p>
          Contact: {" "}
          <a href="mailto:admin@linkmint.co" className="underline">
            admin@linkmint.co
          </a>
        </p>
        <div className="flex justify-center gap-4 text-white">
          <a href="/faq" className="underline hover:text-slate-200">FAQ</a>
          <a href="/terms" className="underline hover:text-slate-200">Terms</a>
          <a href="/privacy" className="underline hover:text-slate-200">Privacy</a>
        </div>
        <p>© {new Date().getFullYear()} Linkmint.co. All rights reserved.</p>
      </footer>
    </div>
  );
}
