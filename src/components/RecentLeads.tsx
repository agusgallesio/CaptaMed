import type { Lead } from "@/lib/types";
import { fmtFecha } from "@/lib/format";

const BADGE: Record<Lead["status"], string> = {
  abierto: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  ganado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  perdido: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

function etapaActual(l: Lead): string {
  if (l.status === "ganado") return "Ganado";
  if (l.status === "perdido") return "Perdido";
  if (l.asistio) return "Asistió";
  if (l.agendado) return "Agendado";
  if (l.contactado) return "Contactado";
  return "Nuevo";
}

export default function RecentLeads({ leads }: { leads: Lead[] }) {
  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {leads.map((l) => (
        <li key={l.id} className="flex items-center justify-between gap-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink-800 dark:text-slate-200">{l.nombre}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {l.tratamiento || "Consulta"} · {fmtFecha(l.createdAt)}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${BADGE[l.status]}`}>
            {etapaActual(l)}
          </span>
        </li>
      ))}
    </ul>
  );
}
