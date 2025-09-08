// app/page.tsx
import Link from "next/link";
import SmartSignupButton from "./components/SmartSignupButton";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* Header with login/signup */}
      <header className="w-full border-b border-gray-200">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-bold tracking-tight">
            linkmint.co
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-50 transition"
            >
              Log in
            </Link>
            <SmartSignupButton />
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
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
              <SmartSignupButton />
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 font-medium hover:bg-gray-50 transition"
              >
                How it works
              </a>
            </div>

            {/* Secondary CTA for existing users */}
            <div className="mt-4 text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-emerald-600 hover:text-emerald-500"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>

        {/* Tutorial video block */}
        <section
          id="how-it-works"
          className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-16"
        >
          <div className="rounded-2xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold">
              Watch: Linkmint in 30 seconds
            </h2>
            <p className="mt-2 text-gray-600">
              See how to create a smart link, share it, and get paid after
              approvals.
            </p>

            <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl border">
              <video className="h-full w-full" controls preload="metadata">
                <source src="/video/tutorial.mp4" type="video/mp4" />
                <track
                  src="/video/tutorial.vtt"
                  kind="subtitles"
                  srcLang="en"
                  label="English"
                  default
                />
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

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-600">
        <div className="space-x-4">
          <Link href="/login" className="hover:underline">
            Log in
          </Link>
          <Link href="/signup" className="hover:underline">
            Sign up
          </Link>
          <Link href="/tos" className="hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          © {new Date().getFullYear()} linkmint.co
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
