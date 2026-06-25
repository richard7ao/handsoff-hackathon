import { useEffect, useState } from "react";
import { Pipeline } from "./Pipeline";

/** Where "Go to Demo" points — the interactive demo page in this app. */
const DEMO_URL = "/demo";

type Health = { status: string; timestamp: number; service: string };
const API_BASE = import.meta.env.VITE_API_URL ?? "";

function Live() {
  return (
    <span className="live" aria-hidden="true">
      <span className="ring" />
      <span className="core" />
    </span>
  );
}

function Logo() {
  return (
    <svg className="logo" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="21" fill="none" stroke="var(--accent)" strokeWidth="3" opacity="0.35" />
      <circle cx="32" cy="32" r="12" fill="none" stroke="var(--accent)" strokeWidth="3" opacity="0.6" />
      <circle cx="32" cy="32" r="5" fill="var(--accent)" />
    </svg>
  );
}

const PROBLEMS = [
  {
    n: "01",
    title: "They are the bottleneck",
    body: "Marketing waits on the one person already running the counter all day. Nothing ships because no one has the time.",
  },
  {
    n: "02",
    title: "They don't know where to talk",
    body: "Their customers gather in specific subreddits and threads. The owner has never seen them, and wouldn't know what to say.",
  },
  {
    n: "03",
    title: "One post and done",
    body: "Even when something gets posted, nobody watches what happens. No iteration, no learning, no second attempt.",
  },
];

const FLOW = [
  { n: "00", title: "Describe", body: "A 5-minute conversation. Five questions, no dashboard." },
  { n: "01", title: "Research", body: "Find the market and where its customers actually talk." },
  { n: "02", title: "Write & post", body: "Draft in the business's voice, score it, ship it." },
  { n: "03", title: "Improve", body: "Watch engagement; rewrite when it underperforms." },
];

type Agent = {
  label: string;
  name: string;
  role: string;
  desc: string;
  stack: string[];
  handoff: string;
};

const AGENTS: Agent[] = [
  {
    label: "Agent 01 · Intake",
    name: "Jack",
    role: "the intake conversation",
    desc: "Five questions over WhatsApp or a web form. Jack turns a 5-minute chat into a structured business brief — the only human input the system will ever need.",
    stack: ["WhatsApp", "Vercel form", "Supabase"],
    handoff: "→ hands the brief to Scout",
  },
  {
    label: "Agent 02 · Research & content",
    name: "Scout",
    role: "the long-running researcher",
    desc: "Reads Reddit, finds the audience, drafts a post, and scores it against the brief. Scout runs 30–45 minutes unattended — work a human would never sit through.",
    stack: ["Hermes", "Modal", "Reddit API"],
    handoff: "→ queues the post for Pulse",
  },
  {
    label: "Agent 03 · Posting & self-improvement",
    name: "Pulse",
    role: "the engagement loop",
    desc: "Posts to Reddit, then checks engagement every 10 minutes. When upvotes lag, Pulse rewrites and reposts — logging its reasoning at every step.",
    stack: ["Hermes cron", "Reddit API", "engagement loop"],
    handoff: "↻ keeps improving, on its own",
  },
];

const SPONSORS = [
  { name: "Cursor", mark: "C", bg: "#1a1a1a", fg: "#ffffff" },
  { name: "PayPal", mark: "P", bg: "#003087", fg: "#ffffff" },
  { name: "Supabase", mark: "S", bg: "#3ecf8e", fg: "#1a1a1a" },
  { name: "Wassist", mark: "W", bg: "#c41e3a", fg: "#ffffff" },
];

