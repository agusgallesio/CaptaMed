import crypto from "crypto";

/**
 * Cifrado simétrico (AES-256-GCM) para credenciales guardadas en la base.
 * La clave deriva de SESSION_SECRET (recomendado) o, en su defecto, APP_PASSWORD.
 * Si cambiás ese secreto, los valores cifrados previos dejan de poder leerse
 * (se ignoran y se cae al valor de variable de entorno si existe).
 */

function getKey(): Buffer {
  const secret =
    process.env.SESSION_SECRET || process.env.APP_PASSWORD || "captamed-insecure-dev-key";
  return crypto.scryptSync(secret, "captamed.settings.v1", 32);
}

export function encryptValue(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return "v1:" + Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptValue(stored: string): string | undefined {
  try {
    if (!stored.startsWith("v1:")) return stored; // valor legacy en texto plano
    const raw = Buffer.from(stored.slice(3), "base64");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return undefined;
  }
}
