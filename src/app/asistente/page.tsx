"use client";

import { useDateRange } from "@/components/DateRangeContext";
import { fmtFecha } from "@/lib/format";
import ChatPanel from "@/components/ChatPanel";

export default function Asistente() {
  const { from, to } = useDateRange();
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-ink-900">Asistente IA</h2>
        <p className="text-xs text-slate-500">
          Consultá en lenguaje natural sobre tus campañas, rentabilidad y CRM. Las respuestas usan los datos del
          período {fmtFecha(from)} al {fmtFecha(to)} (cambialo arriba a la derecha).
        </p>
      </div>
      <div className="h-[calc(100vh-12rem)] min-h-[460px]">
        <ChatPanel from={from} to={to} />
      </div>
    </div>
  );
}
