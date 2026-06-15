"use client";

import { useEffect, useState } from "react";

interface Campo {
  key: string;
  label: string;
  secret: boolean;
  optional: boolean;
  placeholder: string;
  help: string;
  set: boolean;
  fromDb: boolean;
  value: string;
}
interface Provider {
  id: string;
  nombre: string;
  descripcion: string;
  configured: boolean;
  campos: Campo[];
}

export default function Integraciones() {
  const [dbAvailable, setDbAvailable] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  async function cargar() {
    setLoading(true);
    const res = await fetch("/api/integraciones");
    const j = await res.json();
    setDbAvailable(j.dbAvailable);
    setProviders(j.providers);
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-sm text-slate-500 dark:text-slate-400">Cargando integraciones…</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-ink-900 dark:text-slate-100">Integraciones</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Conectá las fuentes de datos de la clínica. Las credenciales se guardan cifradas y solo se usan para
          traer tus métricas.
        </p>
      </div>

      {!dbAvailable && (
        <div className="card border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          Para <strong>guardar credenciales desde acá</strong> necesitás conectar una base de datos (Vercel
          Postgres). Mientras tanto, esta pantalla muestra el estado de lo cargado por variables de entorno.
        </div>
      )}

      {providers.map((p) => (
        <ProviderCard key={p.id} provider={p} dbAvailable={dbAvailable} onChanged={cargar} />
      ))}
    </div>
  );
}

function ProviderCard({
  provider,
  dbAvailable,
  onChanged,
}: {
  provider: Provider;
  dbAvailable: boolean;
  onChanged: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function guardar() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/integraciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: provider.id, action: "save", values }),
      });
      const j = await res.json();
      if (!j.ok) setMsg({ ok: false, text: j.error ?? "No se pudo guardar." });
      else {
        setMsg({ ok: true, text: "Guardado." });
        setValues({});
        onChanged();
      }
    } finally {
      setSaving(false);
    }
  }

  async function probar() {
    setTesting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/integraciones/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: provider.id }),
      });
      const j = await res.json();
      setMsg({ ok: j.ok, text: j.message });
    } finally {
      setTesting(false);
    }
  }

  async function desconectar() {
    if (!confirm(`¿Desconectar ${provider.nombre}? Se borran las credenciales guardadas.`)) return;
    setSaving(true);
    setMsg(null);
    try {
      await fetch("/api/integraciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: provider.id, action: "disconnect" }),
      });
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-slate-100">
            {provider.nombre}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                provider.configured
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              }`}
            >
              {provider.configured ? "Conectado" : "Sin conectar"}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{provider.descripcion}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {provider.campos.map((c) => (
          <label key={c.key} className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              {c.label}
              {c.optional && <span className="text-slate-400"> (opcional)</span>}
            </span>
            <input
              type={c.secret ? "password" : "text"}
              value={values[c.key] ?? (c.secret ? "" : c.value)}
              placeholder={c.secret && c.set ? "•••••••• (guardado)" : c.placeholder}
              onChange={(e) => setValues((v) => ({ ...v, [c.key]: e.target.value }))}
              disabled={!dbAvailable}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-600 dark:bg-ink-900 dark:text-slate-100 dark:focus:ring-brand-900 dark:disabled:bg-ink-800"
            />
            {c.help && <span className="mt-0.5 block text-[11px] text-slate-400 dark:text-slate-500">{c.help}</span>}
          </label>
        ))}
      </div>

      {msg && (
        <p className={`mt-3 text-xs ${msg.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
          {msg.text}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={guardar}
          disabled={saving || !dbAvailable}
          className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-40"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button
          onClick={probar}
          disabled={testing || !provider.configured}
          className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-ink-700/40"
        >
          {testing ? "Probando…" : "Probar conexión"}
        </button>
        {provider.configured && dbAvailable && (
          <button
            onClick={desconectar}
            disabled={saving}
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-40 dark:text-rose-400 dark:hover:bg-rose-500/10"
          >
            Desconectar
          </button>
        )}
      </div>
    </section>
  );
}
