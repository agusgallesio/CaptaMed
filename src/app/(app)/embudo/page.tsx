"use client";

import { fmtMoney, fmtNum, fmtPct, fmtFecha } from "@/lib/format";
import { useMetrics } from "@/lib/useMetrics";
import FunnelChart from "@/components/FunnelChart";
import KpiCard from "@/components/KpiCard";

const ETAPAS_PROYECCION: { key: "leads" | "respondieron" | "agendados" | "asistieron" | "ganados"; label: string }[] = [
  { key: "leads", label: "Leads" },
  { key: "respondieron", label: "Respondieron" },
  { key: "agendados", label: "Agendaron" },
  { key: "asistieron", label: "Asistieron" },
  { key: "ganados", label: "Ganados" },
];

export default function Embudo() {
  const { data, error, loading } = useMetrics();

  if (error) return <div className="card border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>;
  if (loading || !data)
    return <div className="flex h-64 items-center justify-center text-sm text-slate-500 dark:text-slate-400">Armando el embudo…</div>;

  const p = data.proyeccionMes;
  const avanceMes = Math.round((p.diasTranscurridos / p.diasTotales) * 100);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-ink-900 dark:text-slate-100">
        Embudo comercial · {fmtFecha(data.desde)} al {fmtFecha(data.hasta)}
      </h2>

      <section className="card p-4">
        <FunnelChart stages={data.funnel} />
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard titulo="Tasa de respuesta" valor={fmtPct(data.kpis.tasaRespuesta)} detalle="Respondieron / leads" />
        <KpiCard
          titulo="Tasa de agendamiento"
          valor={fmtPct(data.kpis.tasaAgendamiento)}
          detalle="Agendaron / leads"
        />
        <KpiCard
          titulo="Tasa de asistencia"
          valor={fmtPct(data.kpis.tasaAsistencia)}
          detalle="Asistieron / agendados"
          acento={data.kpis.tasaAsistencia < 60 ? "warn" : "default"}
        />
        <KpiCard titulo="Tasa de cierre" valor={fmtPct(data.kpis.tasaCierre)} detalle="Ganados / asistieron" acento="ok" />
      </div>

      <section className="card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold capitalize text-ink-900 dark:text-slate-100">Proyección de {p.mes}</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Día {p.diasTranscurridos} de {p.diasTotales} · {avanceMes}% del mes transcurrido
          </span>
        </div>

        <div className="mb-4 h-1.5 w-full rounded-full bg-slate-100 dark:bg-ink-700">
          <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${avanceMes}%` }} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 dark:border-slate-700">
                <th className="py-2 pr-3 font-medium">Etapa</th>
                <th className="px-3 py-2 text-right font-medium">Acumulado del mes</th>
                <th className="px-3 py-2 text-right font-medium">Proyección a fin de mes</th>
                <th className="pl-3 py-2 text-right font-medium">Ritmo diario</th>
              </tr>
            </thead>
            <tbody>
              {ETAPAS_PROYECCION.map((e) => (
                <tr key={e.key} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="py-2.5 pr-3 font-medium text-ink-800 dark:text-slate-200">{e.label}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtNum(p.actual[e.key])}</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-brand-700">
                    ≈ {fmtNum(p.proyectado[e.key])}
                  </td>
                  <td className="py-2.5 pl-3 text-right tabular-nums text-slate-500 dark:text-slate-400">
                    {(p.actual[e.key] / Math.max(1, p.diasTranscurridos)).toLocaleString("es-AR", {
                      maximumFractionDigits: 1,
                    })}
                    /día
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-ink-700/40">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Inversión proyectada</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-ink-900 dark:text-slate-100">
              ≈ {fmtMoney(p.proyectado.inversion)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Acumulado: {fmtMoney(p.actual.inversion)}</p>
          </div>
          <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 dark:border-brand-500/30 dark:bg-brand-500/10">
            <p className="text-[11px] uppercase tracking-wide text-brand-700 dark:text-brand-300">Venta proyectada</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-brand-800 dark:text-brand-200">
              ≈ {fmtMoney(p.proyectado.ventaTotal)}
            </p>
            <p className="text-xs text-brand-700/70 dark:text-brand-300/70">Acumulado: {fmtMoney(p.actual.ventaTotal)}</p>
          </div>
        </div>

        <p className="pt-3 text-[11px] text-slate-400">
          Proyección lineal según el ritmo de los días transcurridos del mes en curso. Es independiente del rango
          de fechas seleccionado arriba. Los leads de los últimos días suelen seguir avanzando de etapa, por lo que
          agendas, asistencias y cierres proyectados son conservadores.
        </p>
      </section>
    </div>
  );
}
