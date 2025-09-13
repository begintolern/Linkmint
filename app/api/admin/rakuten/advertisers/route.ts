// app/api/admin/rakuten/advertisers/route.ts
import { NextResponse } from "next/server";
import { listPartnerships } from "@/lib/partners/rakutenClient";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

type Advertiser = {
  id?: number | string;
  name?: string;
  status?: string;
  network?: number;
  categories?: string[];
  details?: string;
};

function normalizeStatus(raw: string | null): "pending" | "approved" | "declined" {
  const v = (raw ?? "").toLowerCase();
  if (v === "approved" || v === "declined" || v === "pending") return v;
  return "pending";
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") || 1);
    const pageSize = Number(url.searchParams.get("pageSize") || 10);
    const q = url.searchParams.get("q")?.trim() || "";
    const statusNorm = normalizeStatus(url.searchParams.get("status"));
    const statusForRakuten = statusNorm.toUpperCase(); // API expects APPROVED|PENDING|DECLINED

    // Fetch partnerships from Rakuten and flatten to advertisers[]
    const pr = await listPartnerships({ status: statusForRakuten, page, pageSize });

    const partnerships = Array.isArray((pr as any)?.partnerships)
      ? ((pr as any).partnerships as any[])
      : [];

    let advertisers: Advertiser[] = partnerships.map((p) => {
      const adv = p?.advertiser ?? {};
      return {
        id: adv.id,
        name: adv.name,
        status: p?.status ?? adv.status,
        network: adv.network,
        categories: Array.isArray(adv.categories) ? adv.categories : [],
        details: adv.details,
      };
    });

    if (q) {
      const qlc = q.toLowerCase();
      advertisers = advertisers.filter((a) => (a.name || "").toLowerCase().includes(qlc));
    }

    const metaIn = (pr as any)?._metadata ?? {};
    return NextResponse.json(
      {
        _metadata: {
          page: metaIn.page ?? page,
          limit: metaIn.limit ?? pageSize,
          total: metaIn.total ?? advertisers.length,
          _links: metaIn._links ?? undefined,
          source: "partnerships-v1",
          status: statusNorm,
        },
        advertisers,
      },
      { status: 200 }
    );
  } catch (err: any) {
    const message = err?.message || "Failed to load Rakuten advertisers from partnerships.";
    return NextResponse.json({ error: "internal_error", message }, { status: 500 });
  }
}
