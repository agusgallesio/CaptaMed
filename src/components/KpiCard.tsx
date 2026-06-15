interface Props {
  titulo: string;
  valor: string;
  detalle?: string;
  acento?: "default" | "ok" | "warn" | "bad";
}

const ACENTOS: Record<NonNullable<Props["acento"]>, string> = {
  default: "text-ink-900 dark:text-slate-100",
  ok: "text-brand-600 dark:text-brand-400",
  warn: "text-amber-600 dark:text-amber-400",
  bad: "text-rose-600 dark:text-rose-400",
};

export default function KpiCard({ titulo, valor, detalle, acento = "default" }: Props) {
  return (
    <div className="card px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{titulo}</p>
      <p className={`mt-1 text-2xl font-semibold ${ACENTOS[acento]}`}>{valor}</p>
      {detalle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{detalle}</p>}
    </div>
  );
}
