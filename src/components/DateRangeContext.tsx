"use client";

import { createContext, useContext, useState } from "react";

interface DateRange {
  from: string;
  to: string;
}

interface Ctx extends DateRange {
  setRange: (from: string, to: string) => void;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function defaultRange(): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: isoDate(from), to: isoDate(to) };
}

const DateRangeContext = createContext<Ctx | null>(null);

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const [range, setRangeState] = useState<DateRange>(defaultRange);
  const setRange = (from: string, to: string) => {
    if (!from || !to) return;
    if (from > to) [from, to] = [to, from];
    setRangeState({ from, to });
  };
  return (
    <DateRangeContext.Provider value={{ ...range, setRange }}>{children}</DateRangeContext.Provider>
  );
}

export function useDateRange(): Ctx {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange debe usarse dentro de DateRangeProvider");
  return ctx;
}
