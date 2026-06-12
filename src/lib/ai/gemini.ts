/**
 * Proveedor alternativo gratuito: Google Gemini (REST, streaming SSE).
 * API key gratis en https://aistudio.google.com (sin tarjeta).
 *
 * Variables de entorno:
 *  - GEMINI_API_KEY: API key de Google AI Studio
 *  - GEMINI_MODEL: (opcional) default "gemini-2.5-flash"
 */

const BASE = "https://generativelanguage.googleapis.com/v1beta";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Llama a Gemini en streaming y devuelve un stream de texto plano. */
export async function streamGemini(
  system: string,
  messages: ChatMessage[],
): Promise<ReadableStream<Uint8Array>> {
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const url = `${BASE}/models/${model}:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: { maxOutputTokens: 4096 },
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Gemini API ${res.status}: ${await res.text()}`);
  }

  // Re-emite solo el texto de los eventos SSE de Gemini
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // la última línea puede estar incompleta
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload);
          const text: string | undefined =
            json.candidates?.[0]?.content?.parts
              ?.map((p: { text?: string }) => p.text ?? "")
              .join("");
          if (text) controller.enqueue(encoder.encode(text));
        } catch {
          // chunk parcial: se completa en la próxima lectura
          buffer = line + "\n" + buffer;
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}
