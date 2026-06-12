import type { CampaignSummary } from "@/lib/types";
import { fmtMoney, fmtMoney2, fmtNum } from "@/lib/format";
import PlatformBadge from "./PlatformBadge";

interface Props {
  campaigns: CampaignSummary[];
  /** Mostrar columna de plataforma (útil cuando se listan ambas) */
  conPlataforma?: boolean;
}

export default function CampaignTable({ campaigns, conPlataforma = false }: Props) {
  if (campaigns.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">Sin campañas en el período seleccionado.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-3 font-medium">Campaña</th>
            {conPlataforma && <th className="px-3 py-2 font-medium">Plataforma</th>}
            <th className="px-3 py-2 text-right font-medium">Inversión</th>
            <th className="px-3 py-2 text-right font-medium">CTR</th>
            <th className="px-3 py-2 text-right font-medium">Leads</th>
            <th className="px-3 py-2 text-right font-medium">CPL</th>
            <th className="px-3 py-2 text-right font-medium">Agend.</th>
            <th className="px-3 py-2 text-right font-medium">Asist.</th>
            <th className="px-3 py-2 text-right font-medium">Ganados</th>
            <th className="px-3 py-2 text-right font-medium">Venta</th>
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
              {conPlataforma && (
                <td className="px-3 py-2.5">
                  <PlatformBadge plataforma={c.plataforma} />
                </td>
              )}
              <td className="px-3 py-2.5 text-right tabular-nums">{fmtMoney(c.spend)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {c.ctr.toLocaleString("es-AR", { maximumFractionDigits: 2 })}%
              </td>
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
      <p className="pt-2 text-[11px] text-slate-400">ROAS = venta atribuida / inversión publicitaria</p>
    </div>
  );
}
