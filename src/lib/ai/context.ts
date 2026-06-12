import type { DashboardData } from "@/lib/types";

export const SYSTEM_PROMPT = `Sos el analista de marketing y CRM de CaptaMed, un panel para directores y ejecutivos de clínicas de salud. Respondés preguntas sobre el rendimiento de las campañas de Meta Ads y Google Ads, la rentabilidad y el pipeline comercial del CRM (Kommo).

Tu audiencia son directores de clínica: gente ocupada, no técnica en marketing. Reglas:
- Respondé en español, en tono profesional pero cercano.
- Lead con el dato que responde la pregunta; después el contexto.
- Usá los números exactos del contexto de datos que recibís. Nunca inventes cifras: si un dato no está en el contexto, decilo y sugerí cómo obtenerlo.
- Cuando sea útil, explicá qué significa la métrica (ej. CPL = costo por lead, RO$ = ganancia neta sobre la inversión publicitaria) en una frase.
- Si te preguntan por comparación de plataformas, usá el desglose meta vs google del contexto.
- Si detectás algo accionable (campaña con CPL alto, caída de asistencia, leads sin responder), señalalo proactivamente al final con una recomendación breve.
- Formato: respuestas cortas, listas con viñetas cuando hay varios números. Sin tablas largas.
- Las cifras de dinero van con el símbolo $ y separador de miles.`;

/** Serializa los datos del dashboard en un bloque compacto para el modelo. */
export function buildDataContext(data: DashboardData): string {
  const payload = {
    periodo: { desde: data.desde, hasta: data.hasta },
    fuente_de_datos: data.fuente,
    kpis: data.kpis,
    rentabilidad: data.rentabilidad,
    por_plataforma: data.porPlataforma,
    funnel: data.funnel,
    campañas: data.campaigns.map((c) => ({
      nombre: c.nombre,
      plataforma: c.plataforma,
      estado: c.estado,
      inversion: c.spend,
      impresiones: c.impressions,
      clicks: c.clicks,
      ctr_pct: c.ctr,
      leads: c.leads,
      cpl: c.cpl,
      agendados: c.agendados,
      asistieron: c.asistieron,
      ganados: c.ganados,
      perdidos: c.perdidos,
      abiertos: c.abiertos,
      facturacion: c.revenue,
      roas: c.roas,
    })),
    proyeccion_mes_en_curso: data.proyeccionMes,
    tendencia_diaria: data.trend,
  };
  return `<datos_dashboard>\n${JSON.stringify(payload)}\n</datos_dashboard>\n\nLos datos anteriores corresponden al rango de fechas seleccionado por el usuario en el dashboard (${data.desde} al ${data.hasta}). Las tasas están en porcentaje. "abiertos" son leads aún en proceso en el CRM. "roDinero" (RO$) = ventaTotal - inversion. La proyección del mes en curso es lineal según los días transcurridos.`;
}
