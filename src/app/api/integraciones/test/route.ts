import { NextRequest, NextResponse } from "next/server";
import { getMetaConfig } from "@/lib/data/meta";
import { getKommoConfig } from "@/lib/data/kommo";
import { getGoogleConfig, getGoogleAccessToken } from "@/lib/data/google";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface TestResult {
  ok: boolean;
  message: string;
}

async function testMeta(): Promise<TestResult> {
  const { token, account, configured } = await getMetaConfig();
  if (!configured) return { ok: false, message: "Faltan credenciales." };
  const url = `https://graph.facebook.com/v21.0/${account}?fields=name,currency&access_token=${token}`;
  const res = await fetch(url);
  if (res.ok) {
    const j = await res.json();
    return { ok: true, message: `Conectado a "${j.name ?? account}".` };
  }
  const err = await res.json().catch(() => ({}));
  return { ok: false, message: err?.error?.message ?? `Error ${res.status}.` };
}

async function testKommo(): Promise<TestResult> {
  const { base, token, configured } = await getKommoConfig();
  if (!configured) return { ok: false, message: "Faltan credenciales." };
  const res = await fetch(`${base!.replace(/\/$/, "")}/api/v4/account`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) {
    const j = await res.json().catch(() => ({}));
    return { ok: true, message: `Conectado a "${j.name ?? base}".` };
  }
  return { ok: false, message: res.status === 401 ? "Token inválido o vencido." : `Error ${res.status}.` };
}

async function testGoogle(): Promise<TestResult> {
  const cfg = await getGoogleConfig();
  if (!cfg.configured) return { ok: false, message: "Faltan credenciales." };
  try {
    await getGoogleAccessToken(cfg.values);
  } catch {
    return { ok: false, message: "No se pudo renovar el token (Client ID/Secret o Refresh Token inválidos)." };
  }
  return { ok: true, message: "Credenciales OAuth válidas. El developer token se valida al traer datos." };
}

export async function POST(req: NextRequest) {
  let body: { provider?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Solicitud inválida." }, { status: 400 });
  }

  try {
    let result: TestResult;
    if (body.provider === "meta") result = await testMeta();
    else if (body.provider === "kommo") result = await testKommo();
    else if (body.provider === "google") result = await testGoogle();
    else return NextResponse.json({ ok: false, message: "Proveedor inválido." }, { status: 400 });
    return NextResponse.json(result);
  } catch (e) {
    console.error("test conexión:", e);
    return NextResponse.json({ ok: false, message: "Error al probar la conexión." });
  }
}
