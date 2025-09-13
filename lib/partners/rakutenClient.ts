// lib/partners/rakutenClient.ts
// Dual-host client: LinkShare (LS) + Rakuten Advertising (ADS), with matching token issuers.

const LS_BASE = "https://api.linksynergy.com";               // Partnerships, Product Search, Deep Links, legacy Advertiser Search
const LS_TOKEN_URL = "https://api.linksynergy.com/token";     // IMPORTANT: mint LS tokens from linksynergy.com

const ADS_BASE = "https://api.rakutenadvertising.com";        // /v2/advertisers lives here
const ADS_TOKEN_URL = "https://api.rakutenadvertising.com/token"; // Mint ADS tokens from rakutenadvertising.com

type OAuthToken = { access_token: string; token_type: "Bearer"; expires_in: number };

// separate caches so LS/ADS tokens don’t step on each other
let cachedTokenLS: { token?: string; expiresAt?: number } = {};
let cachedTokenADS: { token?: string; expiresAt?: number } = {};

/* ---------------- Token fetchers ---------------- */

async function fetchTokenLS(): Promise<string> {
  const id = (process.env.RAKUTEN_CLIENT_ID || "").trim();
  const secret = (process.env.RAKUTEN_CLIENT_SECRET || "").trim();
  const scope = (process.env.RAKUTEN_SCOPE || "").trim(); // Publisher SID

  if (!id || !secret || !scope) {
    throw new Error("Missing Rakuten env vars: RAKUTEN_CLIENT_ID / RAKUTEN_CLIENT_SECRET / RAKUTEN_SCOPE");
  }

  const now = Date.now();
  if (cachedTokenLS.token && cachedTokenLS.expiresAt && now < cachedTokenLS.expiresAt - 30_000) {
    return cachedTokenLS.token;
  }

  const res = await fetch(LS_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Rakuten LS token ${res.status}: ${body}`);
  }

  const json = (await res.json()) as OAuthToken;
  cachedTokenLS = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

async function fetchTokenADS(): Promise<string> {
  const id = (process.env.RAKUTEN_CLIENT_ID || "").trim();
  const secret = (process.env.RAKUTEN_CLIENT_SECRET || "").trim();
  const scope = (process.env.RAKUTEN_SCOPE || "").trim();

  if (!id || !secret || !scope) {
    throw new Error("Missing Rakuten env vars: RAKUTEN_CLIENT_ID / RAKUTEN_CLIENT_SECRET / RAKUTEN_SCOPE");
  }

  const now = Date.now();
  if (cachedTokenADS.token && cachedTokenADS.expiresAt && now < cachedTokenADS.expiresAt - 30_000) {
    return cachedTokenADS.token;
  }

  const res = await fetch(ADS_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Rakuten ADS token ${res.status}: ${body}`);
  }

  const json = (await res.json()) as OAuthToken;
  cachedTokenADS = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

/* ---------------- Low-level helpers ---------------- */

async function lsGET<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
  const token = await fetchTokenLS();
  const qs =
    query && Object.keys(query).length
      ? "?" +
        Object.entries(query)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";
  const res = await fetch(`${LS_BASE}${path}${qs}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Rakuten LS GET ${path} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function lsPOST<T>(path: string, body: unknown): Promise<T> {
  const token = await fetchTokenLS();
  const res = await fetch(`${LS_BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Rakuten LS POST ${path} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function adsGET<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
  const token = await fetchTokenADS();
  const qs =
    query && Object.keys(query).length
      ? "?" +
        Object.entries(query)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";
  const res = await fetch(`${ADS_BASE}${path}${qs}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Rakuten ADS GET ${path} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

/* ---------------- Types (loose, safe for schema drift) ---------------- */

export type AdvertiserSearchResponse = {
  midlist: { mids?: Array<string | number>; [k: string]: unknown };
};

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

/* ---------------- Client helpers ---------------- */

// ADS host: /v2/advertisers
export async function listAdvertisers(params: { page?: number; pageSize?: number; q?: string } = {}) {
  return adsGET<{ data?: unknown[]; total?: number }>(`/v2/advertisers`, {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 50,
    q: params.q,
  });
}

// LS host: legacy advertiser search (midlist)
export async function advertiserSearch(params: { keyword?: string; categoryId?: number; page?: number } = {}) {
  return lsGET<AdvertiserSearchResponse>(`/advertiserssearch/1.0`, {
    keyword: params.keyword,
    categoryId: params.categoryId,
    page: params.page ?? 1,
  });
}

// LS host: partnerships
export async function listPartnerships(params: { page?: number; pageSize?: number; status?: string } = {}) {
  return lsGET<PartnershipsResponse>(`/v1/partnerships`, {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 50,
    status: params.status,
  });
}

// LS host: product search
export async function productSearch(params: { keyword?: string; advertiserId?: string | number; page?: number }) {
  return lsGET<any>(`/productsearch/1.0`, {
    keyword: params.keyword,
    advertiserId: params.advertiserId,
    page: params.page ?? 1,
  });
}

// LS host: deep-link generation
export async function createDeepLink(productUrl: string) {
  return lsPOST<any>(`/v1/links/deep_links`, { url: productUrl });
}
