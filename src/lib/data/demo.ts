import type { Campaign, DailyCampaignMetric, Lead } from "@/lib/types";

/**
 * Datos demo determinísticos (seed fijo) para vender/mostrar el producto
 * sin necesidad de credenciales de Meta, Google Ads ni Kommo.
 */

// PRNG mulberry32 — determinístico para que la demo sea estable entre requests
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEMO_CAMPAIGNS: Campaign[] = [
  { id: "m1", nombre: "Implantes Dentales — Conversiones", estado: "ACTIVE", plataforma: "meta", objetivo: "LEAD_GENERATION" },
  { id: "m2", nombre: "Ortodoncia Invisible — Tráfico + Form", estado: "ACTIVE", plataforma: "meta", objetivo: "LEAD_GENERATION" },
  { id: "m3", nombre: "Chequeo Médico Anual — Awareness", estado: "ACTIVE", plataforma: "meta", objetivo: "LEAD_GENERATION" },
  { id: "m4", nombre: "Estética Facial — Retargeting", estado: "ACTIVE", plataforma: "meta", objetivo: "CONVERSIONS" },
  { id: "m5", nombre: "Pacientes Inactivos — Remarketing", estado: "PAUSED", plataforma: "meta", objetivo: "CONVERSIONS" },
  { id: "g1", nombre: "Búsqueda — Implantes Dentales", estado: "ACTIVE", plataforma: "google", objetivo: "SEARCH" },
  { id: "g2", nombre: "Búsqueda — Urgencias Odontológicas", estado: "ACTIVE", plataforma: "google", objetivo: "SEARCH" },
  { id: "g3", nombre: "PMax — Tratamientos Estéticos", estado: "ACTIVE", plataforma: "google", objetivo: "PERFORMANCE_MAX" },
];

// Perfil de cada campaña: presupuesto diario, CPL aproximado y calidad del lead
const PROFILES: Record<
  string,
  { dailySpend: number; cpl: number; calidad: number; ticket: number; ctrBase: number; tratamientos: string[] }
> = {
  m1: { dailySpend: 95, cpl: 26, calidad: 0.62, ticket: 1500, ctrBase: 0.014, tratamientos: ["Implante unitario", "Implantes múltiples", "All-on-4"] },
  m2: { dailySpend: 70, cpl: 19, calidad: 0.55, ticket: 950, ctrBase: 0.013, tratamientos: ["Ortodoncia invisible", "Brackets estéticos"] },
  m3: { dailySpend: 45, cpl: 9, calidad: 0.42, ticket: 260, ctrBase: 0.016, tratamientos: ["Chequeo anual", "Laboratorio completo"] },
  m4: { dailySpend: 60, cpl: 16, calidad: 0.58, ticket: 560, ctrBase: 0.018, tratamientos: ["Botox", "Rellenos", "Limpieza facial profunda"] },
  m5: { dailySpend: 25, cpl: 11, calidad: 0.68, ticket: 420, ctrBase: 0.02, tratamientos: ["Blanqueamiento", "Limpieza", "Control"] },
  // Google: menos volumen, mayor intención → CPL más alto pero mejor calidad
  g1: { dailySpend: 55, cpl: 32, calidad: 0.74, ticket: 1600, ctrBase: 0.045, tratamientos: ["Implante unitario", "Implantes múltiples", "All-on-4"] },
  g2: { dailySpend: 35, cpl: 21, calidad: 0.78, ticket: 380, ctrBase: 0.055, tratamientos: ["Urgencia odontológica", "Endodoncia", "Extracción"] },
  g3: { dailySpend: 40, cpl: 18, calidad: 0.6, ticket: 600, ctrBase: 0.022, tratamientos: ["Botox", "Rellenos", "Blanqueamiento"] },
};

