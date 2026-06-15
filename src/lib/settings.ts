import { sql } from "@vercel/postgres";
import { encryptValue, decryptValue } from "./crypto";

/**
 * Capa de configuración: lee credenciales primero de Postgres (lo que se carga
 * desde la sección Integraciones) y, si no hay base o no está esa clave, cae a
 * la variable de entorno (con nombre tolerante a mayúsculas/guiones).
 *
 * Así la app funciona en tres modos sin tocar código:
 *  - con Postgres conectado → credenciales gestionadas desde la UI
 *  - sin base pero con env vars → como antes
 *  - sin nada → modo demo
 */

export function isDbConfigured(): boolean {
  return Boolean(
    process.env.POSTGRES_URL ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.DATABASE_URL,
  );
}

let tableReady = false;
async function ensureTable(): Promise<void> {
  if (tableReady) return;
  await sql`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  tableReady = true;
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[_-]/g, "");
}

function envTolerant(key: string): string | undefined {
  const target = normalize(key);
  for (const [k, v] of Object.entries(process.env)) {
    if (v && normalize(k) === target) return v;
  }
  return undefined;
}

export async function getSetting(key: string): Promise<string | undefined> {
  const fromDb = (await getSettings([key]))[key];
  return fromDb;
}

/** Devuelve un mapa clave→valor resolviendo DB primero y env como fallback. */
export async function getSettings(keys: string[]): Promise<Record<string, string | undefined>> {
  const dbVals: Record<string, string> = {};
  if (isDbConfigured() && keys.length > 0) {
    try {
      await ensureTable();
      const { rows } = await sql.query<{ key: string; value: string }>(
        "SELECT key, value FROM settings WHERE key = ANY($1)",
        [keys],
      );
      for (const r of rows) {
        const dec = decryptValue(r.value);
        if (dec) dbVals[r.key] = dec;
      }
    } catch (e) {
      console.error("settings.getSettings:", e);
    }
  }
  const out: Record<string, string | undefined> = {};
  for (const k of keys) out[k] = dbVals[k] ?? envTolerant(k);
  return out;
}

export async function setSetting(key: string, value: string): Promise<void> {
  if (!isDbConfigured()) throw new Error("NO_DB");
  await ensureTable();
  const enc = encryptValue(value);
  await sql`INSERT INTO settings (key, value, updated_at)
            VALUES (${key}, ${enc}, now())
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
}

export async function deleteSetting(key: string): Promise<void> {
  if (!isDbConfigured()) throw new Error("NO_DB");
  await ensureTable();
  await sql`DELETE FROM settings WHERE key = ${key}`;
}

/** ¿La clave está definida en DB (no por env)? Útil para el estado de la UI. */
export async function isInDb(keys: string[]): Promise<Record<string, boolean>> {
  const out: Record<string, boolean> = {};
  for (const k of keys) out[k] = false;
  if (!isDbConfigured() || keys.length === 0) return out;
  try {
    await ensureTable();
    const { rows } = await sql.query<{ key: string }>(
      "SELECT key FROM settings WHERE key = ANY($1)",
      [keys],
    );
    for (const r of rows) out[r.key] = true;
  } catch (e) {
    console.error("settings.isInDb:", e);
  }
  return out;
}
