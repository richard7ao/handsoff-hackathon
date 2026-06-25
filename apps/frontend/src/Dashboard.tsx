import { useEffect, useRef, useState } from "react";

const HOME_URL = "/";
const DEMO_URL = "/demo";

function Logo() {
  return (
    <svg className="logo" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="21" fill="none" stroke="var(--accent)" strokeWidth="3" opacity="0.35" />
      <circle cx="32" cy="32" r="12" fill="none" stroke="var(--accent)" strokeWidth="3" opacity="0.6" />
      <circle cx="32" cy="32" r="5" fill="var(--accent)" />
    </svg>
  );
}

/** Flashing red "connected" light used on the integration cards. */
function ConnLight() {
  return (
    <span className="conn-light" aria-hidden="true">
      <span className="ring" />
      <span className="core" />
    </span>
  );
}

/* ---------------- mock data ---------------- */

type Stat = {
  label: string;
  value: string;
  delta: string;
  up: boolean;
  hint: string;
};

const STATS: Stat[] = [
  { label: "Posts published", value: "1,284", delta: "+18.2%", up: true, hint: "across all channels, last 30d" },
  { label: "Total reach", value: "742K", delta: "+31.4%", up: true, hint: "unique impressions, last 30d" },
  { label: "Engagement rate", value: "6.8%", delta: "+1.9pts", up: true, hint: "upvotes + comments / reach" },
  { label: "Avg content score", value: "87/100", delta: "+4 pts", up: true, hint: "self-graded against brief" },
  { label: "Rewrites triggered", value: "212", delta: "-9.1%", up: false, hint: "auto-rewrites when posts lag" },
  { label: "Cost / 1K reach", value: "$0.04", delta: "-22.0%", up: false, hint: "fully autonomous, no ops time" },
];

// weekly reach, in thousands, last 12 weeks
const GROWTH = [82, 96, 91, 118, 134, 129, 162, 188, 205, 241, 268, 312];

type Channel = {
  name: string;
  handle: string;
  status: "connected";
  posts: number;
  reach: string;
  glyph: JSX.Element;
};

function IgGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.4" cy="6.6" r="1.3" fill="currentColor" />
    </svg>
  );
}

function RedditGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <circle cx="12" cy="13.5" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="8.8" cy="13" r="1.25" fill="currentColor" />
      <circle cx="15.2" cy="13" r="1.25" fill="currentColor" />
      <path d="M8.8 16.2c1.9 1.4 4.5 1.4 6.4 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="18.4" cy="6.6" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15.4 6.9 17 6.7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function XGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M4 4l16 16M20 4 4 20" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function WaGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.4-1.1A8.5 8.5 0 1 0 12 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 8.6c-.2.5-.2 1.4.4 2.4.7 1.2 1.7 2 2.9 2.6.9.4 1.8.4 2.3.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const CHANNELS: Channel[] = [
  { name: "Instagram", handle: "@bellas.barbershop", status: "connected", posts: 312, reach: "286K", glyph: <IgGlyph /> },
  { name: "Reddit", handle: "u/bellas_atx", status: "connected", posts: 604, reach: "341K", glyph: <RedditGlyph /> },
  { name: "X", handle: "@bellas_atx", status: "connected", posts: 248, reach: "92K", glyph: <XGlyph /> },
  { name: "WhatsApp", handle: "Business API", status: "connected", posts: 120, reach: "23K", glyph: <WaGlyph /> },
];

type Update = { ts: string; tag: "growth" | "alert" | "insight"; text: string };

const UPDATES: Update[] = [
  {
    ts: "08:02",
    tag: "growth",
    text: "Reach is up 31% week-over-week. r/Austin and Instagram Reels are driving 68% of new impressions.",
  },
  {
    ts: "07:41",
    tag: "insight",
    text: "Posts framed as a local question outperform promos by 2.4x. I've told the CMO agent to bias toward that voice.",
  },
  {
    ts: "06:18",
    tag: "alert",
    text: "Engagement on the Tuesday Reddit post dipped below threshold — Pulse already rewrote and reposted it.",
  },
  {
    ts: "Yesterday",
    tag: "growth",
    text: "Net follower growth crossed +1,000 for the month. Cost per 1K reach fell to $0.04.",
  },
];

function taglabel(t: Update["tag"]) {
  if (t === "growth") return "Growth";
  if (t === "alert") return "Alert";
  return "Insight";
}

/* ---------------- growth chart ---------------- */

function GrowthChart({ data }: { data: number[] }) {
  const w = 720;
  const h = 220;
  const pad = { t: 16, r: 8, b: 24, l: 8 };
  const max = Math.max(...data) * 1.1;
  const min = Math.min(...data) * 0.6;
  const ix = (i: number) => pad.l + (i * (w - pad.l - pad.r)) / (data.length - 1);
  const iy = (v: number) => pad.t + (h - pad.t - pad.b) * (1 - (v - min) / (max - min));

  const line = data.map((v, i) => `${i === 0 ? "M" : "L"}${ix(i).toFixed(1)} ${iy(v).toFixed(1)}`).join(" ");
  const area = `${line} L${ix(data.length - 1).toFixed(1)} ${h - pad.b} L${ix(0).toFixed(1)} ${h - pad.b} Z`;

  return (
    <svg className="dash-chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="Weekly reach growth">
      <defs>
        <linearGradient id="g-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={pad.l} x2={w - pad.r} y1={pad.t + (h - pad.t - pad.b) * g} y2={pad.t + (h - pad.t - pad.b) * g} stroke="var(--border)" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#g-fill)" />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => (
        <circle key={i} cx={ix(i)} cy={iy(v)} r={i === data.length - 1 ? 4.5 : 2.5} fill={i === data.length - 1 ? "var(--accent)" : "var(--panel)"} stroke="var(--accent)" strokeWidth="1.6" />
      ))}
    </svg>
  );
}

