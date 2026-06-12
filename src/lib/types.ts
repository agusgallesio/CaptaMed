export type LeadStatus = "abierto" | "ganado" | "perdido";

export interface Campaign {
  id: string;
  nombre: string;
  estado: "ACTIVE" | "PAUSED";
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

export interface TrendPoint {
  date: string;
  leads: number;
  agendados: number;
}

export interface DashboardData {
  periodDays: number;
  desde: string;
  hasta: string;
  fuente: "demo" | "meta+kommo";
  kpis: {
    inversion: number;
    leads: number;
    cpl: number;
    agendados: number;
    asistieron: number;
    ganados: number;
    perdidos: number;
    abiertos: number;
    tasaAgendamiento: number; // agendados / leads
    tasaAsistencia: number; // asistieron / agendados
    tasaCierre: number; // ganados / asistieron
    revenue: number;
    roas: number;
  };
  funnel: FunnelStage[];
  campaigns: CampaignSummary[];
  trend: TrendPoint[];
  ultimosLeads: Lead[];
}
