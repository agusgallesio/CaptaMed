import type { FunnelStage } from "@/lib/types";
import { fmtNum, fmtPct } from "@/lib/format";

const COLORES = ["bg-brand-300", "bg-brand-400", "bg-brand-500", "bg-brand-600", "bg-brand-700"];

export default function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(1, ...stages.map((s) => s.cantidad));
  return (
    <div className="space-y-2.5">
      {stages.map((s, i) => (
        <div key={s.etapa} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-right text-sm text-slate-600">{s.etapa}</span>
          <div className="h-7 flex-1 rounded-md bg-slate-100">
            <div
              className={`flex h-7 min-w-[2.5rem] items-center justify-end rounded-md pr-2 ${COLORES[i % COLORES.length]}`}
              style={{ width: `${Math.max(8, (s.cantidad / max) * 100)}%` }}
            >
              <span className="text-xs font-semibold text-white">{fmtNum(s.cantidad)}</span>
            </div>
          </div>
          <span className="w-14 shrink-0 text-xs text-slate-500">
            {s.tasaConversion !== null ? fmtPct(s.tasaConversion) : ""}
          </span>
        </div>
      ))}
      <p className="pt-1 text-right text-[11px] text-slate-400">
        % = conversión respecto a la etapa anterior
      </p>
    </div>
  );
}
