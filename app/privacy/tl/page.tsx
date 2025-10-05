// app/privacy/tl/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";

export default function PrivacyPolicyTagalog() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-gray-800">
      <h1 className="text-2xl font-bold mb-6">Patakaran sa Privacy</h1>

      <p className="mb-4">
        Sa <strong>linkmint.co</strong>, pinahahalagahan namin ang iyong privacy. Ang dokumentong
        ito ay nagpapaliwanag kung paano namin kinokolekta, ginagamit, at pinoprotektahan ang iyong
        impormasyon. Kung may salungatan sa pagitan ng bersyong Tagalog at English, ang{" "}
        <strong>English version</strong> ang mangingibabaw.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">1. Impormasyon na Kinokolekta</h2>
      <p className="mb-4">
        Kinokolekta namin ang impormasyon na boluntaryo mong ibinibigay (tulad ng email at mga
        detalye ng payout), pati na rin ang awtomatikong data gaya ng IP address at cookies para
        sa seguridad at analytics.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">2. Paggamit ng Iyong Impormasyon</h2>
      <p className="mb-4">
        Ginagamit namin ang iyong impormasyon upang mapatakbo ang serbisyo, iproseso ang mga
        payout, at magpadala ng mga notipikasyon tungkol sa iyong account o mga promosyon ng
        Linkmint.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">3. Pagbabahagi ng Data</h2>
      <p className="mb-4">
        Hindi namin ibinabahagi ang iyong personal na impormasyon sa mga third-party maliban kung
        kinakailangan sa mga partner merchants, payment providers (hal. PayPal o GCash), o kapag
        iniaatas ng batas.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">4. Seguridad</h2>
      <p className="mb-4">
        Gumagamit ang Linkmint ng mga industry-standard encryption at monitoring tools upang
        maprotektahan ang iyong data laban sa hindi awtorisadong paggamit.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">5. Mga Karapatan ng User</h2>
      <p className="mb-4">
        Maaari mong hilingin ang pag-access o pagbura ng iyong data anumang oras sa pamamagitan ng{" "}
        <Link href="mailto:admin@linkmint.co" className="text-teal-700 hover:underline">
          admin@linkmint.co
        </Link>.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">6. Mga Update sa Patakaran</h2>
      <p className="mb-4">
        Maaaring baguhin ng Linkmint ang patakaran sa privacy paminsan-minsan. Ipo-post ang mga
        pagbabago sa pahinang ito, at ang petsa ng pinakabagong bersyon ay palaging makikita sa
        ibaba.
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
        <Link href="/trust-center/tl" className="text-teal-700 hover:underline">
          Sentro ng Tiwala
        </Link>.
      </p>
    </div>
  );
}
