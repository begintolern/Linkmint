// app/page.tsx
import Link from "next/link";

export const dynamic = "force-static";

export default function Home() {
  return (
    <main className="min-h-screen text-white bg-black">
      {/* HERO (unchanged) */}
      <section className="relative h-[72vh] w-full bg-gradient-to-b from-black via-gray-900 to-black flex flex-col items-center justify-center text-center px-6">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Turn everyday links into income
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Share smarter — earn automatically from the links you already use every day.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-xl bg-white text-black px-6 py-3 text-sm font-medium hover:bg-gray-200 transition"
            >
              Get started free
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/60 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* VIDEO TUTORIAL — placed BETWEEN hero and how-it-works */}
      <section className="bg-black text-center py-16 px-4">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6">Watch how it works (60s)</h2>
        <div className="relative mx-auto w-full max-w-3xl aspect-video rounded-xl overflow-hidden border border-gray-700 shadow-lg">
          <video
            src="/video/tutorial.mp4"
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
          >
            {/* Optional captions (keep file at /public/video/tutorial.vtt) */}
            <track
              src="/video/tutorial.vtt"
              kind="subtitles"
              srcLang="en"
              label="English"
              default
            />
          </video>
        </div>
        {/* Optional small helper text */}
        <p className="mt-3 text-sm text-gray-400">Captions available • Works on mobile</p>
      </section>

      {/* HOW IT WORKS / TRUST (unchanged content area) */}
      <section className="px-6 py-16 text-center bg-gradient-to-b from-[#0b1120] to-[#111827] text-gray-300">
        <h2 className="text-2xl font-semibold mb-2">Built for creators and communities</h2>
        <p className="max-w-2xl mx-auto">
          Simple, transparent, and secure — Linkmint helps you grow income without setup hassles.
        </p>
      </section>
    </main>
  );
}
