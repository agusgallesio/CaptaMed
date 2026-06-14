/**
 * Resolución tolerante de credenciales de IA.
 *
 * Los nombres de variables de entorno en Vercel son sensibles a mayúsculas y
 * guiones bajos. Para evitar que un nombre mal escrito (ej. "geminiapikey" en
 * vez de "GEMINI_API_KEY") deje el asistente sin configurar, buscamos la key
 * normalizando el nombre: minúsculas y sin guiones bajos.
 */

function normalize(name: string): string {
  return name.toLowerCase().replace(/[_-]/g, "");
}

/** Devuelve el valor de la primera env var cuyo nombre normalizado coincida. */
function findEnv(...candidatosNormalizados: string[]): string | undefined {
  const objetivo = new Set(candidatosNormalizados.map(normalize));
  for (const [key, value] of Object.entries(process.env)) {
    if (value && objetivo.has(normalize(key))) return value;
  }
  return undefined;
}

export function getGeminiKey(): string | undefined {
  return findEnv("GEMINI_API_KEY", "GEMINIAPIKEY", "GOOGLE_GEMINI_API_KEY");
}

export function getAnthropicKey(): string | undefined {
  return findEnv("ANTHROPIC_API_KEY", "ANTHROPICAPIKEY", "CLAUDE_API_KEY");
}

export function getGeminiModel(): string {
  return findEnv("GEMINI_MODEL") ?? "gemini-2.5-flash";
}

export function getForcedProvider(): string | undefined {
  return findEnv("AI_PROVIDER");
}
