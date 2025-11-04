// app/page.tsx
"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useMemo, useState } from "react";
import Link from "next/link";

type Lang = "en" | "tl";

const ROUTES = {
  home: "/",
  signup: "/signup",
  signin: "/api/auth/signin?callbackUrl=/dashboard",
  dashboard: "/dashboard",
  trustCenterEn: "/trust-center",
  tutorial: "/tutorial",
  legitimacy: "/trust/legitimacy",
} as const;

const ASSETS = {
  phoneVideo: "/video/tutorial-web.mp4",
} as const;

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("en");

  const t = useMemo(() => {
    if (lang === "tl") {
      return {
        nav_dashboard: "Dashboard",
        nav_login: "Mag-log in",
        nav_trust: "Trust Center",
        nav_tutorial: "Paano Kumita",
        hero_title: "Kumita mula sa mga link na sineshare mo.",
        hero_sub:
          "Kapag may bumili gamit ang link mo, may commission ka. Lahat transparent — statuses, approvals, at payouts.",
        cta_primary: "Simulan ang kita",
        cta_secondary: "Tingnan ang Trust Center",
        referral_title: "Palakasin ang kita sa Referrals",
        referral_points: [
          "Tuwing 3 invites, may 5% bonus ka sa approved earnings nila sa loob ng 90 araw.",
          "Nagsisimula ang 90-araw kapag aktibo at kumikita na ang tatlo mong naimbitahan.",
          "Matatapos ang bonus sa 90 araw — mag-imbita ulit ng 3 para mag-restart.",
          "Totoong users at legit na earnings lang ang bibilangin.",
        ],
        video_caption: "Preview: Phone-size view (9:16)",
        trust_line: "Trusted payouts, transparent earnings.",
        footer_left: "© " + new Date().getFullYear() + " linkmint.co",
        footer_right: "Built for ethical micro-sales",
        footer_tutorial: "How it Works",
        footer_legitimacy: "Legit ba ang Linkmint?",
      };
    }
    return {
      nav_dashboard: "Dashboard",
      nav_login: "Log in",
      nav_trust: "Trust Center",
      nav_tutorial: "How it Works",
      hero_title: "Earn from what you already share.",
      hero_sub:
        "When your link drives a purchase, you get credit — with transparent statuses, approvals, and real payouts.",
      cta_primary: "Start earning",
      cta_secondary: "See Trust Center",
      referral_title: "Boost your earnings with referrals",
      referral_points: [
        "Every 3 invitees unlocks a 5% bonus on their approved earnings for 90 days.",
        "The 90-day window starts once your 3 invitees are active and earning.",
        "After 90 days, it ends automatically — invite 3 more to start again.",
        "Only real users and legitimate earnings qualify.",
      ],
      video_caption: "Preview: Phone-size view (9:16)",
      trust_line: "Trusted payouts, transparent earnings.",
      footer_left: "© " + new Date().getFullYear() + " linkmint.co",
      footer_right: "Built for ethical micro-sales",
      footer_tutorial: "How it Works",
      footer_legitimacy: "Is Linkmint legit?",
    };
  }, [lang]);

  const trustHref = ROUTES.trustCenterEn;

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href={ROUTES.home} className="flex items-center gap-2 font-semibold">
            <span className="inline-block h-6 w-6 rounded-md bg-emerald-500" />
            <span>linkmint.co</span>
          </Link>

          <div className="flex items-center gap-2">
            <LangToggle lang={lang} setLang={setLang} />
            <nav className="hidden items-center gap-4 sm:flex">
              {/* New: explicit Log in link for returning users */}
              <Link href={ROUTES.signin} className="text-sm text-gray-700 hover:text-gray-900">
                {t.nav_login}
              </Link>
              <Link href={ROUTES.dashboard} className="text-sm text-gray-700 hover:text-gray-900">
                {t.nav_dashboard}
              </Link>
              <Link
                href={ROUTES.tutorial}
                className="text-sm text-gray-700 hover:text-emerald-600 hover:underline"
              >
                {t.nav_tutorial}
              </Link>
              <Link href={trustHref} className="text-sm text-gray-700 hover:text-gray-900">
                {t.nav_trust}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 pb-16 pt-10 md:grid-cols-2 md:items-center">
        <div>
          <h1 className="text-3xl font-bold leading-tight md:text-5xl">{t.hero_title}</h1>
          <p className="mt-4 max-w-prose text-base text-gray-600 md:text-lg">{t.hero_sub}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={ROUTES.signup}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t.cta_primary}
            </Link>
            <Link
              href={trustHref}
              className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              {t.cta_secondary}
            </Link>
          </div>

          <p className="mt-3 text-xs text-gray-500">{t.trust_line}</p>
        </div>

        {/* Visual */}
        <div className="flex justify-center">
          <div className="w-full max-w-[380px] md:max-w-[420px]">
            <div className="relative aspect-[9/16] overflow-hidden rounded-2xl shadow-xl ring-1 ring-gray-200">
              <video
                className="h-full w-full object-cover"
                playsInline
                muted
                loop
                controls
                src={ASSETS.phoneVideo}
              />
            </div>
            <p className="mt-2 text-center text-xs text-gray-500">{t.video_caption}</p>
          </div>
        </div>
      </section>

      {/* Referrals */}
      <section className="border-t bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-xl font-semibold md:text-2xl">{t.referral_title}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
            {t.referral_points.map((point, i) => (
              <li key={i} className="text-base leading-relaxed">
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Link
              href={ROUTES.signup}
              className="inline-block rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t.cta_primary}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm text-gray-500">
          <span>{t.footer_left}</span>
          <div className="flex items-center gap-4">
            <Link href={ROUTES.tutorial} className="hover:underline">
              {t.footer_tutorial}
            </Link>
            <Link href={trustHref} className="hover:underline">
              {t.nav_trust}
            </Link>
            {/* New: Legitimacy link */}
            <Link href={ROUTES.legitimacy} className="hover:underline">
              {t.footer_legitimacy}
            </Link>
            <span>{t.footer_right}</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function LangToggle({
  lang,
  setLang,
}: {
  lang: Lang;
  setLang: (v: Lang) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-xl border border-gray-300 p-1">
      <button
        onClick={() => setLang("en")}
        className={`rounded-lg px-3 py-1 text-xs font-semibold ${
          lang === "en" ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
        }`}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <button
        onClick={() => setLang("tl")}
        className={`rounded-lg px-3 py-1 text-xs font-semibold ${
          lang === "tl" ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
        }`}
        aria-pressed={lang === "tl"}
      >
        TL
      </button>
    </div>
  );
}
