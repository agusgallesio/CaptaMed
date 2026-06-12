import type {
  Campaign,
  CampaignSummary,
  DailyCampaignMetric,
  DashboardData,
  FunnelStage,
  Lead,
  TrendPoint,
} from "@/lib/types";
import { getDemoDataset } from "./demo";
import { fetchMetaCampaignData, isMetaConfigured } from "./meta";
import { fetchKommoLeads, isKommoConfigured } from "./kommo";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function pct(num: number, den: number): number {
  return den > 0 ? Math.round((num / den) * 1000) / 10 : 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Punto de entrada único para el dashboard y el chat con IA.
 * Usa Meta + Kommo si están configurados; si no, datos demo.
 */
export async function getDashboardData(periodDays: number): Promise<DashboardData> {
  const hasta = new Date();
  const desde = new Date();
  desde.setDate(desde.getDate() - (periodDays - 1));
  const desdeStr = isoDate(desde);
  const hastaStr = isoDate(hasta);

  let campaigns: Campaign[];
  let metrics: DailyCampaignMetric[];
  let leads: Lead[];
  let fuente: DashboardData["fuente"];

  if (isMetaConfigured() && isKommoConfigured()) {
    const meta = await fetchMetaCampaignData(desdeStr, hastaStr);
    campaigns = meta.campaigns;
    metrics = meta.metrics;
    leads = await fetchKommoLeads(Math.floor(desde.getTime() / 1000));
    fuente = "meta+kommo";
  } else {
    const demo = getDemoDataset();
    campaigns = demo.campaigns;
    metrics = demo.metrics.filter((m) => m.date >= desdeStr);
    leads = demo.leads.filter((l) => l.createdAt >= desdeStr);
    fuente = "demo";
  }

  // ---- KPIs globales ----
  const inversion = round2(metrics.reduce((s, m) => s + m.spend, 0));
  const totalLeads = leads.length;
  const contactados = leads.filter((l) => l.contactado).length;
  const agendados = leads.filter((l) => l.agendado).length;
  const asistieron = leads.filter((l) => l.asistio).length;
  const ganados = leads.filter((l) => l.status === "ganado").length;
  const perdidos = leads.filter((l) => l.status === "perdido").length;
  const abiertos = leads.filter((l) => l.status === "abierto").length;
  const revenue = leads.reduce((s, l) => s + l.valor, 0);

  const funnel: FunnelStage[] = [
    { etapa: "Leads", cantidad: totalLeads, tasaConversion: null },
    { etapa: "Contactados", cantidad: contactados, tasaConversion: pct(contactados, totalLeads) },
    { etapa: "Agendados", cantidad: agendados, tasaConversion: pct(agendados, contactados) },
    { etapa: "Asistieron", cantidad: asistieron, tasaConversion: pct(asistieron, agendados) },
    { etapa: "Ganados", cantidad: ganados, tasaConversion: pct(ganados, asistieron) },
  ];

  // ---- Resumen por campaña ----
  const campaignSummaries: CampaignSummary[] = campaigns
    .map((c) => {
      const m = metrics.filter((x) => x.campaignId === c.id);
      const ls = leads.filter((x) => x.campaignId === c.id);
      const spend = round2(m.reduce((s, x) => s + x.spend, 0));
      const impressions = m.reduce((s, x) => s + x.impressions, 0);
      const clicks = m.reduce((s, x) => s + x.clicks, 0);
      const nLeads = ls.length;
      const rev = ls.reduce((s, x) => s + x.valor, 0);
      return {
        id: c.id,
        nombre: c.nombre,
        estado: c.estado,
        spend,
        impressions,
        clicks,
        ctr: pct(clicks, impressions),
        leads: nLeads,
        cpl: nLeads > 0 ? round2(spend / nLeads) : 0,
        agendados: ls.filter((x) => x.agendado).length,
        asistieron: ls.filter((x) => x.asistio).length,
        ganados: ls.filter((x) => x.status === "ganado").length,
        perdidos: ls.filter((x) => x.status === "perdido").length,
        abiertos: ls.filter((x) => x.status === "abierto").length,
        revenue: rev,
        roas: spend > 0 ? round2(rev / spend) : 0,
      };
    })
    .filter((c) => c.spend > 0 || c.leads > 0)
    .sort((a, b) => b.spend - a.spend);

  // ---- Tendencia diaria ----
  const trendMap = new Map<string, TrendPoint>();
  for (let i = 0; i < periodDays; i++) {
    const d = new Date(desde);
    d.setDate(d.getDate() + i);
    const key = isoDate(d);
    trendMap.set(key, { date: key, leads: 0, agendados: 0 });
  }
  for (const l of leads) {
    const p = trendMap.get(l.createdAt);
    if (p) {
      p.leads++;
      if (l.agendado) p.agendados++;
    }
  }

  const ultimosLeads = [...leads]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 8);

  return {
    periodDays,
    desde: desdeStr,
    hasta: hastaStr,
    fuente,
    kpis: {
      inversion,
      leads: totalLeads,
      cpl: totalLeads > 0 ? round2(inversion / totalLeads) : 0,
      agendados,
      asistieron,
      ganados,
      perdidos,
      abiertos,
      tasaAgendamiento: pct(agendados, totalLeads),
      tasaAsistencia: pct(asistieron, agendados),
      tasaCierre: pct(ganados, asistieron),
      revenue,
      roas: inversion > 0 ? round2(revenue / inversion) : 0,
    },
    funnel,
    campaigns: campaignSummaries,
    trend: [...trendMap.values()],
    ultimosLeads,
  };
}
