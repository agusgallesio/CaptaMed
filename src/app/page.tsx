"use client";

import { useEffect, useState } from "react";
import type { DashboardData } from "@/lib/types";
import { fmtMoney, fmtMoney2, fmtNum, fmtPct, fmtFecha } from "@/lib/format";
import KpiCard from "@/components/KpiCard";
import FunnelChart from "@/components/FunnelChart";
import TrendChart from "@/components/TrendChart";
import CampaignTable from "@/components/CampaignTable";
import RecentLeads from "@/components/RecentLeads";
import ChatPanel from "@/components/ChatPanel";

const PERIODOS = [
  { dias: 7, label: "7 días" },
  { dias: 30, label: "30 días" },
  { dias: 90, label: "90 días" },
];

export default function Home() {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setError(null);
    fetch(`/api/metrics?period=${period}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Error");
        return r.json();
      })
      .then((d: DashboardData) => {
        if (!cancelado) setData(d);
      })
      .catch((e: Error) => {
        if (!cancelado) setError(e.message);
      });
    return () => {
      cancelado = true;
    };
  }, [period]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-ink-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 font-display text-lg font-bold text-white">
              C
            </span>
            <div>
              <h1 className="font-display text-lg font-semibold leading-tight text-white">CaptaMed</h1>
              <p className="text-[11px] leading-tight text-slate-400">Campañas + CRM para clínicas</p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-ink-700 p-1">
            {PERIODOS.map((p) => (
              <button
                key={p.dias}
                onClick={() => setPeriod(p.dias)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  period === p.dias ? "bg-brand-500 text-white" : "text-slate-300 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        {error && (
          <div className="card mb-4 border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        {!data && !error && (
          <div className="flex h-64 items-center justify-center text-sm text-slate-500">
            Cargando métricas…
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {/* Columna principal */}
            <div className="space-y-4 xl:col-span-2">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold text-ink-900">
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
                <KpiCard titulo="Facturación" valor={fmtMoney(data.kpis.revenue)} />
                <KpiCard
                  titulo="ROAS"
                  valor={`${data.kpis.roas.toLocaleString("es-AR", { maximumFractionDigits: 1 })}x`}
                  detalle="Facturación / inversión"
                  acento={data.kpis.roas >= 3 ? "ok" : data.kpis.roas >= 1 ? "warn" : "bad"}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <section className="card p-4">
                  <h3 className="mb-3 text-sm font-semibold text-ink-900">Funnel comercial</h3>
                  <FunnelChart stages={data.funnel} />
                </section>
                <section className="card p-4">
                  <h3 className="mb-3 text-sm font-semibold text-ink-900">Leads por día</h3>
                  <TrendChart points={data.trend} />
                </section>
              </div>

              <section className="card p-4">
                <h3 className="mb-3 text-sm font-semibold text-ink-900">Rendimiento por campaña (Meta Ads)</h3>
                <CampaignTable campaigns={data.campaigns} />
              </section>

              <section className="card p-4">
                <h3 className="mb-2 text-sm font-semibold text-ink-900">Últimos leads en el CRM</h3>
                <RecentLeads leads={data.ultimosLeads} />
              </section>
            </div>

            {/* Chat con IA */}
            <aside className="xl:sticky xl:top-5 xl:h-[calc(100vh-2.5rem)]">
              <ChatPanel period={period} />
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
