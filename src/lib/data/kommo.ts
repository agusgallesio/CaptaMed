import type { Lead } from "@/lib/types";
import { getSettings } from "@/lib/settings";

/**
 * Conector a Kommo CRM (API v4).
 *
 * Credenciales (cargadas desde Integraciones o por variables de entorno):
 *  - KOMMO_BASE_URL: ej. "https://tuclinica.kommo.com"
 *  - KOMMO_ACCESS_TOKEN: token de larga duración (Ajustes → Integraciones)
 *
 * Mapeo de etapas del pipeline (los status_id varían por cuenta — verlos en
 * GET /api/v4/leads/pipelines). Se configuran como listas separadas por coma:
 *  - KOMMO_STATUS_CONTACTADO, KOMMO_STATUS_AGENDADO, KOMMO_STATUS_ASISTIO
 *  (142 = ganado y 143 = perdido son IDs estándar de Kommo)
 */

export const KOMMO_KEYS = [
  "KOMMO_BASE_URL",
  "KOMMO_ACCESS_TOKEN",
  "KOMMO_STATUS_CONTACTADO",
  "KOMMO_STATUS_AGENDADO",
  "KOMMO_STATUS_ASISTIO",
] as const;

export async function getKommoConfig(): Promise<{
  base?: string;
  token?: string;
  configured: boolean;
}> {
  const s = await getSettings(["KOMMO_BASE_URL", "KOMMO_ACCESS_TOKEN"]);
  return {
    base: s.KOMMO_BASE_URL,
    token: s.KOMMO_ACCESS_TOKEN,
    configured: Boolean(s.KOMMO_BASE_URL && s.KOMMO_ACCESS_TOKEN),
  };
}

interface KommoLead {
  id: number;
  name: string;
  price: number;
  status_id: number;
  pipeline_id: number;
  created_at: number; // unix
  custom_fields_values?: { field_code?: string; values: { value: string }[] }[];
}

function parseIdList(env: string | undefined): Set<number> {
  return new Set(
    (env ?? "")
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n)),
  );
}

const KOMMO_WON = 142;
const KOMMO_LOST = 143;

export async function fetchKommoLeads(sinceUnix: number): Promise<Lead[]> {
  const s = await getSettings([...KOMMO_KEYS]);
  if (!s.KOMMO_BASE_URL || !s.KOMMO_ACCESS_TOKEN) throw new Error("Kommo no configurado");
  const base = s.KOMMO_BASE_URL.replace(/\/$/, "");
  const token = s.KOMMO_ACCESS_TOKEN;

  const contactadoIds = parseIdList(s.KOMMO_STATUS_CONTACTADO);
  const agendadoIds = parseIdList(s.KOMMO_STATUS_AGENDADO);
  const asistioIds = parseIdList(s.KOMMO_STATUS_ASISTIO);

  const leads: Lead[] = [];
  let page = 1;
  while (true) {
    const url = `${base}/api/v4/leads?limit=250&page=${page}&filter[created_at][from]=${sinceUnix}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 },
    });
    if (res.status === 204) break; // sin resultados
    if (!res.ok) throw new Error(`Kommo API ${res.status}: ${await res.text()}`);
    const json: { _embedded?: { leads?: KommoLead[] } } = await res.json();
    const batch = json._embedded?.leads ?? [];
    if (batch.length === 0) break;

    for (const l of batch) {
      const won = l.status_id === KOMMO_WON;
      const lost = l.status_id === KOMMO_LOST;
      // La etapa alcanzada se infiere del status actual; un lead ganado pasó por todas
      const asistio = won || asistioIds.has(l.status_id);
      const agendado = asistio || agendadoIds.has(l.status_id);
      const contactado = agendado || lost || contactadoIds.has(l.status_id);

      // El ID de campaña de Meta suele llegar vía utm_campaign / campo personalizado
      const utm = l.custom_fields_values?.find((f) => f.field_code === "UTM_CAMPAIGN");

      leads.push({
        id: String(l.id),
        nombre: l.name,
        telefono: "",
        campaignId: utm?.values[0]?.value ?? "sin-atribucion",
        createdAt: new Date(l.created_at * 1000).toISOString().slice(0, 10),
        tratamiento: "",
        contactado,
        agendado,
        asistio,
        status: won ? "ganado" : lost ? "perdido" : "abierto",
        valor: won ? l.price : 0,
      });
    }
    page++;
  }

  return leads;
}
