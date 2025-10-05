"use client";

import React from "react";
import { useState, useEffect } from "react";

// Bilingual Trust Center (English + Tagalog)
// Path: app/dashboard/trust-center/page.tsx
// Notes:
// - Interactive language toggle (EN/TL) with localStorage persistence
// - Clear payout policy: Linkmint pays only AFTER affiliate funds are received
// - Honeymoon period, TrustScore, Amazon exclusion, PayPal fee disclosure
// - PH context (Shopee/Lazada timelines), GCash "coming soon" messaging

type Lang = "en" | "tl";

const t = {
  en: {
    title: "Trust Center",
    subtitle:
      "Radical transparency about how payouts work on linkmint.co — and how we keep the platform safe, fair, and sustainable.",
    langLabel: "Language",
    btnEN: "English",
    btnTL: "Tagalog",

    // Core principles
    coreHeading: "Core Payout Principles",
    coreBullets: [
      "We only pay commissions after linkmint.co actually receives the funds from the affiliate partner (no exceptions).",
      "Your first 30 days is a Honeymoon Period. During this time, payouts may be delayed until commissions are approved by the network.",
      "Early payouts (float) are offered only when: (1) the network marks the commission Approved, (2) your TrustScore is healthy, and (3) float is available. Amazon commissions are excluded from early payouts.",
      "PayPal fees are deducted from payouts. You'll see fees and net amounts before confirming.",
    ],

    // Status labels
    statusHeading: "What Affects Your Payout Timing?",
    statusItems: [
      {
        title: "Network Approval Status",
        body:
          "Every commission must move from Pending → Approved by the affiliate network before we can pay it out. This is the number one factor.",
      },
      {
        title: "Honeymoon Period (First 30 Days)",
        body:
          "New accounts have a safety buffer. Even with approvals, some networks hold funds—your dashboard shows the unlock dates.",
      },
      {
        title: "TrustScore",
        body:
          "Good behavior (real referrals, no abuse, consistent activity) unlocks earlier eligibility for float on Approved commissions.",
      },
      {
        title: "Merchant Payout Speed",
        body:
          "Some merchants/networks pay faster than others. Your dashboard groups earnings as Fast vs Slow so you know what to expect.",
      },
    ],

    // PH merchants
    phHeading: "PH Merchant Timelines (Heads‑Up)",
    phNote:
      "The timelines below are typical but not guarantees. Your dashboard shows your exact hold/unlock dates per commission.",
    phRows: [
      { merchant: "Shopee (PH)", cookie: "7 days", delay: "~30 days", notes: "Usually slower release near promos/flash sales." },
      { merchant: "Lazada (PH)", cookie: "7–14 days", delay: "~30–45 days", notes: "May vary by category and cancellation rate." },
    ],

    // Methods
    methodsHeading: "Payout Methods",
    methods: [
      {
        title: "PayPal (Active)",
        body:
          "Available now for US and PH users. Fees are deducted automatically. Make sure your PayPal account can receive payments.",
      },
      {
        title: "GCash (Coming Soon)",
        body:
          "We are pre‑provisioned for GCash and will enable it after PH corporate + banking verification. You’ll be able to add your GCash number in Settings.",
      },
      {
        title: "Bank Transfer (Coming Later)",
        body:
          "Traditional bank transfers in PH will be enabled after we finalize our local rails. Expect standard bank fees and verification checks.",
      },
    ],

    // Fast vs Slow
    speedHeading: "Fast vs Slow Payouts (Explained)",
    speedBody:
      "\"Fast\" means networks that approve and remit funds quickly once the return window closes. \"Slow\" means approval or remittance takes longer. Your dashboard labels each commission so you can plan.",

    // Anti-fraud
    safetyHeading: "Safety & Fair‑Use",
    safetyBullets: [
      "Self‑buying, fake traffic, coupon abuse, and prohibited promotion sources are not allowed.",
      "Multiple flags reduce TrustScore and can trigger payout holds or account review.",
      "We cooperate with affiliate partners on fraud reviews. Final network decisions control payout eligibility.",
    ],

    // FAQ
    faqHeading: "Quick FAQ",
    faqs: [
      {
        q: "Why can’t you pay me right after a sale?",
        a: "Because merchants can cancel/return orders. Networks wait until that window closes and only then send funds to linkmint.co. We pay out after funds arrive.",
      },
      {
        q: "What about Amazon?",
        a: "Amazon is strict and pays slower. We don’t offer early float on Amazon—even when Approved—until funds are actually received.",
      },
      {
        q: "How do fees work?",
        a: "We deduct PayPal’s fee and show your net before you confirm a payout. When GCash/bank are live, we’ll display those fees as well.",
      },
      {
        q: "How do I speed up payouts?",
        a: "Focus on quality traffic, follow allowed‑source rules, and keep a clean TrustScore. Choose offers from faster‑paying merchants when possible.",
      },
    ],

    contactHeading: "Need help?",
    contactBody:
      "Message us via the in‑app help or email admin@linkmint.co. We’ll never promise a payout before funds are received—this keeps the platform safe for everyone.",
  },

  tl: {
    title: "Sentro ng Tiwala",
    subtitle:
      "Tapat at malinaw na paliwanag kung paano gumagana ang payouts sa linkmint.co — at kung paano namin pinapanatiling ligtas, patas, at matatag ang platform.",
    langLabel: "Wika",
    btnEN: "Ingles",
    btnTL: "Tagalog",

    coreHeading: "Pangunahing Patakaran sa Payout",
    coreBullets: [
      "Nagbabayad lang kami kapag natanggap na talaga ng linkmint.co ang pondo mula sa affiliate partner (walang eksepsiyon).",
      "Sa unang 30 araw, may Honeymoon Period. Sa panahong ito, maaaring maantala ang payout hanggang ma‑Approve ng network ang komisyon.",
      "Maagang payout (float) ay ibinibigay lang kung: (1) Markadong Approved ang komisyon ng network, (2) maayos ang iyong TrustScore, at (3) may available na float. Hindi kasama ang Amazon sa maagang payouts.",
      "Ibabawas ang PayPal fees sa payout. Makikita mo ang fees at net bago mag‑confirm.",
    ],

    statusHeading: "Ano ang Nakaaapekto sa Timing ng Payout?",
    statusItems: [
      {
        title: "Approval Status ng Network",
        body:
          "Kailangang maging Pending → Approved ang bawat komisyon mula sa affiliate network bago namin ito maipadala. Ito ang pinaka‑mahalagang salik.",
      },
      {
        title: "Honeymoon Period (Unang 30 Araw)",
        body:
          "May safety buffer ang mga bagong account. Kahit Approved na, may ilang network na may hawak pa rin ng pondo—makikita mo ang unlock dates sa dashboard.",
      },
      {
        title: "TrustScore",
        body:
          "Ang mabuting asal (tunay na referrals, walang abuso, tuloy‑tuloy na aktibidad) ay nagbubukas ng mas maagang eligibility para sa float sa Approved na komisyon.",
      },
      {
        title: "Bilis ng Merchant/Network",
        body:
          "Iba‑iba ang bilis ng bayad per merchant/network. May label na Fast vs Slow sa dashboard para alam mo ang aasahan.",
      },
    ],

    phHeading: "Mga Timeline sa PH Merchants (Paalala)",
    phNote:
      "Karaniwang oras lamang ang nasa ibaba at hindi garantiya. Ipinapakita ng iyong dashboard ang eksaktong petsa ng hold/unlock bawat komisyon.",
    phRows: [
      { merchant: "Shopee (PH)", cookie: "7 araw", delay: "~30 araw", notes: "Mas mabagal minsan sa panahon ng promos/flash sales." },
      { merchant: "Lazada (PH)", cookie: "7–14 araw", delay: "~30–45 araw", notes: "Nagbabago depende sa kategorya at cancellation rate." },
    ],

    methodsHeading: "Paraan ng Payout",
    methods: [
      {
        title: "PayPal (Aktibo)",
        body:
          "Available na para sa US at PH users. Awtomatikong ibinabawas ang fees. Siguraduhing makakatanggap ng bayad ang iyong PayPal account.",
      },
      {
        title: "GCash (Paparating)",
        body:
          "Naka‑handa na ang sistema para sa GCash at io‑on namin ito pagkatapos ng PH corporate at banking verification. Maidaragdag mo ang GCash number sa Settings.",
      },
      {
        title: "Bank Transfer (Susunod)",
        body:
          "Bubuksan namin ang tradisyunal na bank transfer sa PH kapag kumpleto na ang aming local rails. Asahan ang standard bank fees at verification checks.",
      },
    ],

    speedHeading: "Fast vs Slow Payouts (Paliwanag)",
    speedBody:
      "Ang \"Fast\" ay mga network na mabilis mag‑Approve at mag‑remit ng pondo pagkatapos ng return window. Ang \"Slow\" ay mas matagal mag‑Approve o mag‑remit. Nilalagyan ng label ang bawat komisyon sa dashboard para makapag‑plan ka.",

    safetyHeading: "Kaligtasan at Tamang Paggamit",
    safetyBullets: [
      "Bawal ang self‑buying, pekeng traffic, coupon abuse, at ipinagbabawal na promotion sources.",
      "Kapag maraming flags, bababa ang TrustScore at maaaring ma‑hold ang payout o ma‑review ang account.",
      "Nakikipag‑ugnayan kami sa affiliate partners para sa fraud reviews. Ang final decision ng network ang susunod tungkol sa eligibility ng payout.",
    ],

    faqHeading: "Mabilis na FAQ",
    faqs: [
      {
        q: "Bakit hindi agad nababayaran pagkatapos ng sale?",
        a: "Dahil puwedeng ma‑cancel/ma‑return ang order. Naghihintay ang networks hanggang matapos ang window na iyon at saka magpapadala ng pondo. Doon lang kami makakabayad.",
      },
      {
        q: "Paano ang sa Amazon?",
        a: "Mas mahigpit at mas mabagal ang Amazon. Wala kaming maagang float sa Amazon—kahit Approved—hangga’t hindi pa dumarating ang pondo.",
      },
      {
        q: "Paano ang fees?",
        a: "Ibabawas namin ang PayPal fee at ipapakita ang net bago ka mag‑confirm. Kapag live na ang GCash/bank, ipapakita rin namin ang mga iyon.",
      },
      {
        q: "Paano mapapabilis ang payout?",
        a: "Tumutok sa quality traffic, sundin ang allowed‑source rules, at panatilihing malinis ang TrustScore. Pumili rin ng mas mabilis magbayad na merchants kapag kaya.",
      },
    ],

    contactHeading: "Kailangan ng tulong?",
    contactBody:
      "Mag‑message sa in‑app help o email admin@linkmint.co. Hindi kami mangangako ng payout bago dumating ang pondo—para ito sa kaligtasan ng lahat.",
  },
} satisfies Record<Lang, any>;