const NOMBRES = [
  "María González", "Juan Pérez", "Lucía Fernández", "Carlos Rodríguez", "Ana Martínez",
  "Diego López", "Sofía Ramírez", "Martín Torres", "Valentina Díaz", "Pablo Sánchez",
  "Camila Romero", "Federico Álvarez", "Julieta Castro", "Nicolás Molina", "Agustina Silva",
  "Tomás Herrera", "Florencia Ruiz", "Matías Acosta", "Carolina Vega", "Sebastián Ortiz",
];

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface DemoDataset {
  campaigns: Campaign[];
  metrics: DailyCampaignMetric[];
  leads: Lead[];
}

let cache: DemoDataset | null = null;
let cacheDay: string | null = null;

/** Genera 365 días de historia hasta hoy. Cacheado por día de proceso. */
export function getDemoDataset(): DemoDataset {
  const today = isoDate(new Date());
  if (cache && cacheDay === today) return cache;

  const rand = mulberry32(20260612);
  const metrics: DailyCampaignMetric[] = [];
  const leads: Lead[] = [];
  let leadSeq = 1;

  const now = new Date();
  for (let back = 364; back >= 0; back--) {
    const d = new Date(now);
    d.setDate(d.getDate() - back);
    const date = isoDate(d);
    const dow = d.getDay(); // 0 dom .. 6 sab
    const weekendFactor = dow === 0 || dow === 6 ? 0.65 : 1;

    for (const camp of DEMO_CAMPAIGNS) {
      if (camp.estado === "PAUSED" && back < 20) continue; // la pausada dejó de correr hace 20 días
      if (camp.plataforma === "google" && back > 200) continue; // Google arrancó hace ~7 meses
      const p = PROFILES[camp.id];
      const spend = p.dailySpend * weekendFactor * (0.85 + rand() * 0.3);
      const cpl = p.cpl * (0.8 + rand() * 0.5);
      const dayLeads = Math.max(0, Math.round(spend / cpl + (rand() - 0.5) * 2));
      const cpm = camp.plataforma === "google" ? 18 + rand() * 14 : 6 + rand() * 5;
      const impressions = Math.round((spend / cpm) * 1000);
      const ctr = p.ctrBase * (0.8 + rand() * 0.5);
      const clicks = Math.round(impressions * ctr);

      metrics.push({ campaignId: camp.id, date, spend: round2(spend), impressions, clicks, leads: dayLeads });

      for (let i = 0; i < dayLeads; i++) {
        const contactado = rand() < 0.74 + p.calidad * 0.12;
        const agendado = contactado && rand() < 0.52 + p.calidad * 0.2;
        const asistio = agendado && rand() < 0.68;
        const cerrado = asistio && rand() < 0.45 + p.calidad * 0.3;

        // Los leads recientes todavía están transitando el pipeline → más "abiertos"
        const enProceso = back < 10 && rand() < (10 - back) / 12;

        let status: Lead["status"];
        if (enProceso) status = "abierto";
        else if (cerrado) status = "ganado";
        else if (contactado && rand() < 0.75) status = "perdido";
        else status = "abierto";

        const tratamiento = p.tratamientos[Math.floor(rand() * p.tratamientos.length)];
        leads.push({
          id: `L-${String(leadSeq++).padStart(5, "0")}`,
          nombre: NOMBRES[Math.floor(rand() * NOMBRES.length)],
          telefono: `+54 9 11 ${Math.floor(4000 + rand() * 5000)}-${Math.floor(1000 + rand() * 8999)}`,
          campaignId: camp.id,
          createdAt: date,
          tratamiento,
          contactado,
          agendado: enProceso ? agendado && rand() < 0.6 : agendado,
          asistio: enProceso ? false : asistio,
          status,
          valor: status === "ganado" ? Math.round(p.ticket * (0.7 + rand() * 0.7)) : 0,
        });
      }
    }
  }

  cache = { campaigns: DEMO_CAMPAIGNS, metrics, leads };
  cacheDay = today;
  return cache;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
