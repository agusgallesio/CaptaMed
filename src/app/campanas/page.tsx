"use client";

import { useState } from "react";
import type { Plataforma } from "@/lib/types";
import { fmtMoney, fmtMoney2, fmtNum, fmtPct } from "@/lib/format";
import { useMetrics } from "@/lib/useMetrics";
import KpiCard from "@/components/KpiCard";
import CampaignTable from "@/components/CampaignTable";

type Filtro = "todas" | Plataforma;

const TABS: { id: Filtro; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "meta", label: "Meta Ads" },
  { id: "google", label: "Google Ads" },
];

const NOMBRE_PLATAFORMA: Record<Plataforma, string> = { meta: "Meta Ads", google: "Google Ads" };

export default function Campanas() {
  const { data, error, loading } = useMetrics();
  const [filtro, setFiltro] = useState<Filtro>("todas");

  if (error) return <div className="card border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>;
  if (loading || !data)
    return <div className="flex h-64 items-center justify-center text-sm text-slate-500">Cargando campañas…</div>;

  const visibles = data.campaigns.filter((c) => filtro === "todas" || c.plataforma === filtro);
  const spend = visibles.reduce((s, c) => s + c.spend, 0);
  const leads = visibles.reduce((s, c) => s + c.leads, 0);
  const clicks = visibles.reduce((s, c) => s + c.clicks, 0);
  const impressions = visibles.reduce((s, c) => s + c.impressions, 0);
  const revenue = visibles.reduce((s, c) => s + c.revenue, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink-900">Campañas por plataforma</h2>
        <div className="flex items-center gap-1 rounded-lg bg-white p-1 shadow-sm ring-1 ring-slate-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setFiltro(t.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                filtro === t.id ? "bg-brand-600 text-white" : "text-slate-600 hover:text-ink-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiCard titulo="Inversión" valor={fmtMoney(spend)} />
        <KpiCard titulo="Leads" valor={fmtNum(leads)} />
        <KpiCard titulo="CPL" valor={leads > 0 ? fmtMoney2(spend / leads) : "—"} />
        <KpiCard
          titulo="CTR"
          valor={impressions > 0 ? fmtPct((clicks / impressions) * 100) : "—"}
          detalle={`${fmtNum(clicks)} clicks`}
        />
        <KpiCard
          titulo="ROAS"
          valor={spend > 0 ? `${(revenue / spend).toLocaleString("es-AR", { maximumFractionDigits: 1 })}x` : "—"}
          acento={spend > 0 && revenue / spend >= 3 ? "ok" : "default"}
        />
      </div>

      {filtro === "todas" && data.porPlataforma.length > 1 && (
        <section className="card p-4">
          <h3 className="mb-3 text-sm font-semibold text-ink-900">Meta vs Google</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {data.porPlataforma.map((p) => (
              <div key={p.plataforma} className="rounded-lg border border-slate-200 p-3">
                <p className="mb-2 text-sm font-semibold text-ink-800">{NOMBRE_PLATAFORMA[p.plataforma]}</p>
                <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-slate-500">Inversión</dt>
                    <dd className="font-medium tabular-nums">{fmtMoney(p.spend)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-slate-500">Leads</dt>
                    <dd className="font-medium tabular-nums">{fmtNum(p.leads)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-slate-500">CPL</dt>
                    <dd className="font-medium tabular-nums">{fmtMoney2(p.cpl)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-slate-500">Agendados</dt>
                    <dd className="font-medium tabular-nums">{fmtNum(p.agendados)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-slate-500">Ganados</dt>
                    <dd className="font-medium tabular-nums">{fmtNum(p.ganados)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-slate-500">ROAS</dt>
                    <dd
                      className={`font-semibold tabular-nums ${
                        p.roas >= 3 ? "text-emerald-600" : p.roas >= 1 ? "text-amber-600" : "text-rose-600"
                      }`}
                    >
                      {p.roas.toLocaleString("es-AR", { maximumFractionDigits: 1 })}x
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink-900">
          {filtro === "todas" ? "Todas las campañas" : `Campañas de ${NOMBRE_PLATAFORMA[filtro]}`}
        </h3>
        <CampaignTable campaigns={visibles} conPlataforma={filtro === "todas"} />
      </section>
    </div>
  );
}
