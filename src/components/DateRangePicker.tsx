"use client";

import { useDateRange } from "./DateRangeContext";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface Preset {
  label: string;
  range: () => { from: string; to: string };
}

const PRESETS: Preset[] = [
  {
    label: "7 días",
    range: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 6);
      return { from: isoDate(from), to: isoDate(to) };
    },
  },
  {
    label: "30 días",
    range: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 29);
      return { from: isoDate(from), to: isoDate(to) };
    },
  },
  {
    label: "90 días",
    range: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 89);
      return { from: isoDate(from), to: isoDate(to) };
    },
  },
  {
    label: "Este mes",
    range: () => {
      const hoy = new Date();
      return { from: isoDate(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), to: isoDate(hoy) };
    },
  },
  {
    label: "Mes pasado",
    range: () => {
      const hoy = new Date();
      const from = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const to = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
      return { from: isoDate(from), to: isoDate(to) };
    },
  },
];

export default function DateRangePicker() {
  const { from, to, setRange } = useDateRange();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="hidden items-center gap-1 rounded-lg bg-ink-700 p-1 lg:flex">
        {PRESETS.map((p) => {
          const r = p.range();
          const activo = r.from === from && r.to === to;
          return (
            <button
              key={p.label}
              onClick={() => setRange(r.from, r.to)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                activo ? "bg-brand-500 text-white" : "text-slate-300 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5 rounded-lg bg-ink-700 px-2 py-1.5">
        <input
          type="date"
          value={from}
          max={to}
          onChange={(e) => e.target.value && setRange(e.target.value, to)}
          className="bg-transparent text-xs text-white outline-none [color-scheme:dark]"
          aria-label="Desde"
        />
        <span className="text-xs text-slate-400">→</span>
        <input
          type="date"
          value={to}
          min={from}
          onChange={(e) => e.target.value && setRange(from, e.target.value)}
          className="bg-transparent text-xs text-white outline-none [color-scheme:dark]"
          aria-label="Hasta"
        />
      </div>
    </div>
  );
}
