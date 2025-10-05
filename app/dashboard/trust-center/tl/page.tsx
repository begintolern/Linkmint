// app/dashboard/trust-center/tl/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";

export default function TrustCenterTagalog() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-teal-700">Sentro ng Tiwala (Tagalog)</h1>
      <p className="text-gray-700">
        Maligayang pagdating sa <strong>linkmint.co</strong> — isang plataporma kung saan maaari kang
        kumita ng tunay na komisyon mula sa mga pinapayagang mangangalakal sa pamamagitan ng
        etikal na pagbahagi ng mga link.
      </p>

      <section>
        <h2 className="text-xl font-semibold mt-6">🪙 Kailan binabayaran ang mga komisyon?</h2>
        <p className="text-gray-700">
          Ang mga komisyon ay binabayaran lamang kapag ang mga kasosyong mangangalakal ay
          nagpadala na ng pondo sa Linkmint. Hindi pinapayagan ang mga paunang bayad o
          “advance” habang nakabinbin pa ang kumpirmasyon mula sa merchant.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6">🤝 Patakaran sa Tiwala</h2>
        <p className="text-gray-700">
          Ang sistema ng tiwala o <strong>TrustScore</strong> ay ginagamit upang masukat ang
          maayos na paggamit ng platform. Kung mapagkakatiwalaan ang isang user, maaari siyang
          makakuha ng mas mabilis na pagproseso ng payout o dagdag na bonus.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6">💸 Panahon ng Paghihintay</h2>
        <p className="text-gray-700">
          Karaniwang inaabot ng 30 hanggang 90 araw bago makuha ng Linkmint ang bayad mula sa mga
          merchant. Kapag natanggap na ang bayad, saka pa lamang ipoproseso ang iyong payout.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6">📜 Mga Patakaran sa Pagbabayad</h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>Ang mga payout ay isinasagawa sa pamamagitan ng GCash o bank transfer.</li>
          <li>Ang mga bayarin sa transaksyon ay awtomatikong ibabawas.</li>
          <li>Ang mga na-void o kinanselang transaksyon ay hindi babayaran.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6">🔒 Pagkapribado at Seguridad</h2>
        <p className="text-gray-700">
          Pinangangalagaan ng Linkmint ang iyong impormasyon. Hindi ibinabahagi sa mga
          advertiser o third parties ang iyong personal na detalye maliban kung kailangan
          para sa pagproseso ng payout.
        </p>
      </section>

      <div className="pt-6 mt-10 border-t">
        <Link href="/dashboard/trust-center" className="text-teal-700 hover:underline">
          ← Bumalik sa English Version
        </Link>
      </div>
    </div>
  );
}
