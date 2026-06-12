import type { Campaign, DailyCampaignMetric } from "@/lib/types";

/**
 * Conector a Google Ads API (REST, searchStream con GAQL).
 *
 * Variables de entorno requeridas:
 *  - GOOGLE_ADS_DEVELOPER_TOKEN: token de desarrollador (API Center)
 *  - GOOGLE_ADS_CLIENT_ID / GOOGLE_ADS_CLIENT_SECRET: credenciales OAuth2
 *  - GOOGLE_ADS_REFRESH_TOKEN: refresh token del usuario con acceso a la cuenta
 *  - GOOGLE_ADS_CUSTOMER_ID: ID de la cuenta (sin guiones, ej. 1234567890)
 *  - GOOGLE_ADS_LOGIN_CUSTOMER_ID: (opcional) ID del MCC si se accede vía manager
 */

const ADS_API = "https://googleads.googleapis.com/v18";

export function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
      process.env.GOOGLE_ADS_CLIENT_ID &&
      process.env.GOOGLE_ADS_CLIENT_SECRET &&
      process.env.GOOGLE_ADS_REFRESH_TOKEN &&
      process.env.GOOGLE_ADS_CUSTOMER_ID,
  );
}

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google OAuth ${res.status}: ${await res.text()}`);
  const json: { access_token: string } = await res.json();
  return json.access_token;
}

interface GoogleAdsRow {
  campaign: { id: string; name: string; status: string };
  segments: { date: string };
  metrics: { costMicros?: string; impressions?: string; clicks?: string; conversions?: number };
}

export async function fetchGoogleCampaignData(
  since: string,
  until: string,
): Promise<{ campaigns: Campaign[]; metrics: DailyCampaignMetric[] }> {
  const token = await getAccessToken();
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!;

  const query = `
    SELECT campaign.id, campaign.name, campaign.status,
           segments.date, metrics.cost_micros, metrics.impressions,
           metrics.clicks, metrics.conversions
    FROM campaign
    WHERE segments.date BETWEEN '${since}' AND '${until}'
      AND metrics.cost_micros > 0`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    "Content-Type": "application/json",
  };
  if (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) {
    headers["login-customer-id"] = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
  }

  const res = await fetch(`${ADS_API}/customers/${customerId}/googleAds:searchStream`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`Google Ads API ${res.status}: ${await res.text()}`);

  // searchStream devuelve un array de chunks, cada uno con results[]
  const chunks: { results?: GoogleAdsRow[] }[] = await res.json();

  const campaignsById = new Map<string, Campaign>();
  const metrics: DailyCampaignMetric[] = [];

  for (const chunk of chunks) {
    for (const row of chunk.results ?? []) {
      const id = String(row.campaign.id);
      if (!campaignsById.has(id)) {
        campaignsById.set(id, {
          id,
          nombre: row.campaign.name,
          estado: row.campaign.status === "ENABLED" ? "ACTIVE" : "PAUSED",
          plataforma: "google",
          objetivo: "SEARCH",
        });
      }
      metrics.push({
        campaignId: id,
        date: row.segments.date,
        spend: Number(row.metrics.costMicros ?? 0) / 1_000_000,
        impressions: parseInt(row.metrics.impressions ?? "0", 10),
        clicks: parseInt(row.metrics.clicks ?? "0", 10),
        leads: Math.round(row.metrics.conversions ?? 0),
      });
    }
  }

  return { campaigns: [...campaignsById.values()], metrics };
}
