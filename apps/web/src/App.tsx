import { useEffect, useState } from "react";

type Content = {
  title: string;
  tagline: string;
  features: { icon: string; title: string; body: string }[];
};

type Health = { status: string; timestamp: number; service: string };

const FALLBACK: Content = {
  title: "Handsoff Hackathon",
  tagline: "Ship faster with autonomous agents.",
  features: [
    { icon: "▲", title: "Vite + React", body: "Lightning-fast frontend in apps/web." },
    { icon: "⚡", title: "Fastify API", body: "Serverless backend in apps/api." },
    { icon: "🧩", title: "pnpm monorepo", body: "Workspaces wired up and Vercel-ready." },
  ],
};

const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export function App() {
  const [content] = useState<Content>(FALLBACK);
  const [health, setHealth] = useState<Health | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    getJson<Health>("/api/health")
      .then(setHealth)
      .catch((e) => setHealthError(String(e)));
  }, []);

  return (
    <div className="container">
      <nav className="nav">
        <div className="brand">
          <img className="logo" src="/favicon.svg" alt="logo" />
          <span>Handsoff</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#status">Status</a>
          <a
            href="https://vercel.com/docs/monorepos"
            target="_blank"
            rel="noreferrer"
          >
            Docs
          </a>
        </div>
        <a className="cta" href="#cta">
          Get started
        </a>
      </nav>

      <header className="hero">
        <span className="pill">
          <span className="dot" />
          Monorepo &middot; Vercel-ready
        </span>
        <h1>
          <span className="grad">{content.title}</span>
        </h1>
        <p className="lead">{content.tagline}</p>
        <div className="hero-actions" id="cta">
          <a
            className="cta"
            href="https://github.com/richardlao/handsoff-hackathon"
            target="_blank"
            rel="noreferrer"
          >
            View on GitHub
          </a>
          <a className="cta ghost" href="#features">
            See features
          </a>
        </div>
      </header>

      <section className="features" id="features">
        <div className="section-title">
          <h2>Everything wired up for you</h2>
          <p>A mock monorepo you can deploy in minutes.</p>
        </div>
        <div className="grid">
          {content.features.map((f) => (
            <div className="card" key={f.title}>
              <div className="icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>

        <div className="status" id="status">
          API status:{" "}
          {health ? (
            <>
              <span className="ok">●</span> <code>{health.status}</code>{" "}
              from <code>{health.service}</code> @{" "}
              {new Date(health.timestamp).toLocaleTimeString()}
            </>
          ) : healthError ? (
            <>
              <span className="err">●</span> <code>unreachable</code> ({healthError})
            </>
          ) : (
            <code>checking…</code>
          )}
        </div>
      </section>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Handsoff Hackathon</span>
        <span>Built with Vite + Fastify</span>
      </footer>
    </div>
  );
}
