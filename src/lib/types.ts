export type LeadStatus = "abierto" | "ganado" | "perdido";
export type Plataforma = "meta" | "google";

export interface Campaign {
  id: string;
  nombre: string;
  estado: "ACTIVE" | "PAUSED";
  plataforma: Plataforma;
  objetivo: string;
}

export interface DailyCampaignMetric {
  campaignId: string;
  date: string; // YYYY-MM-DD
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
}

export interface Lead {
  id: string;
  nombre: string;
  telefono: string;
  campaignId: string;
  createdAt: string; // YYYY-MM-DD
  tratamiento: string;
  /** Respondió al primer contacto */
  contactado: boolean;
  agendado: boolean;
  asistio: boolean;
  status: LeadStatus;
  /** Valor del tratamiento (solo relevante si status === "ganado") */
  valor: number;
}

export interface FunnelStage {
  etapa: string;
  cantidad: number;
  /** % respecto a la etapa anterior */
  tasaConversion: number | null;
}

export interface CampaignSummary {
  id: string;
  nombre: string;
  estado: string;
  plataforma: Plataforma;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  leads: number;
  cpl: number;
  agendados: number;
  asistieron: number;
  ganados: number;
  perdidos: number;
  abiertos: number;
  revenue: number;
  roas: number;
}

export interface PlatformSummary {
  plataforma: Plataforma;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  leads: number;
  cpl: number;
  agendados: number;
  asistieron: number;
  ganados: number;
  revenue: number;
  roas: number;
}

export interface Rentabilidad {
  ventaTotal: number;
  inversion: number;
  /** RO$: ganancia neta sobre la inversión publicitaria (venta - inversión) */
  roDinero: number;
  roas: number;
  /** ROI en % */
  roi: number;
  ticketPromedio: number;
  cpl: number;
  costoPorAgenda: number;
  costoPorAsistencia: number;
  /** Costo de adquisición por paciente ganado */
  cac: number;
}

export interface ProyeccionMes {
  mes: string; // ej. "junio 2026"
  diasTranscurridos: number;
  diasTotales: number;
  actual: {
    leads: number;
    respondieron: number;
    agendados: number;
    asistieron: number;
    ganados: number;
    inversion: number;
    ventaTotal: number;
  };
  proyectado: {
    leads: number;
    respondieron: number;
    agendados: number;
    asistieron: number;
    ganados: number;
    inversion: number;
    ventaTotal: number;
  };
}

export interface TrendPoint {
  date: string;
  leads: number;
  agendados: number;
}

export interface DashboardData {
  desde: string;
  hasta: string;
  fuente: "demo" | "real";
  kpis: {
    inversion: number;
    leads: number;
    cpl: number;
    respondieron: number;
    agendados: number;
    asistieron: number;
    ganados: number;
    perdidos: number;
    abiertos: number;
    tasaRespuesta: number; // respondieron / leads
    tasaAgendamiento: number; // agendados / leads
    tasaAsistencia: number; // asistieron / agendados
    tasaCierre: number; // ganados / asistieron
    revenue: number;
    roas: number;
  };
  rentabilidad: Rentabilidad;
  porPlataforma: PlatformSummary[];
  funnel: FunnelStage[];
  campaigns: CampaignSummary[];
  trend: TrendPoint[];
  ultimosLeads: Lead[];
  proyeccionMes: ProyeccionMes;
}
