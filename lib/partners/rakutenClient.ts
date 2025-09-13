// lib/partners/rakutenClient.ts
const BASE = "https://api.linksynergy.com";
const TOKEN_URL = `${BASE}/token`;

type OAuthToken = { access_token: string; token_type: "Bearer"; expires_in: number };

let cachedToken: { token?: string; expiresAt?: number } = {};

/**
 * Fetch OAuth token. Supports manual override with RAKUTEN_BEARER
 */
async function fetchToken(): Promise<string> {
  // ---- TEMP OVERRIDE: use a pre-generated token from the portal if provided ----
  const manual = process.env.RAKUTEN_BEARER;
  if (manual && manual.trim().length > 0) {
    return manual.trim();
  }
  // -----------------------------------------------------------------------------

  const id = process.env.RAKUTEN_CLIENT_ID!;
  const secret = process.env.RAKUTEN_CLIENT_SECRET!;
  const scope = process.env.RAKUTEN_SCOPE!; // your Publisher SID

  const now = Date.now();
  if (cachedToken.token && cachedToken.expiresAt && now < cachedToken.expiresAt - 30_000) {
    return cachedToken.token;
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope }),
  });

  if (!res.ok) throw new Error(`Rakuten token ${res.status}: ${await res.text()}`);

  const json = (await res.json()) as OAuthToken;
  cachedToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

async function rakutenGET<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
  const token = await fetchToken();
  const qs =
    query && Object.keys(query).length
      ? "?" +
        Object.entries(query)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";
  const res = await fetch(`${BASE}${path}${qs}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Rakuten GET ${path} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function rakutenPOST<T>(path: string, body: unknown): Promise<T> {
  const token = await fetchToken();
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Rakuten POST ${path} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

/** ------- Types (based on your portal schemas) ------- */

// advertiserSearchResponse { midlist: {...} }
export type AdvertiserSearchResponse = {
  midlist: {
    mids?: Array<string | number>;
    [k: string]: unknown;
  };
};

// partnershipsResponse { _metadata: {...}, partnerships: [...] }
export type Partnership = {
  advertiserId?: string | number;
  advertiserName?: string;
  status?: "APPROVED" | "PENDING" | "DECLINED" | string;
  vertical?: string;
  country?: string;
  [k: string]: unknown;
};
export type PartnershipsResponse = {
  _metadata: Record<string, unknown>;
  partnerships: Partnership[];
};

/** ------- Client helpers ------- */

// v2 advertisers catalog
export async function listAdvertisers(params: { page?: number; pageSize?: number; q?: string } = {}) {
  return rakutenGET<{ data?: unknown[]; total?: number }>(`/v2/advertisers`, {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 50,
    q: params.q,
  });
}

// advertiserSearch (older schema)
export async function advertiserSearch(params: { keyword?: string; categoryId?: number; page?: number } = {}) {
  return rakutenGET<AdvertiserSearchResponse>(`/advertiserssearch/1.0`, {
    keyword: params.keyword,
    categoryId: params.categoryId,
    page: params.page ?? 1,
  });
}

// your partnerships
export async function listPartnerships(params: { page?: number; pageSize?: number; status?: string } = {}) {
  return rakutenGET<PartnershipsResponse>(`/v1/partnerships`, {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 50,
    status: params.status,
  });
}

// product search
export async function productSearch(params: { keyword?: string; advertiserId?: string | number; page?: number }) {
  return rakutenGET<any>(`/productsearch/1.0`, {
    keyword: params.keyword,
    advertiserId: params.advertiserId,
    page: params.page ?? 1,
  });
}

// deep-link generation
export async function createDeepLink(productUrl: string) {
  return rakutenPOST<any>(`/v1/links/deep_links`, { url: productUrl });
}
