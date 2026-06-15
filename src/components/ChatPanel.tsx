"use client";

import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGERENCIAS = [
  "¿Cómo vienen las campañas en este período?",
  "¿Qué conviene más: Meta o Google Ads?",
  "¿Cuál es la rentabilidad real de la inversión?",
  "¿Dónde estamos perdiendo pacientes en el embudo?",
  "¿Cómo cierra la proyección de este mes?",
];

export default function ChatPanel({ from, to }: { from: string; to: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function enviar(texto: string) {
    const pregunta = texto.trim();
    if (!pregunta || loading) return;
    setInput("");
    const historia: ChatMessage[] = [...messages, { role: "user", content: pregunta }];
    setMessages([...historia, { role: "assistant", content: "" }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historia, from, to }),
      });
      if (!res.body) throw new Error("Sin respuesta");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acumulado = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acumulado += decoder.decode(value, { stream: true });
        const snapshot = acumulado;
        setMessages([...historia, { role: "assistant", content: snapshot }]);
      }
    } catch {
      setMessages([
        ...historia,
        { role: "assistant", content: "No pude procesar la consulta. Probá de nuevo en unos segundos." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card flex h-full min-h-[480px] flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-sm text-white">
          ✦
        </span>
        <div>
          <h2 className="text-sm font-semibold text-ink-900 dark:text-slate-100">Asistente CaptaMed</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Preguntale a tus datos de campañas y CRM</p>
        </div>
      </div>

      <div ref={scrollRef} className="chat-scroll flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hacé una pregunta en lenguaje natural sobre el período seleccionado. Por ejemplo:
            </p>
            {SUGERENCIAS.map((s) => (
              <button
                key={s}
                onClick={() => enviar(s)}
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:bg-ink-700/40 dark:text-slate-300 dark:hover:bg-ink-700"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-3 py-2 text-sm text-white"
                  : "max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2 text-sm text-slate-800 dark:bg-ink-700 dark:text-slate-200"
              }
            >
              {m.content || (loading && i === messages.length - 1 ? "Analizando tus datos…" : "")}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(input);
        }}
        className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-700"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: ¿cuál fue el CPL de implantes?"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-600 dark:bg-ink-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-brand-900"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