export function Dashboard() {
  // tiny "last synced" ticker so the page feels live
  const [synced, setSynced] = useState(0);
  const t = useRef<number | null>(null);
  useEffect(() => {
    t.current = window.setInterval(() => setSynced((s) => s + 1), 1000);
    return () => {
      if (t.current) window.clearInterval(t.current);
    };
  }, []);

  return (
    <>
      {/* ---------- top bar ---------- */}
      <header className="topbar">
        <div className="wrap topbar-inner">
          <a className="brand" href={HOME_URL}>
            <Logo />
            Signal
          </a>
          <nav className="topbar-nav">
            <div className="topbar-links">
              <a href={HOME_URL}>Home</a>
              <a href={DEMO_URL}>Demo</a>
              <a href="#integrations">Integrations</a>
            </div>
            <a className="btn btn-accent" href={DEMO_URL}>
              Go to Demo <span className="arrow">→</span>
            </a>
          </nav>
        </div>
      </header>

      <main className="dash">
        <div className="wrap">
          {/* ---------- header ---------- */}
          <div className="dash-head">
            <div>
              <span className="label label-accent dash-eyebrow">
                <span className="conn-light sm">
                  <span className="ring" />
                  <span className="core" />
                </span>
                Live · CMO Agent
              </span>
              <h1>How the CMO agent is performing.</h1>
              <p>
                Real-time analytics for the autonomous marketing loop — what it published, how it
                landed, and how fast you're growing. Nobody at the keyboard.
              </p>
            </div>
            <div className="dash-sync">
              <span className="dash-sync-dot" />
              Synced {synced === 0 ? "just now" : `${synced}s ago`}
            </div>
          </div>

          {/* ---------- stat grid ---------- */}
          <section className="dash-section">
            <div className="dash-stats">
              {STATS.map((s) => (
                <div className="stat-card" key={s.label}>
                  <span className="stat-label">{s.label}</span>
                  <span className="stat-value">{s.value}</span>
                  <span className={`stat-delta ${s.up ? "up" : "down"}`}>
                    {s.up ? "▲" : "▼"} {s.delta}
                  </span>
                  <span className="stat-hint">{s.hint}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ---------- growth + head of data ---------- */}
          <section className="dash-section dash-split">
            <div className="panel">
              <div className="panel-head">
                <div>
                  <span className="label label-muted">Reach growth · 12 weeks</span>
                  <h2 className="panel-title">Compounding, week over week.</h2>
                </div>
                <span className="panel-badge up">+280% all-time</span>
              </div>
              <GrowthChart data={GROWTH} />
              <div className="chart-axis">
                <span>W1</span>
                <span>W6</span>
                <span>W12</span>
              </div>
            </div>

            <div className="panel data-agent">
              <div className="panel-head">
                <div className="data-agent-id">
                  <span className="data-avatar">A</span>
                  <div>
                    <span className="label label-accent">Head of Data Agent</span>
                    <h2 className="panel-title sm">Atlas</h2>
                  </div>
                </div>
                <span className="dot-pulse">
                  <span className="ring" />
                  <span className="core" />
                </span>
              </div>
              <p className="data-agent-intro">Your growth briefing, refreshed continuously.</p>
              <ul className="update-feed">
                {UPDATES.map((u, i) => (
                  <li className={`update tag-${u.tag}`} key={i}>
                    <div className="update-meta">
                      <span className="update-tag">{taglabel(u.tag)}</span>
                      <span className="update-ts">{u.ts}</span>
                    </div>
                    <p>{u.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ---------- API integrations ---------- */}
          <section className="dash-section" id="integrations">
            <div className="dash-section-head">
              <div>
                <span className="label label-accent">API integrations</span>
                <h2 className="panel-title">Connected channels.</h2>
              </div>
              <span className="conn-summary">
                <ConnLight /> {CHANNELS.length} connected · live
              </span>
            </div>
            <div className="integration-grid">
              {CHANNELS.map((c) => (
                <div className="integration-card" key={c.name}>
                  <div className="integration-top">
                    <span className="integration-glyph">{c.glyph}</span>
                    <span className="integration-status">
                      <ConnLight />
                      Connected
                    </span>
                  </div>
                  <h3 className="integration-name">{c.name}</h3>
                  <span className="integration-handle">{c.handle}</span>
                  <div className="integration-stats">
                    <span>
                      <strong>{c.posts}</strong> posts
                    </span>
                    <span>
                      <strong>{c.reach}</strong> reach
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* ---------- footer ---------- */}
      <footer className="footer">
        <div className="wrap footer-inner">
          <div className="footer-left">
            <Logo />
            <span>© {new Date().getFullYear()} Signal</span>
            <span className="api-status">
              <span className="ok">●</span> all systems operational
            </span>
          </div>
          <div className="footer-right">
            <a href={HOME_URL}>Home</a>
            <a href={DEMO_URL}>Demo</a>
          </div>
        </div>
      </footer>
    </>
  );
}
