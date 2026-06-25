import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "../src/app.ts";

// Reuse a single Fastify instance across warm invocations.
const app = buildApp();

/**
 * Vercel serverless entry point. All /api/* requests are rewritten here
 * (see vercel.json) and delegated to the Fastify instance.
 */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  await app.ready();
  app.server.emit("request", req, res);
}
