// app/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero Section */}
      <section className="text-center py-20 px-6">
        <h1 className="text-4xl sm:text-6xl font-bold mb-6 leading-tight">
          Turn everyday links into income.
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto mb-10">
          Linkmint.co helps you earn micro-commissions by sharing smart affiliate links.
          Share ethically. Earn automatically.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/signup"
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-8 py-3 rounded-xl transition"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="border border-gray-500 hover:border-teal-500 text-gray-300 hover:text-white font-semibold px-8 py-3 rounded-xl transition"
          >
            Login
          </Link>
        </div>
      </section>

      {/* Tutorial Video Section */}
      <section className="py-16 bg-[#0f0f0f] text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold mb-6">
          Watch how it works (60 seconds)
        </h2>

        <div className="relative mx-auto w-full max-w-3xl aspect-video rounded-xl overflow-hidden border border-gray-700 shadow-lg">
          <video
            controls
            playsInline
            preload="metadata"
            poster="/video/tutorial.jpg"
            className="w-full h-full object-cover"
          >
            <source src="/video/tutorial-web.webm" type="video/webm" />
            <source src="/video/tutorial-web.mp4" type="video/mp4" />
            <track
              src="/video/tutorial.vtt"
              kind="subtitles"
              srcLang="en"
              label="English"
              default
            />
            Sorry, your browser doesn’t support embedded videos.
          </video>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 text-center px-6">
        <h2 className="text-3xl font-semibold mb-10">How It Works</h2>
        <div className="grid sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-6 bg-[#141414] rounded-2xl border border-gray-800">
            <h3 className="text-xl font-semibold mb-2 text-teal-400">1. Create</h3>
            <p className="text-gray-400">
              Choose a product or service, and Linkmint generates your smart affiliate link.
            </p>
          </div>
          <div className="p-6 bg-[#141414] rounded-2xl border border-gray-800">
            <h3 className="text-xl font-semibold mb-2 text-teal-400">2. Share</h3>
            <p className="text-gray-400">
              Post your link anywhere — social media, chats, blogs, or communities.
            </p>
          </div>
          <div className="p-6 bg-[#141414] rounded-2xl border border-gray-800">
            <h3 className="text-xl font-semibold mb-2 text-teal-400">3. Earn</h3>
            <p className="text-gray-400">
              When someone buys through your link, you earn micro-commissions automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        <p>
          © {new Date().getFullYear()} Linkmint.co ·{" "}
          <Link href="/privacy" className="hover:text-teal-400">
            Privacy
          </Link>{" "}
          ·{" "}
          <Link href="/terms" className="hover:text-teal-400">
            Terms
          </Link>
        </p>
      </footer>
    </main>
  );
}
