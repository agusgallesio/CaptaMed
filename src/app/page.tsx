"use client";

import { fmtMoney, fmtMoney2, fmtNum, fmtPct, fmtFecha } from "@/lib/format";
import { useMetrics } from "@/lib/useMetrics";
import KpiCard from "@/components/KpiCard";
import FunnelChart from "@/components/FunnelChart";
import TrendChart from "@/components/TrendChart";
import CampaignTable from "@/components/CampaignTable";
import RecentLeads from "@/components/RecentLeads";

export default function Resumen() {
  const { data, error, loading } = useMetrics();

  if (error) return <div className="card border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>;
  if (loading || !data)
    return <div className="flex h-64 items-center justify-center text-sm text-slate-500 dark:text-slate-400">Cargando métricas…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-ink-900 dark:text-slate-100">
          Resumen del {fmtFecha(data.desde)} al {fmtFecha(data.hasta)}
        </h2>
        {data.fuente === "demo" && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
            Datos de demostración
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard titulo="Inversión" valor={fmtMoney(data.kpis.inversion)} detalle={`CPL ${fmtMoney2(data.kpis.cpl)}`} />
        <KpiCard titulo="Leads" valor={fmtNum(data.kpis.leads)} detalle={`${fmtNum(data.kpis.abiertos)} abiertos`} />
        <KpiCard
          titulo="Agendados"
          valor={fmtNum(data.kpis.agendados)}
          detalle={`${fmtPct(data.kpis.tasaAgendamiento)} de los leads`}
        />
        <KpiCard
          titulo="Asistieron"
          valor={fmtNum(data.kpis.asistieron)}
          detalle={`${fmtPct(data.kpis.tasaAsistencia)} de agendados`}
          acento={data.kpis.tasaAsistencia < 60 ? "warn" : "default"}
        />
        <KpiCard titulo="Ganados" valor={fmtNum(data.kpis.ganados)} detalle={`${fmtPct(data.kpis.tasaCierre)} de cierre`} acento="ok" />
        <KpiCard titulo="Perdidos" valor={fmtNum(data.kpis.perdidos)} acento="bad" />
        <KpiCard titulo="Venta total" valor={fmtMoney(data.kpis.revenue)} />
        <KpiCard
          titulo="ROAS"
          valor={`${data.kpis.roas.toLocaleString("es-AR", { maximumFractionDigits: 1 })}x`}
          detalle="Venta / inversión"
          acento={data.kpis.roas >= 3 ? "ok" : data.kpis.roas >= 1 ? "warn" : "bad"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="card p-4">
          <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-slate-100">Embudo comercial</h3>
          <FunnelChart stages={data.funnel} />
        </section>
        <section className="card p-4">
          <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-slate-100">Leads por día</h3>
          <TrendChart points={data.trend} />
        </section>
      </div>

      <section className="card p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-slate-100">Rendimiento por campaña</h3>
        <CampaignTable campaigns={data.campaigns} conPlataforma />
      </section>

      <section className="card p-4">
        <h3 className="mb-2 text-sm font-semibold text-ink-900 dark:text-slate-100">Últimos leads en el CRM</h3>
        <RecentLeads leads={data.ultimosLeads} />
      </section>
    </div>
  );
}
