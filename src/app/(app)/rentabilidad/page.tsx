"use client";

import { fmtMoney, fmtMoney2, fmtNum, fmtPct } from "@/lib/format";
import { useMetrics } from "@/lib/useMetrics";
import KpiCard from "@/components/KpiCard";
import PlatformBadge from "@/components/PlatformBadge";

export default function Rentabilidad() {
  const { data, error, loading } = useMetrics();

  if (error) return <div className="card border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>;
  if (loading || !data)
    return <div className="flex h-64 items-center justify-center text-sm text-slate-500 dark:text-slate-400">Calculando rentabilidad…</div>;

  const r = data.rentabilidad;
  const topCampañas = [...data.campaigns].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-ink-900 dark:text-slate-100">Rentabilidad de la inversión publicitaria</h2>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <KpiCard titulo="Venta total" valor={fmtMoney(r.ventaTotal)} detalle={`${fmtNum(data.kpis.ganados)} pacientes ganados`} />
        <KpiCard titulo="Inversión" valor={fmtMoney(r.inversion)} />
        <KpiCard
          titulo="RO$ (ganancia)"
          valor={fmtMoney(r.roDinero)}
          detalle="Venta − inversión"
          acento={r.roDinero > 0 ? "ok" : "bad"}
        />
        <KpiCard
          titulo="ROAS"
          valor={`${r.roas.toLocaleString("es-AR", { maximumFractionDigits: 1 })}x`}
          detalle="Venta / inversión"
          acento={r.roas >= 3 ? "ok" : r.roas >= 1 ? "warn" : "bad"}
        />
        <KpiCard
          titulo="ROI"
          valor={fmtPct(r.roi)}
          detalle="(Venta − inversión) / inversión"
          acento={r.roi > 0 ? "ok" : "bad"}
        />
        <KpiCard titulo="Ticket promedio" valor={fmtMoney(r.ticketPromedio)} detalle="Por paciente ganado" />
        <KpiCard titulo="CPL" valor={fmtMoney2(r.cpl)} detalle="Costo por lead" />
        <KpiCard titulo="Costo por agenda" valor={fmtMoney2(r.costoPorAgenda)} />
        <KpiCard titulo="Costo por asistencia" valor={fmtMoney2(r.costoPorAsistencia)} />
        <KpiCard titulo="CAC" valor={fmtMoney2(r.cac)} detalle="Costo por paciente ganado" />
      </div>

      {data.porPlataforma.length > 0 && (
        <section className="card p-4">
          <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-slate-100">Rentabilidad por plataforma</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="py-2 pr-3 font-medium">Plataforma</th>
                  <th className="px-3 py-2 text-right font-medium">Inversión</th>
                  <th className="px-3 py-2 text-right font-medium">Venta</th>
                  <th className="px-3 py-2 text-right font-medium">RO$</th>
                  <th className="px-3 py-2 text-right font-medium">ROAS</th>
                  <th className="px-3 py-2 text-right font-medium">CPL</th>
                  <th className="pl-3 py-2 text-right font-medium">Ticket prom.</th>
                </tr>
              </thead>
              <tbody>
                {data.porPlataforma.map((p) => {
                  const roDinero = p.revenue - p.spend;
                  return (
                    <tr key={p.plataforma} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                      <td className="py-2.5 pr-3">
                        <PlatformBadge plataforma={p.plataforma} />
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{fmtMoney(p.spend)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{fmtMoney(p.revenue)}</td>
                      <td
                        className={`px-3 py-2.5 text-right font-medium tabular-nums ${
                          roDinero >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {fmtMoney(roDinero)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                        {p.roas.toLocaleString("es-AR", { maximumFractionDigits: 1 })}x
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{fmtMoney2(p.cpl)}</td>
                      <td className="py-2.5 pl-3 text-right tabular-nums">
                        {p.ganados > 0 ? fmtMoney(p.revenue / p.ganados) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="card p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-slate-100">Rentabilidad por campaña</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="py-2 pr-3 font-medium">Campaña</th>
                <th className="px-3 py-2 text-right font-medium">Inversión</th>
                <th className="px-3 py-2 text-right font-medium">Venta</th>
                <th className="px-3 py-2 text-right font-medium">RO$</th>
                <th className="px-3 py-2 text-right font-medium">ROAS</th>
                <th className="px-3 py-2 text-right font-medium">Ganados</th>
                <th className="pl-3 py-2 text-right font-medium">Ticket prom.</th>
              </tr>
            </thead>
            <tbody>
              {topCampañas.map((c) => {
                const roDinero = c.revenue - c.spend;
                return (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-ink-700/40">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <PlatformBadge plataforma={c.plataforma} />
                        <span className="font-medium text-ink-800 dark:text-slate-200">{c.nombre}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmtMoney(c.spend)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmtMoney(c.revenue)}</td>
                    <td
                      className={`px-3 py-2.5 text-right font-medium tabular-nums ${
                        roDinero >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {fmtMoney(roDinero)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                      {c.roas.toLocaleString("es-AR", { maximumFractionDigits: 1 })}x
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmtNum(c.ganados)}</td>
                    <td className="py-2.5 pl-3 text-right tabular-nums">
                      {c.ganados > 0 ? fmtMoney(c.revenue / c.ganados) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="pt-2 text-[11px] text-slate-400">
          RO$ = venta atribuida − inversión. La venta se atribuye por el campo UTM de campaña del CRM; los
          tratamientos cerrados sin atribución no se incluyen en estas tablas.
        </p>
      </section>
    </div>
  );
}
