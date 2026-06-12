import { NextRequest, NextResponse } from "next/server";
import { getDashboardData, parseRange } from "@/lib/data/dashboard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { desde, hasta } = parseRange(
    req.nextUrl.searchParams.get("from"),
    req.nextUrl.searchParams.get("to"),
  );
  try {
    const data = await getDashboardData(desde, hasta);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error obteniendo métricas:", e);
    return NextResponse.json(
      { error: "No se pudieron obtener las métricas. Revisá las credenciales de Meta/Google/Kommo." },
      { status: 502 },
    );
  }
}
