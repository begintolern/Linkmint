// app/api/admin/finder/health/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { curated } from "@/lib/finder/curated";
import { shopeeEnvReady } from "@/lib/finder/adapters/shopee";
import { lazadaEnvReady } from "@/lib/finder/adapters/lazada";

export async function GET() {
  const totalItems = curated.length;
  const source = "curated";

  const shopeeReady = shopeeEnvReady();
  const lazadaReady = lazadaEnvReady();

  // If any real connector is env-ready, mark as LIVE_READY (still using curated data for now)
  const anyLiveReady = shopeeReady || lazadaReady;
  const mode = anyLiveReady ? "LIVE_READY" : "PROVISION";

  const lastUpdated =
    process.env.FINDER_LAST_REFRESH || new Date().toISOString();

  return NextResponse.json({
    ok: true,
    mode,
    source,
    totalItems,
    connectors: {
      SHOPEE_PH: { ready: shopeeReady, missingEnv: [
        ...(!process.env.SHOPEE_PARTNER_ID ? ["SHOPEE_PARTNER_ID"] : []),
        ...(!process.env.SHOPEE_PARTNER_KEY ? ["SHOPEE_PARTNER_KEY"] : []),
        ...(!process.env.SHOPEE_SHOP_ID ? ["SHOPEE_SHOP_ID"] : []),
      ]},
      LAZADA_PH: { ready: lazadaReady, missingEnv: [
        ...(!process.env.LAZADA_APP_KEY ? ["LAZADA_APP_KEY"] : []),
        ...(!process.env.LAZADA_APP_SECRET ? ["LAZADA_APP_SECRET"] : []),
      ]},
    },
  });
}
