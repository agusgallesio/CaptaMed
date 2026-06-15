import { NextRequest, NextResponse } from "next/server";
import { PROVIDERS, providerById, ALL_KEYS } from "@/lib/integrations";
import { getSettings, isDbConfigured, isInDb, setSetting, deleteSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Estado de cada integración: qué campos están cargados y desde dónde. */
export async function GET() {
  const valores = await getSettings(ALL_KEYS);
  const enDb = await isInDb(ALL_KEYS);

  const providers = PROVIDERS.map((p) => {
    const campos = p.fields.map((f) => ({
      key: f.key,
      label: f.label,
      secret: f.secret,
      optional: Boolean(f.optional),
      placeholder: f.placeholder ?? "",
      help: f.help ?? "",
      set: Boolean(valores[f.key]),
      fromDb: Boolean(enDb[f.key]),
      // Nunca devolvemos secretos; para no-secretos devolvemos el valor para editar
      value: f.secret ? "" : valores[f.key] ?? "",
    }));
    const configured = p.requeridas.every((k) => Boolean(valores[k]));
    return { id: p.id, nombre: p.nombre, descripcion: p.descripcion, configured, campos };
  });

  return NextResponse.json({ dbAvailable: isDbConfigured(), providers });
}

/** Guarda o borra credenciales de un proveedor. */
export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Para guardar credenciales desde la app necesitás conectar una base de datos (Vercel Postgres). Mientras tanto podés cargarlas como variables de entorno.",
      },
      { status: 400 },
    );
  }

  let body: { provider?: string; action?: "save" | "disconnect"; values?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const provider = providerById(body.provider ?? "");
  if (!provider) return NextResponse.json({ ok: false, error: "Proveedor inválido." }, { status: 400 });

  try {
    if (body.action === "disconnect") {
      for (const f of provider.fields) await deleteSetting(f.key);
      return NextResponse.json({ ok: true });
    }

    const values = body.values ?? {};
    for (const f of provider.fields) {
      const v = values[f.key];
      if (typeof v !== "string") continue;
      const trimmed = v.trim();
      // Vacío en un secreto = no tocar (para no borrar lo ya guardado sin querer)
      if (trimmed === "" && f.secret) continue;
      if (trimmed === "") {
        await deleteSetting(f.key);
      } else {
        await setSetting(f.key, trimmed);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("integraciones POST:", e);
    return NextResponse.json({ ok: false, error: "No se pudo guardar. Revisá la conexión a la base." }, { status: 500 });
  }
}
