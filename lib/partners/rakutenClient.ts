// lib/partners/rakutenClient.ts
// Dual-host client: LinkShare + Advertising domains

const BASE_LS = "https://api.linksynergy.com"; // LinkShare (legacy) base
const BASE_ADS = "https://api.rakutenadvertising.com"; // Advertising (new) base
const TOKEN_URL = "https://api.rakutenadvertising.com/token";

type OAuthToken = { access_token: string; token_type: "Bearer"; expires_in: number };

let cachedToken: { token?: string; expiresAt?: number } = {};

// ---------------- Token fetchers ----------------

async function fetchTokenLS(): Promise<string> {
  const id = (process.env.RAKUTEN_CLIENT_ID || "").trim();
  const secret = (process.env.RAKUTEN_CLIENT_SECRET || "").trim();
  const scope = (process.env.RAKUTEN_SCOPE || "").trim(); // Publisher SID

  if (!id || !secret || !scope) {
    throw new Error("Missing Rakuten env vars: RAKUTEN_CLIENT_ID / RAKUTEN_CLIENT_SECRET / RAKUTEN_SCOPE");
  }

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

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Rakuten LS token ${res.status}: ${body}`);
  }

  const json = (await res.json()) as OAuthToken;
  cachedToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
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

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Rakuten ADS token ${res.status}: ${body}`);
  }

  const json = (await res.json()) as OAuthToken;
  cachedToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

// ---------------- Helpers ----------------

async function rakutenGET<T>(
  path: string,
  query?: Record<string, string | number | undefined>,
  useAds = false
): Promise<T> {
  const token = useAds ? await fetchTokenADS() : await fetchTokenLS();
  const qs =
    query && Object.keys(query).length
      ? "?" +
        Object.entries(query)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";
  const base = useAds ? BASE_ADS : BASE_LS;
  const res = await fetch(`${base}${path}${qs}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Rakuten ${useAds ? "ADS" : "LS"} GET ${path} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function rakutenPOST<T>(path: string, body: unknown, useAds = false): Promise<T> {
  const token = useAds ? await fetchTokenADS() : await fetchTokenLS();
  const base = useAds ? BASE_ADS : BASE_LS;
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Rakuten ${useAds ? "ADS" : "LS"} POST ${path} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ---------------- Types ----------------

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

// ---------------- Client API ----------------

export async function listAdvertisers(params: { page?: number; pageSize?: number; q?: string } = {}) {
  return rakutenGET<{ data?: unknown[]; total?: number }>(`/v2/advertisers`, {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 50,
    q: params.q,
  }, true); // use ADS
}

export async function advertiserSearch(params: { keyword?: string; categoryId?: number; page?: number } = {}) {
  return rakutenGET<AdvertiserSearchResponse>(`/advertiserssearch/1.0`, {
    keyword: params.keyword,
    categoryId: params.categoryId,
    page: params.page ?? 1,
  });
}

export async function listPartnerships(params: { page?: number; pageSize?: number; status?: string } = {}) {
  return rakutenGET<PartnershipsResponse>(`/v1/partnerships`, {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 50,
    status: params.status,
  });
}

export async function productSearch(params: { keyword?: string; advertiserId?: string | number; page?: number }) {
  return rakutenGET<any>(`/productsearch/1.0`, {
    keyword: params.keyword,
    advertiserId: params.advertiserId,
    page: params.page ?? 1,
  });
}

export async function createDeepLink(productUrl: string) {
  return rakutenPOST<any>(`/v1/links/deep_links`, { url: productUrl }, true);
}
