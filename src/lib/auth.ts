/**
 * Autenticación mínima por contraseña compartida (APP_PASSWORD) con cookie
 * firmada (HMAC-SHA256). Usa Web Crypto para funcionar tanto en el middleware
 * (edge) como en los route handlers (node).
 *
 * Si APP_PASSWORD no está configurada, la app queda abierta (modo demo).
 */

export const SESSION_COOKIE = "captamed_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 días

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

export function getAppPassword(): string | undefined {
  return envTolerant("APP_PASSWORD");
}

export function isAuthConfigured(): boolean {
  return Boolean(getAppPassword());
}

function authSecret(): string {
  return envTolerant("SESSION_SECRET") || getAppPassword() || "captamed-dev-secret";
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(authSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toHex(sig);
}

export async function createSessionToken(): Promise<string> {
  const issued = Date.now().toString();
  const sig = await hmac(issued);
  return `${issued}.${sig}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [issued, sig] = token.split(".");
  if (!issued || !sig) return false;
  const expected = await hmac(issued);
  if (sig.length !== expected.length) return false;
  // comparación en tiempo constante
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return false;
  const age = (Date.now() - Number(issued)) / 1000;
  return age >= 0 && age < MAX_AGE_SECONDS;
}

export function passwordMatches(input: string): boolean {
  const expected = getAppPassword();
  if (!expected) return false;
  if (input.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < input.length; i++) diff |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export const SESSION_MAX_AGE = MAX_AGE_SECONDS;
