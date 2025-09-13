// app/api/admin/rakuten/advertisers/route.ts
import { NextResponse } from "next/server";
import { listPartnerships } from "@/lib/partners/rakutenClient";

/**
 * This route flattens Rakuten partnerships into an `advertisers[]` array
 * so the existing UI can list pending/approved advertisers easily.
 *
 * Example:
 *   /api/admin/rakuten/advertisers?status=pending&page=1&pageSize=10&q=noah
 */

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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? "pending"; // APPROVED | PENDING | DECLINED
    const page = Number(url.searchParams.get("page") || 1);
    const pageSize = Number(url.searchParams.get("pageSize") || 10);
    const q = url.searchParams.get("q")?.trim() || "";

    // Pull partnerships from Rakuten (server-to-server)
    const pr = await listPartnerships({ status, page, pageSize });

    // Defensive guards
    const partnerships = Array.isArray((pr as any)?.partnerships)
      ? (pr as any).partnerships as any[]
      : [];

    // Flatten to advertisers[]
    let advertisers: Advertiser[] = partnerships.map((p) => {
      const adv = p?.advertiser ?? {};
      return {
        id: adv.id,
        name: adv.name,
        status: p?.status ?? adv.status, // prefer partnership status if present
        network: adv.network,
        categories: Array.isArray(adv.categories) ? adv.categories : [],
        details: adv.details, // e.g. "/v2/advertisers/45632"
      };
    });

    // Optional client-side filter by name (case-insensitive)
    if (q) {
      const qlc = q.toLowerCase();
      advertisers = advertisers.filter((a) =>
        (a.name || "").toLowerCase().includes(qlc)
      );
    }

    const metaIn = (pr as any)?._metadata ?? {};
    const resp = {
      _metadata: {
        page: metaIn.page ?? page,
        limit: metaIn.limit ?? pageSize,
        total: metaIn.total ?? advertisers.length, // keep remote total if present; fallback to filtered count
        _links: metaIn._links ?? undefined,
        source: "partnerships-v1", // helpful hint for the UI
        status, // echoed for clarity
      },
      advertisers,
    };

    return NextResponse.json(resp, { status: 200 });
  } catch (err: any) {
    // Bubble up Rakuten client errors with useful context
    const message =
      err?.message ||
      "Failed to load Rakuten advertisers from partnerships.";
    return NextResponse.json(
      { error: "internal_error", message },
      { status: 500 }
    );
  }
}
