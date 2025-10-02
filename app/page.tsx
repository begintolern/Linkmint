// app/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* No header here — we rely on the global header in app/layout.tsx */}

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
              Turn any link into a payout.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-600">
              Share links you already love. Earn automatically when they drive purchases.
              No followers required. Built for trust and transparency.
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

            {/* PayPal-only payout notice */}
            <section className="mt-6">
              <p className="text-sm text-gray-600">
                💳 Payouts are currently available via{" "}
                <span className="font-semibold">PayPal (USD)</span> only. Other
                payout methods (e.g., GCash, Maya/PayMaya, bank transfer) are
                not supported yet.
              </p>
            </section>

            <p className="mt-3 text-sm text-gray-500">
              Already have an account?{" "}
              <Link className="underline" href="/login">
                Log in
              </Link>
            </p>
          </div>
        </section>

        {/* Tutorial video */}
        <section
          id="how-it-works"
          className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-16"
        >
          <div className="rounded-2xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold">
              Watch: Linkmint in 30 seconds
            </h2>
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
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 text-sm text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © {new Date().getFullYear()} linkmint.co — All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/trust" className="hover:text-gray-700">
              Trust Center
            </Link>
            <Link href="/terms" className="hover:text-gray-700">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-gray-700">
              Privacy Policy
            </Link>
            <a
              href="mailto:admin@linkmint.co"
              className="hover:text-gray-700"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Step({
  num,
  title,
  desc,
}: {
  num: string;
  title: string;
  desc: string;
}) {
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
