// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-gray-800 flex flex-col">
      {/* HERO */}
      <section className="flex flex-col items-center justify-center px-6 pt-16 pb-12 text-center">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-5xl font-bold text-teal-700 mb-6">
            Turn your shares into income — every link can earn.
          </h1>
          <p className="text-lg text-gray-600 mb-10">
            linkmint.co helps you earn small commissions by sharing smart
            affiliate links. Transparent, ethical, and built for Filipino
            creators and everyday users.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Log in to Dashboard
            </Link>
            <Link
              href="/tutorial"
              className="border border-teal-600 text-teal-700 hover:bg-teal-50 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              How it works
            </Link>
          </div>
        </div>
      </section>

      {/* DISCOVER TEASER (AI-ASSISTED IDEAS) */}
      <section className="border-t border-gray-100 bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">
              AI-assisted product ideas
            </span>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            AI-assisted ideas for what to promote next
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Not sure what to share? Our AI-assisted Discover page suggests
            product angles based on Filipino buying behavior — like payday
            treats, student-friendly tech, and TikTok-ready finds. You still
            choose the final products and always follow each merchant&apos;s
            rules.
          </p>

          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            {/* Sample card 1 */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-left">
              <p className="text-xs font-semibold text-teal-700 mb-1">
                PH payday idea
              </p>
              <p className="text-sm font-medium text-gray-900">
                Everyday sandals under ₱1,500
              </p>
              <p className="mt-2 text-xs text-gray-600">
                AI-assisted hint: highlight comfort + work &amp; mall use,
                not just OOTD.
              </p>
            </div>

            {/* Sample card 2 */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-left">
              <p className="text-xs font-semibold text-teal-700 mb-1">
                Student tech
              </p>
              <p className="text-sm font-medium text-gray-900">
                Budget gaming mice &amp; keyboards
              </p>
              <p className="mt-2 text-xs text-gray-600">
                AI-assisted hint: position as realistic upgrades students can
                actually afford.
              </p>
            </div>

            {/* Sample card 3 */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-left">
              <p className="text-xs font-semibold text-teal-700 mb-1">
                TikTok-ready
              </p>
              <p className="text-sm font-medium text-gray-900">
                Aesthetic desk setup ideas
              </p>
              <p className="mt-2 text-xs text-gray-600">
                AI-assisted hint: simple before/after clips and calm
                captions work best.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <Link
              href="/dashboard/discover"
              className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
            >
              Explore AI-assisted ideas →
            </Link>
            <p className="text-[11px] text-gray-500">
              AI-assisted suggestions only. You stay in control of what to
              share and when to promote — and payouts still depend on cleared
              affiliate commissions.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-gray-100 px-6 py-6">
        <div className="mx-auto max-w-4xl text-center text-xs text-gray-500 space-y-3">

          {/* Added Trust Center link */}
          <div className="flex justify-center gap-4 text-[11px]">
            <Link
              href="/trust-center"
              className="text-teal-700 hover:text-teal-900 hover:underline"
            >
              Trust Center
            </Link>

            <Link
              href="/tutorial"
              className="text-teal-700 hover:text-teal-900 hover:underline"
            >
              How it works
            </Link>
          </div>

          <div className="text-gray-400">
            © {new Date().getFullYear()} linkmint.co — all rights reserved.
          </div>

        </div>
      </footer>
    </main>
  );
}
