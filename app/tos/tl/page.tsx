// app/tos/tl/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";

export default function TermsOfServiceTagalog() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-gray-800">
      <h1 className="text-2xl font-bold mb-6">Mga Tuntunin ng Serbisyo</h1>

      <p className="mb-4">
        Maligayang pagdating sa <strong>linkmint.co</strong>. Sa pamamagitan ng paggamit ng aming
        platform, sumasang-ayon ka sa mga tuntuning nakasaad dito. Ang bersyong ito ay isinalin
        sa Filipino upang mas madaling maunawaan, ngunit kung may hindi pagkakatugma sa pagitan
        ng Tagalog at English na bersyon, ang <strong>English version</strong> ang mananaig.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">1. Paglalarawan ng Serbisyo</h2>
      <p className="mb-4">
        Ang Linkmint ay isang platform na nagbibigay-daan sa mga user na kumita ng komisyon sa
        pamamagitan ng ligtas at legal na pagbabahagi ng mga link ng partner merchants. Lahat ng
        kita ay nakadepende sa kumpirmadong bayad ng mga merchant sa Linkmint.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">2. Pagiging Miyembro</h2>
      <p className="mb-4">
        Dapat ay hindi bababa sa 18 taong gulang upang magamit ang platform. Ang pagbibigay ng
        maling impormasyon o pandaraya ay maaaring magresulta sa agarang suspensyon o
        pagkakansela ng account.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">3. Mga Payout</h2>
      <p className="mb-4">
        Ang mga payout ay inilalabas lamang pagkatapos matanggap ng Linkmint ang pondo mula sa
        mga merchant. Ang karaniwang proseso ay maaaring tumagal ng hanggang 90 araw. Ang mga
        komisyon na nakansela o voided ng merchant ay hindi babayaran.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">4. Limitasyon ng Pananagutan</h2>
      <p className="mb-4">
        Hindi mananagot ang Linkmint sa anumang pagkawala o pinsala na dulot ng maling paggamit
        ng platform o mga serbisyo ng third-party.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">5. Pagbabago ng Mga Tuntunin</h2>
      <p className="mb-4">
        Maaaring baguhin ng Linkmint ang mga tuntunin anumang oras. Ang mga pagbabago ay
        ipapaalam sa pamamagitan ng website o email.
      </p>

      <p className="mt-8 text-sm text-gray-600">
        Huling na-update: {new Date().toLocaleDateString("en-PH")}
      </p>

      <p className="mt-6 text-sm">
        Basahin din ang{" "}
        <Link href="/privacy/tl" className="text-teal-700 hover:underline">
          Patakaran sa Privacy
        </Link>{" "}
        at{" "}
        <Link href="/trust-center/tl" className="text-teal-700 hover:underline">
          Sentro ng Tiwala
        </Link>.
      </p>
    </div>
  );
}
