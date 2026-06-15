import type {
  Campaign,
  CampaignSummary,
  DailyCampaignMetric,
  DashboardData,
  FunnelStage,
  Lead,
  Plataforma,
  PlatformSummary,
  ProyeccionMes,
  Rentabilidad,
  TrendPoint,
} from "@/lib/types";
import { getDemoDataset } from "./demo";
import { fetchMetaCampaignData, getMetaConfig } from "./meta";
import { fetchGoogleCampaignData, getGoogleConfig } from "./google";
import { fetchKommoLeads, getKommoConfig } from "./kommo";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function pct(num: number, den: number): number {
  return den > 0 ? Math.round((num / den) * 1000) / 10 : 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

interface Dataset {
  campaigns: Campaign[];
  metrics: DailyCampaignMetric[];
  leads: Lead[];
  fuente: DashboardData["fuente"];
}

/** Trae el dataset crudo (real si Meta+Kommo están configurados; Google es opcional). */
async function getDataset(desde: string, hasta: string): Promise<Dataset> {
  const [meta, kommo, google] = await Promise.all([
    getMetaConfig(),
    getKommoConfig(),
    getGoogleConfig(),
  ]);

  if (meta.configured && kommo.configured) {
    const metaData = await fetchMetaCampaignData(desde, hasta);
    let campaigns = metaData.campaigns;
    let metrics = metaData.metrics;
    if (google.configured) {
      try {
        const googleData = await fetchGoogleCampaignData(desde, hasta);
        campaigns = [...campaigns, ...googleData.campaigns];
        metrics = [...metrics, ...googleData.metrics];
      } catch (e) {
        console.error("Google Ads falló, se continúa solo con Meta:", e);
      }
    }
    const sinceUnix = Math.floor(new Date(desde + "T00:00:00Z").getTime() / 1000);
    const leads = (await fetchKommoLeads(sinceUnix)).filter(
      (l) => l.createdAt >= desde && l.createdAt <= hasta,
    );
    return { campaigns, metrics, leads, fuente: "real" };
  }
  const demo = getDemoDataset();
  return {
    campaigns: demo.campaigns,
    metrics: demo.metrics.filter((m) => m.date >= desde && m.date <= hasta),
    leads: demo.leads.filter((l) => l.createdAt >= desde && l.createdAt <= hasta),
    fuente: "demo",
  };
}

function resumirCampaña(c: Campaign, metrics: DailyCampaignMetric[], leads: Lead[]): CampaignSummary {
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
    plataforma: c.plataforma,
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
}

function resumirPlataforma(
  plataforma: Plataforma,
  campaigns: Campaign[],
  metrics: DailyCampaignMetric[],
  leads: Lead[],
): PlatformSummary {
  const ids = new Set(campaigns.filter((c) => c.plataforma === plataforma).map((c) => c.id));
  const m = metrics.filter((x) => ids.has(x.campaignId));
  const ls = leads.filter((x) => ids.has(x.campaignId));
  const spend = round2(m.reduce((s, x) => s + x.spend, 0));
  const impressions = m.reduce((s, x) => s + x.impressions, 0);
  const clicks = m.reduce((s, x) => s + x.clicks, 0);
  const rev = ls.reduce((s, x) => s + x.valor, 0);
  return {
    plataforma,
    spend,
    impressions,
    clicks,
    ctr: pct(clicks, impressions),
    leads: ls.length,
    cpl: ls.length > 0 ? round2(spend / ls.length) : 0,
    agendados: ls.filter((x) => x.agendado).length,
    asistieron: ls.filter((x) => x.asistio).length,
    ganados: ls.filter((x) => x.status === "ganado").length,
    revenue: rev,
    roas: spend > 0 ? round2(rev / spend) : 0,
  };
}

/** Proyección lineal del mes en curso según los días transcurridos. */
async function proyectarMes(): Promise<ProyeccionMes> {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const diasTotales = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const diasTranscurridos = hoy.getDate();

  const { metrics, leads } = await getDataset(isoDate(inicioMes), isoDate(hoy));

  const actual = {
    leads: leads.length,
    respondieron: leads.filter((l) => l.contactado).length,
    agendados: leads.filter((l) => l.agendado).length,
    asistieron: leads.filter((l) => l.asistio).length,
    ganados: leads.filter((l) => l.status === "ganado").length,
    inversion: round2(metrics.reduce((s, m) => s + m.spend, 0)),
    ventaTotal: leads.reduce((s, l) => s + l.valor, 0),
  };

  const factor = diasTranscurridos > 0 ? diasTotales / diasTranscurridos : 0;
  const proyectar = (n: number) => Math.round(n * factor);

  return {
    mes: `${MESES[hoy.getMonth()]} ${hoy.getFullYear()}`,
    diasTranscurridos,
    diasTotales,
    actual,
    proyectado: {
      leads: proyectar(actual.leads),
      respondieron: proyectar(actual.respondieron),
      agendados: proyectar(actual.agendados),
      asistieron: proyectar(actual.asistieron),
      ganados: proyectar(actual.ganados),
      inversion: round2(actual.inversion * factor),
      ventaTotal: proyectar(actual.ventaTotal),
    },
  };
}

/**
 * Punto de entrada único para el dashboard y el chat con IA.
 * Recibe un rango de fechas libre (YYYY-MM-DD, inclusive).
 */
export async function getDashboardData(desde: string, hasta: string): Promise<DashboardData> {
  const { campaigns, metrics, leads, fuente } = await getDataset(desde, hasta);

  // ---- KPIs globales ----
  const inversion = round2(metrics.reduce((s, m) => s + m.spend, 0));
  const totalLeads = leads.length;
  const respondieron = leads.filter((l) => l.contactado).length;
  const agendados = leads.filter((l) => l.agendado).length;
  const asistieron = leads.filter((l) => l.asistio).length;
  const ganados = leads.filter((l) => l.status === "ganado").length;
  const perdidos = leads.filter((l) => l.status === "perdido").length;
  const abiertos = leads.filter((l) => l.status === "abierto").length;
  const revenue = leads.reduce((s, l) => s + l.valor, 0);

  const funnel: FunnelStage[] = [
    { etapa: "Leads", cantidad: totalLeads, tasaConversion: null },
    { etapa: "Respondieron", cantidad: respondieron, tasaConversion: pct(respondieron, totalLeads) },
    { etapa: "Agendaron", cantidad: agendados, tasaConversion: pct(agendados, respondieron) },
    { etapa: "Asistieron", cantidad: asistieron, tasaConversion: pct(asistieron, agendados) },
    { etapa: "Ganados", cantidad: ganados, tasaConversion: pct(ganados, asistieron) },
  ];

  const rentabilidad: Rentabilidad = {
    ventaTotal: revenue,
    inversion,
    roDinero: round2(revenue - inversion),
    roas: inversion > 0 ? round2(revenue / inversion) : 0,
    roi: inversion > 0 ? round2(((revenue - inversion) / inversion) * 100) : 0,
    ticketPromedio: ganados > 0 ? round2(revenue / ganados) : 0,
    cpl: totalLeads > 0 ? round2(inversion / totalLeads) : 0,
    costoPorAgenda: agendados > 0 ? round2(inversion / agendados) : 0,
    costoPorAsistencia: asistieron > 0 ? round2(inversion / asistieron) : 0,
    cac: ganados > 0 ? round2(inversion / ganados) : 0,
  };

  const porPlataforma = (["meta", "google"] as Plataforma[])
    .map((p) => resumirPlataforma(p, campaigns, metrics, leads))
    .filter((p) => p.spend > 0 || p.leads > 0);

  const campaignSummaries = campaigns
    .map((c) => resumirCampaña(c, metrics, leads))
    .filter((c) => c.spend > 0 || c.leads > 0)
    .sort((a, b) => b.spend - a.spend);

  // ---- Tendencia diaria ----
  const trendMap = new Map<string, TrendPoint>();
  const cursor = new Date(desde + "T00:00:00Z");
  const fin = new Date(hasta + "T00:00:00Z");
  while (cursor <= fin) {
    const key = isoDate(cursor);
    trendMap.set(key, { date: key, leads: 0, agendados: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
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
    desde,
    hasta,
    fuente,
    kpis: {
      inversion,
      leads: totalLeads,
      cpl: rentabilidad.cpl,
      respondieron,
      agendados,
      asistieron,
      ganados,
      perdidos,
      abiertos,
      tasaRespuesta: pct(respondieron, totalLeads),
      tasaAgendamiento: pct(agendados, totalLeads),
      tasaAsistencia: pct(asistieron, agendados),
      tasaCierre: pct(ganados, asistieron),
      revenue,
      roas: rentabilidad.roas,
    },
    rentabilidad,
    porPlataforma,
    funnel,
    campaigns: campaignSummaries,
    trend: [...trendMap.values()],
    ultimosLeads,
    proyeccionMes: await proyectarMes(),
  };
}

/** Valida y normaliza un rango de fechas; default: últimos 30 días. */
export function parseRange(fromRaw: string | null, toRaw: string | null): { desde: string; hasta: string } {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  const hoy = new Date();
  let hasta = toRaw && re.test(toRaw) ? toRaw : isoDate(hoy);
  const defaultDesde = new Date(hoy);
  defaultDesde.setDate(defaultDesde.getDate() - 29);
  let desde = fromRaw && re.test(fromRaw) ? fromRaw : isoDate(defaultDesde);
  if (desde > hasta) [desde, hasta] = [hasta, desde];
  return { desde, hasta };
}
