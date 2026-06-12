import type { CampaignSummary } from "@/lib/types";
import { fmtMoney, fmtMoney2, fmtNum, fmtPct } from "@/lib/format";

export default function CampaignTable({ campaigns }: { campaigns: CampaignSummary[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-3 font-medium">Campaña</th>
            <th className="px-3 py-2 text-right font-medium">Inversión</th>
            <th className="px-3 py-2 text-right font-medium">Leads</th>
            <th className="px-3 py-2 text-right font-medium">CPL</th>
            <th className="px-3 py-2 text-right font-medium">Agend.</th>
            <th className="px-3 py-2 text-right font-medium">Asist.</th>
            <th className="px-3 py-2 text-right font-medium">Ganados</th>
            <th className="px-3 py-2 text-right font-medium">Facturación</th>
            <th className="pl-3 py-2 text-right font-medium">ROAS</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              <td className="py-2.5 pr-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                      c.estado === "ACTIVE" ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                    title={c.estado === "ACTIVE" ? "Activa" : "Pausada"}
                  />
                  <span className="font-medium text-ink-800">{c.nombre}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">{fmtMoney(c.spend)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{fmtNum(c.leads)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{fmtMoney2(c.cpl)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{fmtNum(c.agendados)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{fmtNum(c.asistieron)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-brand-700">{fmtNum(c.ganados)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{fmtMoney(c.revenue)}</td>
              <td
                className={`py-2.5 pl-3 text-right font-semibold tabular-nums ${
                  c.roas >= 3 ? "text-emerald-600" : c.roas >= 1 ? "text-amber-600" : "text-rose-600"
                }`}
              >
                {c.roas.toLocaleString("es-AR", { maximumFractionDigits: 1 })}x
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="pt-2 text-[11px] text-slate-400">
        CTR promedio:{" "}
        {campaigns.length > 0
          ? fmtPct(
              campaigns.reduce((s, c) => s + c.ctr, 0) / campaigns.length,
            )
          : "—"}{" "}
        · ROAS = facturación / inversión publicitaria
      </p>
    </div>
  );
}
