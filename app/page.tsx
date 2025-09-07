// app/page.tsx
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* Header (kept) — logo updated to use logo.png */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur border-b">
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="linkmint.co"
              width={64}
              height={64}
              className="h-10 w-10 md:h-12 md:w-12"
              priority
            />
            <span className="font-semibold text-lg md:text-xl tracking-tight">
              linkmint.co
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/trust" className="text-sm hover:text-gray-700">Trust Center</Link>
            <Link href="/login" className="text-sm hover:text-gray-700">Log in</Link>
            <Link
              href="/signup"
              className="inline-flex items-center rounded-xl border border-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-900 hover:text-white transition"
            >
              Sign up
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
              Turn any link into a payout.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-600">
              Share links you already love. Earn automatically when they drive
              purchases. No followers required. Built for trust and transparency.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-white font-medium hover:bg-black transition"
              >
                Get started — it’s free
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 font-medium hover:bg-gray-50 transition"
              >
                How it works
              </Link>
            </div>
          </div>
        </section>

        {/* Tutorial video block */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-16">
          <div className="rounded-2xl border border-gray-200 p-4 sm:p-6">
            {/* ✅ Updated text to 30 seconds */}
            <h2 className="text-xl sm:text-2xl font-semibold">Watch: Linkmint in 30 seconds</h2>
            <p className="mt-2 text-gray-600">
              See how to create a smart link, share it, and get paid after approvals.
            </p>

            <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl border">
              <video
                className="h-full w-full"
                controls
                preload="metadata"
                poster="/video/tutorial-poster.jpg"
              >
                <source src="/video/linkmint-tutorial.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Step
                num="1"
                title="Paste a link"
                desc="Drop any product or page link into the smart-link creator."
              />
              <Step
                num="2"
                title="Share anywhere"
                desc="Text it, post it, or DM it. We track clicks and valid purchases."
              />
              <Step
                num="3"
                title="Get paid"
                desc="After affiliate approval and clearance, payouts hit your account."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 text-sm text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} linkmint.co — All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/trust" className="hover:text-gray-700">Trust Center</Link>
            <Link href="/terms" className="hover:text-gray-700">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-700">Privacy</Link>
            <Link href="mailto:admin@linkmint.co" className="hover:text-gray-700">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 font-semibold">
          {num}
        </span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  );
}
