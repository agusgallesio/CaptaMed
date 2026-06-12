import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/lib/data/dashboard";

export const dynamic = "force-dynamic";

const PERIODOS_VALIDOS = [7, 30, 90];

export async function GET(req: NextRequest) {
  const raw = parseInt(req.nextUrl.searchParams.get("period") ?? "30", 10);
  const period = PERIODOS_VALIDOS.includes(raw) ? raw : 30;
  try {
    const data = await getDashboardData(period);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error obteniendo métricas:", e);
    return NextResponse.json(
      { error: "No se pudieron obtener las métricas. Revisá las credenciales de Meta/Kommo." },
      { status: 502 },
    );
  }
}
