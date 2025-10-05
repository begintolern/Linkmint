// app/trust-center/tl/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";

export default function TrustCenterTagalog() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-gray-800">
      <h1 className="text-2xl font-bold mb-6">Sentro ng Tiwala</h1>

      <p className="mb-4">
        Ang <strong>linkmint.co</strong> ay nakatuon sa pagiging transparent at patas para sa lahat
        ng gumagamit. Ang pahinang ito ay nagpapaliwanag kung paano namin pinangangalagaan ang
        pondo, pinoproseso ang mga komisyon, at pinoprotektahan ang iyong tiwala.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">1. Kailan ko matatanggap ang aking bayad?</h2>
      <p className="mb-4">
        Ang mga payout ay ginagawa lamang matapos matanggap ng Linkmint ang aktwal na bayad mula sa
        affiliate merchant (hal. Shopee, Lazada, Amazon, atbp.). Karaniwang tumatagal ito ng{" "}
        <strong>30 hanggang 90 araw</strong> depende sa patakaran ng merchant.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">
        2. Paano kung mataas ang aking TrustScore?
      </h2>
      <p className="mb-4">
        Ang mataas na TrustScore ay nagbibigay sa iyo ng access sa mas mabilis na payout kapag may
        sapat na pondo na sa Linkmint. Ngunit kahit mataas ang iyong score,{" "}
        <strong>hindi kami magbabayad nang hindi pa binabayaran ng merchant</strong>.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">3. Bakit may delay o pending ang payout?</h2>
      <p className="mb-4">
        Kapag nakatanggap kami ng bayad mula sa merchant, saka lamang namin ito ipapasa sa mga
        user. Ang status na “Pending” ay nangangahulugang hindi pa kami nakakatanggap ng kumpirmadong
        pondo mula sa affiliate network.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">
        4. Paano pinoprotektahan ng Linkmint ang mga user?
      </h2>
      <p className="mb-4">
        Gumagamit kami ng real-time monitoring at event tracking upang matiyak na bawat komisyon,
        payout, at referral ay maayos na naitatala. Mayroon din kaming{" "}
        <Link href="/trust-center" className="text-teal-700 hover:underline">
          English Trust Center
        </Link>{" "}
        para sa mga global user.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">
        5. Paano ko makakausap ang support?
      </h2>
      <p className="mb-4">
        Maaari kang makipag-ugnayan sa amin sa{" "}
        <Link href="mailto:admin@linkmint.co" className="text-teal-700 hover:underline">
          admin@linkmint.co
        </Link>{" "}
        para sa anumang katanungan o reklamo.
      </p>

      <p className="mt-8 text-sm text-gray-600">
        Huling na-update: {new Date().toLocaleDateString("en-PH")}
      </p>

      <p className="mt-6 text-sm">
        Basahin din ang{" "}
        <Link href="/tos/tl" className="text-teal-700 hover:underline">
          Mga Tuntunin ng Serbisyo
        </Link>{" "}
        at{" "}
        <Link href="/privacy/tl" className="text-teal-700 hover:underline">
          Patakaran sa Privacy
        </Link>.
      </p>
    </div>
  );
}
