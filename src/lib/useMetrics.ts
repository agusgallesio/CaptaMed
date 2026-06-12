"use client";

import { useEffect, useState } from "react";
import type { DashboardData } from "@/lib/types";
import { useDateRange } from "@/components/DateRangeContext";

export function useMetrics() {
  const { from, to } = useDateRange();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    setError(null);
    fetch(`/api/metrics?from=${from}&to=${to}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Error al cargar métricas");
        return r.json();
      })
      .then((d: DashboardData) => {
        if (!cancelado) setData(d);
      })
      .catch((e: Error) => {
        if (!cancelado) setError(e.message);
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => {
      cancelado = true;
    };
  }, [from, to]);

  return { data, error, loading, from, to };
}
