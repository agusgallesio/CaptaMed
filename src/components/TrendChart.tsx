import type { TrendPoint } from "@/lib/types";
import { fmtFecha } from "@/lib/format";

const W = 640;
const H = 180;
const PAD = { top: 12, right: 8, bottom: 22, left: 28 };

function buildPath(points: TrendPoint[], key: "leads" | "agendados", max: number): string {
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;
  return points
    .map((p, i) => {
      const x = PAD.left + i * step;
      const y = PAD.top + innerH - (p[key] / max) * innerH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function TrendChart({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) return null;
  const max = Math.max(1, ...points.map((p) => p.leads));
  const leadsPath = buildPath(points, "leads", max);
  const agendadosPath = buildPath(points, "agendados", max);
  const innerH = H - PAD.top - PAD.bottom;
  const areaPath = `${leadsPath} L${W - PAD.right},${PAD.top + innerH} L${PAD.left},${PAD.top + innerH} Z`;
  const first = points[0].date;
  const last = points[points.length - 1].date;
  const mid = points[Math.floor(points.length / 2)].date;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Tendencia de leads y agendamientos">
        {[0, 0.5, 1].map((f) => {
          const y = PAD.top + innerH - f * innerH;
          return (
            <g key={f}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={PAD.left - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
                {Math.round(f * max)}
              </text>
            </g>
          );
        })}
        <path d={areaPath} fill="#2d9d92" opacity="0.08" />
        <path d={leadsPath} fill="none" stroke="#217e77" strokeWidth="2" />
        <path d={agendadosPath} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" />
        {[
          { d: first, anchor: "start" as const, x: PAD.left },
          { d: mid, anchor: "middle" as const, x: PAD.left + (W - PAD.left - PAD.right) / 2 },
          { d: last, anchor: "end" as const, x: W - PAD.right },
        ].map((t) => (
          <text key={t.d + t.anchor} x={t.x} y={H - 6} textAnchor={t.anchor} fontSize="9" fill="#94a3b8">
            {fmtFecha(t.d)}
          </text>
        ))}
      </svg>
      <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-brand-600" /> Leads
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-amber-500" /> Agendados
        </span>
      </div>
    </div>
  );
}
