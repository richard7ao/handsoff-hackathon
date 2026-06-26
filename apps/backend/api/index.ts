import type { IncomingMessage, ServerResponse } from "node:http";
import Fastify, { type FastifyInstance } from "fastify";

/**
 * Self-contained Fastify app + Vercel serverless entry point.
 * Kept in one file (only the `fastify` npm package is imported) so the Vercel
 * Node runtime can resolve everything — no local cross-file imports to compile.
 * The local dev server (src/server.ts) imports `buildApp` from here too.
 */

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ChatRequest = { messages: ChatMessage[] };
export type ChatResponse = { reply: string };

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const BUZZ_SYSTEM_PROMPT = `You are Buzz, the assistant for a service that helps physical, local businesses market themselves online with zero human effort after a short intake.
You research a business's market, find where its customers talk online (e.g. relevant communities and feeds), draft content in the owner's authentic voice, post it, and improve it based on real engagement.
Be concise, warm, and practical. Speak plainly to busy small-business owners who distrust marketing jargon. Prefer concrete, specific advice over generic tips. Keep replies to a few short sentences unless asked for more.`;

/** Calls the Gemini REST API. Reads GEMINI_API_KEY from env — never hardcode it. */
async function callGemini(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("missing GEMINI_API_KEY");

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: BUZZ_SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 600,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`gemini ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
  return text || "Sorry — I couldn't generate a reply just now. Try again?";
}

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: process.env.NODE_ENV !== "production" });

  app.addHook("onRequest", async (req, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") reply.code(204).send();
  });

  app.get("/api/health", async () => ({
    status: "ok",
    timestamp: Date.now(),
    service: "handsoff-backend",
  }));

  app.post<{ Body: ChatRequest; Reply: ChatResponse | { error: string } }>(
    "/api/chat",
    async (req, reply) => {
      const messages = req.body?.messages;
      if (!Array.isArray(messages) || messages.length === 0) {
        return reply.code(400).send({ error: "messages[] required" });
      }
      const trimmed = messages
        .filter((m) => m && typeof m.content === "string" && m.content.trim())
        .slice(-20)
        .map((m) => ({
          role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: m.content.slice(0, 4000),
        }));
      try {
        const text = await callGemini(trimmed);
        return { reply: text };
      } catch (err) {
        req.log.error(err);
        const msg = err instanceof Error ? err.message : "chat failed";
        const code = msg.includes("GEMINI_API_KEY") ? 503 : 502;
        return reply.code(code).send({ error: msg });
      }
    },
  );

  app.get("/", async () => ({
    name: "handsoff-backend",
    endpoints: ["/api/health", "/api/chat"],
  }));

  return app;
}

// Reuse a single Fastify instance across warm invocations.
const app = buildApp();

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  await app.ready();
  app.server.emit("request", req, res);
}