export function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [healthError, setHealthError] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setHealth)
      .catch(() => setHealthError(true));
  }, []);

  return (
    <>
      {/* ---------- top bar ---------- */}
      <header className="topbar">
        <div className="wrap topbar-inner">
          <a className="brand" href="#top">
            <Logo />
            Signal
          </a>
          <nav className="topbar-nav">
            <div className="topbar-links">
              <a href="#problem">Problem</a>
              <a href="#how">How it works</a>
              <a href="#agents">The agents</a>
              <a href="/content">Studio</a>
              <a href="/marketplace">Marketplace</a>
              <a href="/dashboard">Dashboard</a>
              <a href="/chat">Assistant</a>
            </div>
            <a className="btn btn-accent" href={DEMO_URL}>
              Go to Demo <span className="arrow">→</span>
            </a>
          </nav>
        </div>
      </header>

      <main id="top">
        {/* ---------- hero ---------- */}
        <section className="hero">
          <div className="wrap reveal">
            <span className="kicker label label-accent">
              <Live />
              Zero human input after intake
            </span>
            <h1>The business that markets itself.</h1>
            <p className="sub">
              Three agents. One five-minute conversation. Nobody at the keyboard.
            </p>
            <p className="lead">
              A physical business describes itself in a <strong>5-minute conversation</strong>.
              Signal researches their market, finds where their customers talk online, writes
              content in their voice, posts it — and <strong>self-improves</strong> based on real
              engagement.
            </p>
            <div className="hero-actions">
              <a className="btn btn-accent" href={DEMO_URL}>
                Go to Demo <span className="arrow">→</span>
              </a>
              <a className="btn btn-ghost" href="#agents">
                Meet the agents
              </a>
            </div>
            <div className="sponsors">
              <span className="sponsors-label label label-muted">Sponsored by</span>
              <span className="sponsors-rule" aria-hidden="true" />
              <ul className="sponsors-list">
                {SPONSORS.map((s) => (
                  <li className="sponsor" key={s.name}>
                    <span className="sponsor-mark" style={{ background: s.bg, color: s.fg }}>
                      {s.mark}
                    </span>
                    <span className="sponsor-name">{s.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ---------- pipeline diagram ---------- */}
        <Pipeline />

        {/* ---------- problem ---------- */}
        <section className="band" id="problem">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow label label-accent">The problem</span>
              <h2>Local businesses can't market themselves online.</h2>
              <p>
                It isn't a tools problem. The owner is the ceiling — they have the craft, but not
                the time, the reach, or the patience to iterate. So nothing happens.
              </p>
            </div>
            <div className="cards">
              {PROBLEMS.map((p) => (
                <div className="card" key={p.n}>
                  <span className="num">{p.n}</span>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- how it works ---------- */}
        <section id="how">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow label label-accent">How it works</span>
              <h2>One conversation in. A marketing team out.</h2>
              <p>
                After the 5-minute intake, no one logs in again. The system runs the whole loop on
                its own — and keeps running.
              </p>
            </div>
            <div className="steps">
              {FLOW.map((f) => (
                <div className="step" key={f.n}>
                  <span className="n">{f.n}</span>
                  <h4>{f.title}</h4>
                  <p>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- agents ---------- */}
        <section className="band" id="agents">
          <div className="wrap">
            <div className="section-head center">
              <span className="eyebrow label label-accent">The three agents</span>
              <h2>Jack hands off to Scout. Scout hands off to Pulse.</h2>
              <p>
                Three agents, three jobs — from the first hello to the rewrite at midnight.
              </p>
            </div>
            <div className="agent-grid">
              {AGENTS.map((a) => (
                <article className="agent" key={a.name}>
                  <span className="agent-label">{a.label}</span>
                  <h3>{a.name}</h3>
                  <span className="role">{a.role}</span>
                  <p className="desc">{a.desc}</p>
                  <div className="stack">
                    {a.stack.map((s) => (
                      <span className="tag" key={s}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="handoff">{a.handoff}</div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- closing cta ---------- */}
        <section className="cta">
          <div className="wrap">
            <span className="eyebrow label label-accent">See it run</span>
            <h2 style={{ marginTop: 14 }}>See Signal run, unattended.</h2>
            <p>
              Watch Jack, Scout, and Pulse take a business from a 5-minute chat to a live,
              self-improving post — no human at the keyboard.
            </p>
            <div className="cta-actions">
              <a className="btn btn-accent" href={DEMO_URL}>
                Go to Demo <span className="arrow">→</span>
              </a>
              <a className="btn btn-dark" href="#top">
                Back to top
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ---------- footer ---------- */}
      <footer className="footer">
        <div className="wrap footer-inner">
          <div className="footer-left">
            <Logo />
            <span>© {new Date().getFullYear()} Signal</span>
            <span className="api-status">
              {health ? (
                <>
                  <span className="ok">●</span> api {health.status}
                </>
              ) : healthError ? (
                <>
                  <span className="err">●</span> api offline
                </>
              ) : (
                <>● checking…</>
              )}
            </span>
          </div>
          <div className="footer-right">
            <a href="#problem">Problem</a>
            <a href="#how">How it works</a>
            <a href="#agents">Agents</a>
            <a href={DEMO_URL}>
              Go to Demo →
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
