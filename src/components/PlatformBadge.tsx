import type { Plataforma } from "@/lib/types";

const ESTILOS: Record<Plataforma, { label: string; clase: string }> = {
  meta: { label: "Meta", clase: "bg-blue-100 text-blue-700" },
  google: { label: "Google", clase: "bg-amber-100 text-amber-700" },
};

export default function PlatformBadge({ plataforma }: { plataforma: Plataforma }) {
  const e = ESTILOS[plataforma];
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${e.clase}`}>
      {e.label}
    </span>
  );
}
