// app/page.tsx
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-800 flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Welcome to <span className="text-green-600">linkmint.co</span>
        </h1>
        <p className="max-w-2xl text-lg text-gray-600 mb-8">
          Linkmint is a new platform that helps people earn simple micro-commissions
          by sharing trusted links. We’re currently preparing for launch.
        </p>
        <a
          href="mailto:admin@linkmint.co"
          className="px-6 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition"
        >
          Contact Us
        </a>
      </section>

      {/* Info */}
      <section className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-2xl font-semibold">About Linkmint</h2>
          <p className="text-gray-600">
            We are building a transparent, fair, and automated affiliate platform.
            Users will be able to create “smart links” to top merchants and earn
            micro-commissions when their friends or followers buy. No gimmicks,
            no tricks — just ethical sharing.
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
