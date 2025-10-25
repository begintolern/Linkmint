"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useMemo, useState } from "react";
import Link from "next/link";

type Lang = "en" | "tl";

const ROUTES = {
  home: "/",
  signup: "/signup", // 👈 added this route alias
  dashboard: "/dashboard",
  trustCenterEn: "/trust-center",
  tutorial: "/tutorial",
} as const;

const ASSETS = {
  phoneVideo: "/video/tutorial-web.mp4",
} as const;

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [showReferral, setShowReferral] = useState(false);

  const t = useMemo(() => {
    if (lang === "tl") {
      return {
        nav_dashboard: "Dashboard",
        nav_trust: "Trust Center",
        nav_tutorial: "Paano Kumita",
        hero_title: "Gawing kita ang simpleng pag-share ng mga link.",
        hero_sub:
          "linkmint.co helps you earn micro-commissions by sharing smart links — transparent rules, real payouts.",
        cta_primary: "Sumali o Mag-login",
        cta_secondary: "Buksan ang Dashboard",
        how_title: "Paano ito gumagana",
        how_1_t: "1) Gumawa ng Smart Link",
        how_1_d:
          "Pumili ng merchant, auto-format ng link, at i-check ang policy bago mo i-share.",
        how_2_t: "2) I-share at Mag-earn",
        how_2_d:
          "Kapag may bumili mula sa link mo, may commission ka — malinaw ang status at timing.",
        how_3_t: "3) Payout na Klaro",
        how_3_d:
          "Nagbabayad lamang kapag na-receive ng linkmint.co ang funds mula sa affiliate partner.",
        referral_title: "Referral Bonus Rules",
        referral_points: [
          "Mag-imbita ng mga kaibigan para kumita pa: Tuwing 3 invite, may 5% bonus ka sa kanilang approved earnings sa loob ng 90 araw.",
          "Awtomatikong magsisimula ang 90-araw na timer kapag aktibo at kumikita na ang iyong tatlong naimbitahan.",
          "Pagkatapos ng 90 araw, matatapos ang bonus — mag-imbita ulit ng 3 para magsimula ulit.",
          "Tanging totoong users at valid na earnings lang ang bibilangin para sa bonuses.",
        ],
        video_caption: "Preview: Phone-size view (9:16)",
        trust_line:
          "Kumpleto ang paliwanag tungkol sa payout timing at rules sa Trust Center.",
        footer_left: "© " + new Date().getFullYear() + " linkmint.co",
        footer_right: "Built for ethical micro-sales",
        referral_button_show: "Tingnan ang Referral Bonus Rules",
        referral_button_hide: "Itago ang Referral Bonus Rules",
      };
    }
    return {
      nav_dashboard: "Dashboard",
      nav_trust: "Trust Center",
      nav_tutorial: "How it Works",
      hero_title: "Turn simple link sharing into earnings.",
      hero_sub:
        "linkmint.co helps you earn micro-commissions by sharing smart links — transparent rules, real payouts.",
      cta_primary: "Join or Sign In",
      cta_secondary: "Open Dashboard",
      how_title: "How it works",
      how_1_t: "1) Create a Smart Link",
      how_1_d:
        "Pick a merchant, auto-format the link, and run a policy pre-check before sharing.",
      how_2_t: "2) Share & Earn",
      how_2_d:
        "When someone buys through your link, you earn — with clear status and timing.",
      how_3_t: "3) Payouts You Can Trust",
      how_3_d:
        "We only pay out after linkmint.co actually receives funds from the affiliate partner.",
      referral_title: "Referral Bonus Rules",
      referral_points: [
        "Invite friends, earn more: Every 3 people you invite unlocks a 5% bonus on their approved earnings for 90 days.",
        "Automatic start: The 90-day timer begins once your 3 invitees are active and earning.",
        "Temporary reward: After 90 days, the bonus ends automatically — invite 3 more to start again.",
        "Fair use: Only real users and genuine earnings count toward bonuses.",
      ],
      video_caption: "Preview: Phone-size view (9:16)",
      trust_line:
        "Full payout timing and rules are explained in the Trust Center.",
      footer_left: "© " + new Date().getFullYear() + " linkmint.co",
      footer_right: "Built for ethical micro-sales",
      referral_button_show: "View Referral Bonus Rules",
      referral_button_hide: "Hide Referral Bonus Rules",
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
              <Link
                href={ROUTES.dashboard}
                className="text-sm text-gray-700 hover:text-gray-900"
              >
                {t.nav_dashboard}
              </Link>
              <Link
                href={ROUTES.tutorial}
                className="text-sm text-gray-700 hover:text-emerald-600 hover:underline"
              >
                {t.nav_tutorial}
              </Link>
              <Link
                href={trustHref}
                className="text-sm text-gray-700 hover:text-gray-900"
              >
                {t.nav_trust}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 pb-16 pt-10 md:grid-cols-2 md:items-center">
        <div>
          <h1 className="text-3xl font-bold leading-tight md:text-5xl">
            {t.hero_title}
          </h1>
          <p className="mt-4 max-w-prose text-base text-gray-600 md:text-lg">
            {t.hero_sub}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {/* Primary CTA now points to /signup */}
            <Link
              href={ROUTES.signup}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t.cta_primary}
            </Link>
            {/* Secondary CTA also points to /signup */}
            <Link
              href={ROUTES.signup}
              className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              {t.cta_secondary}
            </Link>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            {t.trust_line}{" "}
            <Link
              href={trustHref}
              className="underline decoration-dotted underline-offset-2 hover:text-gray-700"
            >
              {t.nav_trust}
            </Link>.
          </p>
        </div>

        {/* Video */}
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
            <p className="mt-2 text-center text-xs text-gray-500">
              {t.video_caption}
            </p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="border-t bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-xl font-semibold md:text-2xl">{t.how_title}</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card title={t.how_1_t} desc={t.how_1_d} />
            <Card title={t.how_2_t} desc={t.how_2_d} />
            <Card title={t.how_3_t} desc={t.how_3_d} />
          </div>
        </div>
      </section>

      {/* Collapsible Referral Bonus Section */}
      <section className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center">
          <button
            onClick={() => setShowReferral((prev) => !prev)}
            className="text-emerald-600 font-semibold hover:underline"
          >
            {showReferral ? t.referral_button_hide : t.referral_button_show}
          </button>

          {showReferral && (
            <div className="mt-6 text-left max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                {t.referral_title}
              </h2>
              <ul className="text-gray-600 space-y-4 text-lg leading-relaxed">
                {t.referral_points.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm text-gray-500">
          <span>{t.footer_left}</span>
          <div className="flex items-center gap-4">
            <Link href="/tutorial" className="hover:underline">
              {t.nav_tutorial}
            </Link>
            <Link href="/trust-center" className="hover:underline">
              {t.nav_trust}
            </Link>
            <span>{t.footer_right}</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
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
          lang === "en"
            ? "bg-gray-900 text-white"
            : "text-gray-700 hover:bg-gray-100"
        }`}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <button
        onClick={() => setLang("tl")}
        className={`rounded-lg px-3 py-1 text-xs font-semibold ${
          lang === "tl"
            ? "bg-gray-900 text-white"
            : "text-gray-700 hover:bg-gray-100"
        }`}
        aria-pressed={lang === "tl"}
      >
        TL
      </button>
    </div>
  );
}
