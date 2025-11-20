// app/demo/shopee/page.tsx
export const dynamic = "force-dynamic";

export default function ShopeeDemoPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="text-center">
        <h1 className="text-3xl font-bold">Shopee Merchant Demo (For Review)</h1>
        <p className="mt-3 text-slate-600">
          This page demonstrates how Shopee links and offers appear inside
          linkmint.co for audit and review purposes.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          This page is not linked publicly and is only used for affiliate platform verification.
        </p>
      </header>

      {/* SECTION: HOW LINKS ARE GENERATED */}
      <section className="mt-12 rounded-xl border p-6 bg-orange-50">
        <h2 className="text-xl font-semibold text-orange-700">
          How Shopee Links Are Generated
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          Linkmint users paste a Shopee product URL into the SmartLink Generator
          inside their dashboard. The system detects the merchant automatically
          and converts the URL into a trackable affiliate SmartLink.
        </p>

        <div className="mt-4 rounded-lg bg-white p-4 border">
          <p className="text-xs text-slate-500">Example Input URL:</p>
          <p className="font-mono text-sm mt-1">
            https://shopee.ph/sample-product-url-12345
          </p>

          <p className="text-xs text-slate-500 mt-4">Generated SmartLink:</p>
          <p className="font-mono text-sm mt-1 text-blue-600 underline">
            https://linkmint.co/s/abc123shopee
          </p>

          <p className="text-xs text-slate-500 mt-4">
            Destination URL (after redirect):
          </p>
          <p className="font-mono text-sm mt-1">
            https://shopee.ph/sample-product-url-12345?lm_subid=abc123shopee&utm_source=linkmint
          </p>
        </div>
      </section>

      {/* SECTION: PREVIEW BLOCK */}
      <section className="mt-12 rounded-xl border p-6">
        <h2 className="text-xl font-semibold text-slate-900">
          Example Shopee Offer Listing
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Below is an example of how a Shopee product appears when users create
          a SmartLink. This is a static mock preview used for platform verification.
        </p>

        <div className="mt-6 flex gap-4 rounded-lg border p-4 bg-white">
          <img
            src="https://via.placeholder.com/120x120.png?text=Shopee+Product"
            alt="Product"
            className="h-28 w-28 rounded-lg object-cover"
          />
          <div className="flex flex-col justify-between">
            <div>
              <p className="font-semibold text-slate-800">
                Sample Shopee Product Name
              </p>
              <p className="text-orange-600 font-bold mt-1">₱399</p>
            </div>

            <a
              href="#"
              className="inline-flex mt-3 w-max rounded-md bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700"
            >
              Get SmartLink
            </a>
          </div>
        </div>
      </section>

      {/* SECTION: HOW USERS SHARE */}
      <section className="mt-12 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">How Users Share Shopee Links</h2>
        <p className="mt-2 text-sm text-slate-600">
          After generating the SmartLink, users can share it on:
        </p>

        <ul className="mt-3 list-disc pl-5 text-sm text-slate-700 space-y-1">
          <li>Facebook groups</li>
          <li>Messenger</li>
          <li>TikTok comments / bio</li>
          <li>Instagram stories</li>
          <li>Viber communities</li>
          <li>WhatsApp chats</li>
        </ul>

        <p className="mt-4 text-sm text-slate-600">
          All clicks are recorded inside linkmint.co and matched to the
          merchant’s affiliate tracking system.
        </p>
      </section>

      {/* SECTION: TRACKING */}
      <section className="mt-12 rounded-xl border p-6 bg-slate-50">
        <h2 className="text-xl font-semibold text-slate-900">
          Tracking & Attribution
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          When a user clicks a SmartLink, linkmint.co logs:
        </p>

        <ul className="mt-3 list-disc pl-5 text-sm text-slate-700 space-y-1">
          <li>SmartLink ID</li>
          <li>Timestamp</li>
          <li>Merchant: Shopee</li>
          <li>User who created the link</li>
          <li>Redirect destination</li>
        </ul>

        <p className="mt-4 text-sm text-slate-600">
          This ensures full transparency and merchant-specific attribution for
          Shopee during audits.
        </p>
      </section>
    </main>
  );
}
