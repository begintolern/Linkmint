// app/trust-center/page.tsx
"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useMemo, useState } from "react";
import Link from "next/link";

type Lang = "en" | "tl";

const ROUTES = {
  home: "/",
  signup: "/signup",
  dashboard: "/dashboard",
  tutorial: "/tutorial",
  trust: "/trust-center",
  faq: "/tutorial#faq",
  contact: "/contact",
} as const;

export default function TrustCenterPage() {
  const [lang, setLang] = useState<Lang>("en");

  const t = useMemo(() => {
    if (lang === "tl") {
      return {
        nav_home: "Home",
        nav_dashboard: "Dashboard",
        nav_tutorial: "Paano Kumita",
        title: "Trust Center",
        subtitle:
          "Transparent kami sa kung paano gumagana ang earnings at payouts. Ito ang mga patakaran na nagpoprotekta sa lahat.",
        last_updated: "Huling update",
        section_payouts_title: "Paano ang Payouts",
        section_payouts_points: [
          "Nagbabayad lang kami kapag natanggap na namin ang pondo mula sa affiliate network o merchant.",
          "Karaniwan may hold window (hal. 30 araw) para sa mga refund o chargeback risk.",
          "Kapag na-approve at natanggap ang pondo, eligible na ang iyong earnings sa payout ayon sa iyong TrustScore.",
          "Lahat ng payout sa Pilipinas ay ginagawa sa pamamagitan ng GCash sa Philippine Peso (₱).",
        ],
        section_hold_title: "30-Day Hold at TrustScore",
        section_hold_points: [
          "Para sa mga bagong users, may minimum 30-araw na 'honeymoon' hold bago payagan ang maagang payout.",
          "Pinoprotektahan nito ang platform laban sa fraud at invalid traffic.",
          "Ang TrustScore ay tumataas sa maayos at legit na paggamit; mas mataas na TrustScore = mas mabilis at mas maayos na payout eligibility.",
        ],
        section_compliance_title: "Ethical at Compliant",
        section_compliance_points: [
          "Sumusunod kami sa terms ng bawat merchant o network (hal. bawal self-purchase kung hindi pinapayagan, walang coupon stacking kung bawal).",
          "Makikita ang mga patakaran sa Merchant Rules sa dashboard.",
          "Ang paglabag ay maaaring magdulot ng pagka-void ng commissions o penalties ayon sa network.",
        ],
        section_proof_title: "Verified Payouts (Sample Proof)",
        section_proof_note:
          "Ito ay sample lamang. Kapag naka-sync na sa payout logs mo, makikita rito ang mga totoong transaksyon.",
        proof_headers: ["Petsa", "Provider", "Halaga", "Status", "Ref"],
        proof_rows: [
          ["2025-10-20", "GCash", "₱150.00", "PAID", "TestGC001"],
          ["2025-10-12", "GCash", "₱295.00", "PAID", "TestGC002"],
        ],
        help_title: "Tulong at FAQ",
        help_points: [
          "May tanong sa payout timing o status? Tingnan ang FAQ.",
          "Kung kailangan mo ng tulong, mag-message sa amin.",
        ],
        cta_to_dashboard: "Bumalik sa Dashboard",
        cta_to_tutorial: "Tingnan ang Paano Kumita",
        cta_to_faq: "FAQ",
        cta_to_contact: "Contact",
      };
    }
    return {
      nav_home: "Home",
      nav_dashboard: "Dashboard",
      nav_tutorial: "How it Works",
      title: "Trust Center",
      subtitle:
        "We’re transparent about how earnings and payouts work. These rules protect the entire community.",
      last_updated: "Last updated",
      section_payouts_title: "How Payouts Work",
      section_payouts_points: [
        "We pay out only after affiliate funds are received from the network or merchant.",
        "Most programs include a hold window (e.g., 30 days) for returns or chargebacks.",
        "Once funds are approved and received, your earnings become payout-eligible based on your TrustScore.",
        "All payouts in the Philippines are made through GCash in Philippine Peso (₱).",
      ],
      section_hold_title: "30-Day Hold & TrustScore",
      section_hold_points: [
        "New users start with a minimum 30-day 'honeymoon' hold before early payouts are enabled.",
        "This protects the platform from fraud or invalid traffic.",
        "TrustScore increases with legitimate and consistent activity; higher TrustScore = faster, smoother payout eligibility.",
      ],
      section_compliance_title: "Ethical & Compliant",
      section_compliance_points: [
        "We comply with every merchant/network’s terms (e.g., no self-purchase if disallowed, no coupon stacking if prohibited).",
        "All merchant rules are clearly displayed in your dashboard.",
        "Violations may void commissions or result in penalties per network policies.",
      ],
      section_proof_title: "Verified Payouts (Sample Proof)",
      section_proof_note:
        "This is just a sample. Once your payout logs are connected, real transactions will appear here.",
      proof_headers: ["Date", "Provider", "Amount", "Status", "Ref"],
      proof_rows: [
        ["2025-10-20", "GCash", "₱150.00", "PAID", "TestGC001"],
        ["2025-10-12", "GCash", "₱295.00", "PAID", "TestGC002"],
      ],
      help_title: "Help & FAQ",
      help_points: [
        "Questions about payout timing or status? Check the FAQ.",
        "Need help? Contact us anytime.",
      ],
      cta_to_dashboard: "Back to Dashboard",
      cta_to_tutorial: "See How it Works",
      cta_to_faq: "FAQ",
      cta_to_contact: "Contact",
    };
  }, [lang]);

  const today = new Date();
  const lastUpdated = today.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

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
              <Link href={ROUTES.home} className="text-sm text-gray-700 hover:text-gray-900">
                {t.nav_home}
              </Link>
              <Link href={ROUTES.tutorial} className="text-sm text-gray-700 hover:text-emerald-600 hover:underline">
                {t.nav_tutorial}
              </Link>
              <Link href={ROUTES.dashboard} className="text-sm text-gray-700 hover:text-gray-900">
                {t.nav_dashboard}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-10">
        <h1 className="text-3xl font-bold md:text-5xl">{t.title}</h1>
        <p className="mt-3 max-w-prose text-base text-gray-600 md:text-lg">{t.subtitle}</p>
        <p className="mt-2 text-xs text-gray-500">
          {t.last_updated}: {lastUpdated}
        </p>
      </section>

      {/* Sections */}
      <Section title={t.section_payouts_title}>
        <BulletList items={t.section_payouts_points} />
      </Section>

      <Section title={t.section_hold_title} muted>
        <BulletList items={t.section_hold_points} />
      </Section>

      <Section title={t.section_compliance_title}>
        <BulletList items={t.section_compliance_points} />
      </Section>

      {/* Proof */}
      <Section title={t.section_proof_title} muted>
        <p className="mb-3 text-sm text-gray-600">{t.section_proof_note}</p>
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                {t.proof_headers.map((h, i) => (
                  <th key={i} className="px-4 py-2 font-semibold text-gray-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.proof_rows.map((row, i) => (
                <tr key={i} className="border-t">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2 text-gray-800">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Help */}
      <Section title={t.help_title}>
        <BulletList items={t.help_points} />
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={ROUTES.dashboard} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50">
            {t.cta_to_dashboard}
          </Link>
          <Link href={ROUTES.tutorial} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50">
            {t.cta_to_tutorial}
          </Link>
          <Link href={ROUTES.faq} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50">
            {t.cta_to_faq}
          </Link>
          <Link href={ROUTES.contact} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50">
            {t.cta_to_contact}
          </Link>
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm text-gray-500">
          <span>© {new Date().getFullYear()} linkmint.co</span>
          <div className="flex items-center gap-4">
            <Link href={ROUTES.tutorial} className="hover:underline">
              {lang === "tl" ? "Paano Kumita" : "How it Works"}
            </Link>
            <Link href={ROUTES.dashboard} className="hover:underline">
              Dashboard
            </Link>
            <span>{lang === "tl" ? "Ginawa para sa ethical micro-sales" : "Built for ethical micro-sales"}</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ---------- UI bits ---------- */

function Section({
  title,
  children,
  muted,
}: {
  title: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <section className={muted ? "border-t bg-gray-50" : "border-t"}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-xl font-semibold md:text-2xl">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-gray-700">
      {items.map((x, i) => (
        <li key={i} className="text-base leading-relaxed">
          {x}
        </li>
      ))}
    </ul>
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
