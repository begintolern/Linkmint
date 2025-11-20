// app/audit/shopee-demo/page.tsx

export const dynamic = "force-static";

import React from "react";
import Link from "next/link";

export default function ShopeeAuditDemoPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg">
        {/* Header */}
        <header className="mb-6">
          <p className="text-xs uppercase tracking-wide text-amber-400 font-semibold">
            Shopee Open Platform · Audit Demo
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-50">
            Shopee Smartlink Demo Page (Verification Only)
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            This page is provided exclusively for{" "}
            <span className="font-semibold">Shopee Open Platform</span> to
            verify how{" "}
            <span className="font-semibold text-amber-300">linkmint.co</span>{" "}
            handles Shopee URLs, generates smartlinks, and logs clicks.
            It is not part of the normal user flow.
          </p>
        </header>

        {/* Sample Product Section */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-2">
            1. Sample Shopee Product
          </h2>
          <div className="rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm space-y-1">
            <p>
              <span className="font-semibold text-slate-200">
                Product Name:
              </span>{" "}
              Mini Portable Fabric Steamer
            </p>
            <p>
              <span className="font-semibold text-slate-200">
                Original Shopee URL (sample only):
              </span>
            </p>
            <p className="font-mono text-xs break-all text-amber-300">
              https://shopee.ph/product/123456/78901234
            </p>
          </div>
        </section>

        {/* Smartlink Section */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-2">
            2. Generated Linkmint Smartlink (Demo Only)
          </h2>
          <div className="rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm space-y-3">
            <div>
              <p className="font-semibold text-slate-200">Smartlink URL:</p>
              <p className="font-mono text-xs break-all text-emerald-300">
                https://linkmint.co/l/shopee-demo123
              </p>
            </div>
            <p className="text-slate-300">
              When a user clicks this smartlink, linkmint.co:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
              <li>Redirects the visitor to the Shopee PH product page.</li>
              <li>Logs the click event in the Linkmint database.</li>
              <li>Associates the click with the correct user &amp; merchant.</li>
              <li>
                Prepares data for commission tracking via Shopee&apos;s
                affiliate system.
              </li>
            </ul>
          </div>
        </section>

        {/* Static Click Log Example */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-2">
            3. Example Click Log (Static Demo)
          </h2>
          <p className="text-sm text-slate-300 mb-2">
            The following is a static example showing how a Shopee click would
            be recorded inside linkmint.co. This demonstrates the structure of
            our internal tracking, not live data.
          </p>
          <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-950">
            <table className="min-w-full text-sm">
              <tbody>
                <tr className="border-b border-slate-800">
                  <td className="px-3 py-2 font-semibold text-slate-200">
                    Click ID
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-300">
                    demo-click-001
                  </td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="px-3 py-2 font-semibold text-slate-200">
                    Merchant
                  </td>
                  <td className="px-3 py-2 text-slate-300">Shopee</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="px-3 py-2 font-semibold text-slate-200">
                    Original URL
                  </td>
                  <td className="px-3 py-2 font-mono text-xs break-all text-amber-300">
                    https://shopee.ph/product/123456/78901234
                  </td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="px-3 py-2 font-semibold text-slate-200">
                    Smartlink
                  </td>
                  <td className="px-3 py-2 font-mono text-xs break-all text-emerald-300">
                    https://linkmint.co/l/shopee-demo123
                  </td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="px-3 py-2 font-semibold text-slate-200">
                    Timestamp
                  </td>
                  <td className="px-3 py-2 text-slate-300">
                    2025-11-20 10:32:15 (UTC)
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-semibold text-slate-200">
                    User
                  </td>
                  <td className="px-3 py-2 text-slate-300">
                    demo-user-001 (example Linkmint account)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Compliance Section */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-2">
            4. Traffic & Compliance Summary
          </h2>
          <p className="text-sm text-slate-300 mb-2">
            linkmint.co is a smartlink and micro-earnings platform. Our users
            share merchant links (including Shopee) via:
          </p>
          <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
            <li>Facebook and Facebook Groups</li>
            <li>TikTok and TikTok stories</li>
            <li>Messenger, Viber, WhatsApp</li>
            <li>Instagram and other social channels</li>
          </ul>
          <p className="text-sm text-slate-300 mt-3">
            All traffic is organic and user-generated. We do{" "}
            <span className="font-semibold">not</span> use:
          </p>
          <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
            <li>Bots or automated traffic</li>
            <li>Incentivized spam campaigns</li>
            <li>Misleading or forbidden ad creatives</li>
            <li>Unauthorized coupon scraping</li>
          </ul>
        </section>

        {/* Footer Note */}
        <footer className="pt-4 border-t border-slate-800 mt-4">
          <p className="text-xs text-slate-400">
            This page is intended solely for Shopee Open Platform / Affiliate
            audit and verification. Normal linkmint.co users do not see this
            route in navigation or product flows.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            For more information about linkmint.co, please visit{" "}
            <Link
              href="/"
              className="underline text-amber-300 hover:text-amber-200"
            >
              the main landing page
            </Link>{" "}
            or our{" "}
            <Link
              href="/tutorial"
              className="underline text-amber-300 hover:text-amber-200"
            >
              tutorial
            </Link>
            .
          </p>
        </footer>
      </div>
    </main>
  );
}
