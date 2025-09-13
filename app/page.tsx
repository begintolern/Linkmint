// app/page.tsx
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-800 flex flex-col">
      {/* Video Hero (restored) */}
      <section className="relative w-full aspect-[16/9] bg-black">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/hero.mp4"         // put your file at /public/hero.mp4
          autoPlay
          muted
          loop
          playsInline
          poster="/hero-poster.jpg" // optional: /public/hero-poster.jpg
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Welcome to <span className="text-green-400">linkmint.co</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-gray-100 mb-6">
              Earn micro-commissions by sharing trusted links. Ethical, transparent, automated.
            </p>
            <a
              href="mailto:admin@linkmint.co"
              className="inline-block px-6 py-3 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* About / Explainer */}
      <section className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-2xl font-semibold">About Linkmint</h2>
          <p className="text-gray-600">
            We’re building a transparent, fair, and automated affiliate platform. Create smart links to top merchants and
            earn micro-commissions when your community buys — no gimmicks, no tricks.
          </p>
        </div>
      </section>

      {/* (Optional) How it works */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-6">
          <div className="border rounded-xl p-6">
            <h3 className="font-semibold mb-2">1) Pick a Brand</h3>
            <p className="text-gray-600 text-sm">Choose from approved merchants in the Linkmint catalog.</p>
          </div>
          <div className="border rounded-xl p-6">
            <h3 className="font-semibold mb-2">2) Share a Smart Link</h3>
            <p className="text-gray-600 text-sm">Post to social, group chats, or communities you already engage.</p>
          </div>
          <div className="border rounded-xl p-6">
            <h3 className="font-semibold mb-2">3) Earn Micro-Commissions</h3>
            <p className="text-gray-600 text-sm">When friends purchase, earnings are tracked and paid transparently.</p>
          </div>
        </div>
      </section>

      {/* Trust blurb */}
      <section className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-4">
          <h2 className="text-2xl font-semibold">Transparent by Design</h2>
          <p className="text-gray-600">
            No coupon scraping, no brand-term PPC, and no dark patterns. Linkmint aligns with merchant rules and respects users.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-6 text-sm text-center">
        <p>© {new Date().getFullYear()} linkmint.co — All rights reserved.</p>
        <p>
          Questions? <a href="mailto:admin@linkmint.co" className="underline">Email us</a>
        </p>
      </footer>
    </main>
  );
}
