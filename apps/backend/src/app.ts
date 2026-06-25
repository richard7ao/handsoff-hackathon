import Fastify, { type FastifyInstance } from "fastify";

export type ContentResponse = {
  title: string;
  tagline: string;
  features: { icon: string; title: string; body: string }[];
};

export type HealthResponse = {
  status: string;
  timestamp: number;
  service: string;
};

/**
 * Builds the Fastify app. Reused by the local dev server (src/server.ts)
 * and the Vercel serverless handler (api/index.ts).
 */
export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== "production",
  });

  // CORS for the web app (different origin in production when deployed
  // as separate Vercel projects).
  app.addHook("onRequest", async (req, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      reply.code(204).send();
    }
  });

  app.get<{ Reply: HealthResponse }>("/api/health", async () => {
    return {
      status: "ok",
      timestamp: Date.now(),
      service: "handsoff-api",
    };
  });

  app.get<{ Reply: ContentResponse }>("/api/content", async () => {
    return {
      title: "Handsoff Hackathon",
      tagline: "Ship faster with autonomous agents.",
      features: [
        {
          icon: "▲",
          title: "Vite + React",
          body: "Lightning-fast frontend in apps/web.",
        },
        {
          icon: "⚡",
          title: "Fastify API",
          body: "Serverless backend in apps/api deployed on Vercel.",
        },
        {
          icon: "🧩",
          title: "pnpm monorepo",
          body: "Workspaces wired up and Vercel-ready out of the box.",
        },
      ],
    };
  });

  app.get("/", async () => {
    return { name: "handsoff-api", endpoints: ["/api/health", "/api/content"] };
  });

  return app;
}
