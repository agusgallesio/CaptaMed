import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Diagnóstico de configuración (no expone valores, solo si existen).
 * Visitá /api/health en el navegador para verificar el deploy.
 */
export async function GET() {
  const anthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  const gemini = Boolean(process.env.GEMINI_API_KEY);
  return NextResponse.json({
    ok: true,
    ia: {
      anthropic_api_key_detectada: anthropic,
      gemini_api_key_detectada: gemini,
      proveedor_activo: anthropic ? "anthropic" : gemini ? "gemini" : null,
    },
    integraciones: {
      meta_configurada: Boolean(process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID),
      kommo_configurada: Boolean(process.env.KOMMO_BASE_URL && process.env.KOMMO_ACCESS_TOKEN),
      google_ads_configurada: Boolean(process.env.GOOGLE_ADS_DEVELOPER_TOKEN),
    },
    // Nombres de variables de entorno presentes que empiezan con GEMINI/ANTHROPIC
    // (solo nombres, nunca valores) — útil para detectar nombres mal escritos
    variables_relacionadas_detectadas: Object.keys(process.env).filter((k) =>
      /^(GEMINI|ANTHROPIC|AI_PROVIDER)/i.test(k),
    ),
  });
}
