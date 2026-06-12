import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { getDashboardData } from "@/lib/data/dashboard";
import { SYSTEM_PROMPT, buildDataContext } from "@/lib/ai/context";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface ChatBody {
  messages: { role: "user" | "assistant"; content: string }[];
  period?: number;
}

function textResponse(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return textResponse(
      "El asistente de IA no está configurado todavía. Agregá la variable de entorno ANTHROPIC_API_KEY (ver README) y reiniciá la aplicación.",
    );
  }

  let body: ChatBody;
  try {
    body = await req.json();
  } catch {
    return textResponse("Solicitud inválida.", 400);
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return textResponse("Solicitud inválida.", 400);
  }

  const period = [7, 30, 90].includes(body.period ?? 30) ? body.period! : 30;
  const data = await getDashboardData(period);

  const client = new Anthropic();
  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: [
      // Prompt estable primero (cacheable); los datos del período van después
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      { type: "text", text: buildDataContext(data) },
    ],
    messages: body.messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on("text", (delta) => controller.enqueue(encoder.encode(delta)));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => {
        console.error("Error en stream de Claude:", err);
        controller.enqueue(
          encoder.encode("\n\nOcurrió un error al consultar al asistente. Probá de nuevo en unos segundos."),
        );
        controller.close();
      });
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
