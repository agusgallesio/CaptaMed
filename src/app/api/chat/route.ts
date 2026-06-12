import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { getDashboardData, parseRange } from "@/lib/data/dashboard";
import { SYSTEM_PROMPT, buildDataContext } from "@/lib/ai/context";
import { streamGemini } from "@/lib/ai/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface ChatBody {
  messages: { role: "user" | "assistant"; content: string }[];
  from?: string;
  to?: string;
}

type Provider = "anthropic" | "gemini" | null;

/** Proveedor de IA: forzable con AI_PROVIDER, si no, el que tenga key. */
function resolveProvider(): Provider {
  const forced = process.env.AI_PROVIDER;
  if (forced === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (forced === "gemini" && process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return null;
}

function textResponse(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function streamAnthropic(system: string, dataContext: string, messages: ChatBody["messages"]) {
  const client = new Anthropic();
  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: [
      // Prompt estable primero (cacheable); los datos del período van después
      { type: "text", text: system, cache_control: { type: "ephemeral" } },
      { type: "text", text: dataContext },
    ],
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
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
}

export async function POST(req: NextRequest) {
  const provider = resolveProvider();
  if (!provider) {
    return textResponse(
      "El asistente de IA no está configurado todavía. Agregá ANTHROPIC_API_KEY (Claude) o GEMINI_API_KEY (Google Gemini, gratis en aistudio.google.com) y reiniciá la aplicación. Ver README.",
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

  const { desde, hasta } = parseRange(body.from ?? null, body.to ?? null);
  const data = await getDashboardData(desde, hasta);
  const dataContext = buildDataContext(data);

  try {
    const readable =
      provider === "anthropic"
        ? streamAnthropic(SYSTEM_PROMPT, dataContext, body.messages)
        : await streamGemini(`${SYSTEM_PROMPT}\n\n${dataContext}`, body.messages);

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    console.error("Error consultando al proveedor de IA:", e);
    return textResponse(
      "Ocurrió un error al consultar al asistente. Si usás Gemini gratis, puede ser el límite de consultas por minuto: esperá unos segundos y probá de nuevo.",
    );
  }
}
