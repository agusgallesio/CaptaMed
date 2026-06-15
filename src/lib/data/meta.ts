import type { Campaign, DailyCampaignMetric } from "@/lib/types";
import { getSettings } from "@/lib/settings";

/**
 * Conector a Meta Marketing API (Graph API).
 *
 * Credenciales (cargadas desde Integraciones o por variables de entorno):
 *  - META_ACCESS_TOKEN: token de sistema con permiso ads_read
 *  - META_AD_ACCOUNT_ID: ej. "act_1234567890"
 */

export const META_KEYS = ["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"] as const;

const GRAPH = "https://graph.facebook.com/v21.0";

export async function getMetaConfig(): Promise<{
  token?: string;
  account?: string;
  configured: boolean;
}> {
  const s = await getSettings([...META_KEYS]);
  return {
    token: s.META_ACCESS_TOKEN,
    account: s.META_AD_ACCOUNT_ID,
    configured: Boolean(s.META_ACCESS_TOKEN && s.META_AD_ACCOUNT_ID),
  };
}

interface MetaInsightRow {
  campaign_id: string;
  campaign_name: string;
  date_start: string;
  spend: string;
  impressions: string;
  clicks: string;
  actions?: { action_type: string; value: string }[];
}

export async function fetchMetaCampaignData(
  since: string,
  until: string,
): Promise<{ campaigns: Campaign[]; metrics: DailyCampaignMetric[] }> {
  const { token, account } = await getMetaConfig();
  if (!token || !account) throw new Error("Meta no configurado");

  const params = new URLSearchParams({
    level: "campaign",
    time_increment: "1",
    fields: "campaign_id,campaign_name,spend,impressions,clicks,actions",
    time_range: JSON.stringify({ since, until }),
    limit: "500",
    access_token: token,
  });

  const rows: MetaInsightRow[] = [];
  let url: string | null = `${GRAPH}/${account}/insights?${params}`;
  while (url) {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      throw new Error(`Meta API ${res.status}: ${await res.text()}`);
    }
    const json: { data: MetaInsightRow[]; paging?: { next?: string } } = await res.json();
    rows.push(...json.data);
    url = json.paging?.next ?? null;
  }

  const campaignsById = new Map<string, Campaign>();
  const metrics: DailyCampaignMetric[] = [];

  for (const row of rows) {
    if (!campaignsById.has(row.campaign_id)) {
      campaignsById.set(row.campaign_id, {
        id: row.campaign_id,
        nombre: row.campaign_name,
        estado: "ACTIVE",
        plataforma: "meta",
        objetivo: "LEAD_GENERATION",
      });
    }
    const leadAction = row.actions?.find(
      (a) => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped",
    );
    metrics.push({
      campaignId: row.campaign_id,
      date: row.date_start,
      spend: parseFloat(row.spend || "0"),
      impressions: parseInt(row.impressions || "0", 10),
      clicks: parseInt(row.clicks || "0", 10),
      leads: leadAction ? parseInt(leadAction.value, 10) : 0,
    });
  }

  return { campaigns: [...campaignsById.values()], metrics };
}