export default function TrustCenterPage() {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("lm_trust_lang")) as Lang | null;
    if (saved === "en" || saved === "tl") setLang(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("lm_trust_lang", lang);
  }, [lang]);

  const L = t[lang];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{L.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{L.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{L.langLabel}</span>
          <div className="inline-flex overflow-hidden rounded-2xl border">
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1 text-sm ${
                lang === "en" ? "bg-primary text-primary-foreground" : "bg-background"
              }`}
            >
              {L.btnEN}
            </button>
            <button
              onClick={() => setLang("tl")}
              className={`px-3 py-1 text-sm ${
                lang === "tl" ? "bg-primary text-primary-foreground" : "bg-background"
              }`}
            >
              {L.btnTL}
            </button>
          </div>
        </div>
      </header>

      {/* Core Principles */}
      <section className="mb-8 rounded-2xl border p-5">
        <h2 className="mb-3 text-xl font-semibold">{L.coreHeading}</h2>
        <ul className="list-disc space-y-2 pl-6 text-sm">
          {L.coreBullets.map((b: string, i: number) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </section>

      {/* Timing Factors */}
      <section className="mb-8 rounded-2xl border p-5">
        <h2 className="mb-3 text-xl font-semibold">{L.statusHeading}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {L.statusItems.map((item: any, i: number) => (
            <div key={i} className="rounded-xl border p-4">
              <h3 className="mb-1 font-medium">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PH Timelines */}
      <section className="mb-8 rounded-2xl border p-5">
        <h2 className="mb-3 text-xl font-semibold">{L.phHeading}</h2>
        <p className="mb-3 text-sm text-muted-foreground">{L.phNote}</p>
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Merchant</th>
                <th className="p-3">Cookie Window</th>
                <th className="p-3">Typical Payout Delay</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {L.phRows.map((row: any, i: number) => (
                <tr key={i} className="border-t">
                  <td className="p-3">{row.merchant}</td>
                  <td className="p-3">{row.cookie}</td>
                  <td className="p-3">{row.delay}</td>
                  <td className="p-3">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Methods */}
      <section className="mb-8 rounded-2xl border p-5">
        <h2 className="mb-3 text-xl font-semibold">{L.methodsHeading}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {L.methods.map((m: any, i: number) => (
            <div key={i} className="rounded-xl border p-4">
              <h3 className="mb-1 font-medium">{m.title}</h3>
              <p className="text-sm text-muted-foreground">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fast vs Slow */}
      <section className="mb-8 rounded-2xl border p-5">
        <h2 className="mb-3 text-xl font-semibold">{L.speedHeading}</h2>
        <p className="text-sm text-muted-foreground">{L.speedBody}</p>
      </section>

      {/* Safety */}
      <section className="mb-8 rounded-2xl border p-5">
        <h2 className="mb-3 text-xl font-semibold">{L.safetyHeading}</h2>
        <ul className="list-disc space-y-2 pl-6 text-sm">
          {L.safetyBullets.map((b: string, i: number) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="mb-8 rounded-2xl border p-5">
        <h2 className="mb-3 text-xl font-semibold">{L.faqHeading}</h2>
        <div className="space-y-4">
          {L.faqs.map((f: any, i: number) => (
            <details key={i} className="rounded-xl border p-4">
              <summary className="cursor-pointer font-medium">{f.q}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="mb-4 rounded-2xl border p-5">
        <h2 className="mb-2 text-xl font-semibold">{L.contactHeading}</h2>
        <p className="text-sm text-muted-foreground">{L.contactBody}</p>
      </section>
    </div>
  );
}
