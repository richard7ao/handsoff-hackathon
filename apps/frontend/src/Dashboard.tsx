import { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar, useRailCollapsed } from "./Sidebar";

/* ---------------- small primitives ---------------- */

/** Flashing red "connected" light. */
function ConnLight({ sm = false }: { sm?: boolean }) {
  return (
    <span className={`conn-light${sm ? " sm" : ""}`} aria-hidden="true">
      <span className="ring" />
      <span className="core" />
    </span>
  );
}

/** Compact inline sparkline. */
function Spark({ data, neg = false }: { data: number[]; neg?: boolean }) {
  const w = 96;
  const h = 30;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - 2) + 1;
    const y = h - 3 - ((v - min) / span) * (h - 6);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const color = neg ? "var(--d-neg)" : "var(--d-pos)";
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="1.9" fill={color} />
    </svg>
  );
}

/* ---------------- channel glyphs ---------------- */

function IgGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  );
}
function RedditGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="13.5" r="8" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="9" cy="13" r="1.15" fill="currentColor" />
      <circle cx="15" cy="13" r="1.15" fill="currentColor" />
      <path d="M9 16c1.8 1.3 4.2 1.3 6 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="18" cy="7" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function XGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function WaGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M12 4a8 8 0 0 0-6.9 12l-1 4 4.1-1A8 8 0 1 0 12 4Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9.4 9c-.2.5-.2 1.3.4 2.2.7 1.1 1.6 1.9 2.7 2.4.8.4 1.6.4 2.1.1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- data ---------------- */

type Range = "7D" | "30D" | "90D";

const REACH: Record<Range, { points: number[]; ticks: string[] }> = {
  "7D": { points: [38, 41, 37, 46, 52, 49, 58], ticks: ["Mon", "Wed", "Fri", "Sun"] },
  "30D": { points: [82, 96, 91, 118, 134, 129, 162, 188, 205, 241, 268, 312], ticks: ["W1", "W6", "W12"] },
  "90D": { points: [120, 148, 162, 201, 244, 268, 332, 401, 466, 558, 642, 742], ticks: ["Jan", "Feb", "Mar"] },
};

type Kpi = {
  label: string;
  value: string;
  delta: string;
  /** false => lower is better (e.g. cost) */
  higherBetter?: boolean;
  spark: number[];
};

const KPIS: Kpi[] = [
  { label: "Total reach", value: "742K", delta: "+31.4%", spark: [12, 14, 13, 18, 20, 19, 24, 28, 31, 36, 41, 48] },
  { label: "Engagement rate", value: "6.8%", delta: "+1.9pts", spark: [4.1, 4.4, 4.2, 4.9, 5.3, 5.1, 5.8, 6.0, 6.2, 6.4, 6.6, 6.8] },
  { label: "Posts published", value: "1,284", delta: "+18.2%", spark: [60, 72, 70, 88, 96, 101, 118, 132, 140, 156, 168, 180] },
  { label: "Avg content score", value: "87", delta: "+4 pts", spark: [78, 79, 80, 81, 82, 83, 83, 84, 85, 86, 86, 87] },
  { label: "Cost / 1K reach", value: "$0.04", delta: "-22.0%", higherBetter: false, spark: [0.09, 0.085, 0.08, 0.072, 0.066, 0.06, 0.055, 0.05, 0.047, 0.044, 0.042, 0.04] },
];

type Channel = {
  name: string;
  handle: string;
  glyph: JSX.Element;
  posts: number;
  reach: string;
  eng: string;
  trend: number[];
};

const CHANNELS: Channel[] = [
  { name: "Reddit", handle: "u/bellas_atx", glyph: <RedditGlyph />, posts: 604, reach: "341K", eng: "8.1%", trend: [20, 24, 22, 30, 36, 41, 52] },
  { name: "Instagram", handle: "@bellas.barbershop", glyph: <IgGlyph />, posts: 312, reach: "286K", eng: "6.2%", trend: [18, 19, 22, 26, 28, 33, 38] },
  { name: "X", handle: "@bellas_atx", glyph: <XGlyph />, posts: 248, reach: "92K", eng: "4.4%", trend: [12, 13, 11, 14, 13, 15, 16] },
  { name: "WhatsApp", handle: "Business API", glyph: <WaGlyph />, posts: 120, reach: "23K", eng: "11.3%", trend: [6, 7, 7, 8, 9, 9, 10] },
];

type Update = { ts: string; tag: "Growth" | "Alert" | "Insight"; text: string };

const UPDATES: Update[] = [
  { ts: "08:02", tag: "Growth", text: "Reach +31% WoW. r/Austin and IG Reels drive 68% of new impressions." },
  { ts: "07:41", tag: "Insight", text: "Local-question framing outperforms promos 2.4×. Biased the CMO agent toward it." },
  { ts: "06:18", tag: "Alert", text: "Tue Reddit post dipped below threshold — Pulse rewrote and reposted." },
  { ts: "Tue", tag: "Growth", text: "Net follower growth crossed +1,000 this month. CPM down to $0.04." },
];

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "channels", label: "Channels" },
  { id: "briefing", label: "Data briefing" },
  { id: "integrations", label: "Integrations" },
];

/* ---------------- main chart ---------------- */

function ReachChart({ data }: { data: number[] }) {
  const w = 760;
  const h = 240;
  const pad = { t: 14, r: 6, b: 8, l: 6 };
  const max = Math.max(...data) * 1.08;
  const min = Math.min(...data) * 0.7;
  const ix = (i: number) => pad.l + (i * (w - pad.l - pad.r)) / (data.length - 1);
  const iy = (v: number) => pad.t + (h - pad.t - pad.b) * (1 - (v - min) / (max - min));
  const line = data.map((v, i) => `${i ? "L" : "M"}${ix(i).toFixed(1)} ${iy(v).toFixed(1)}`).join(" ");
  const area = `${line} L${ix(data.length - 1).toFixed(1)} ${h - pad.b} L${ix(0).toFixed(1)} ${h - pad.b} Z`;
  return (
    <svg className="reach-chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="Reach over selected period">
      <defs>
        <linearGradient id="reach-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--d-accent)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--d-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.33, 0.66, 1].map((g) => (
        <line key={g} x1={pad.l} x2={w - pad.r} y1={pad.t + (h - pad.t - pad.b) * g} y2={pad.t + (h - pad.t - pad.b) * g} stroke="var(--d-line)" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#reach-fill)" />
      <path d={line} fill="none" stroke="var(--d-accent)" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={ix(data.length - 1)} cy={iy(data[data.length - 1])} r="4" fill="var(--d-accent)" stroke="var(--d-surface)" strokeWidth="2" />
    </svg>
  );
}

/* ---------------- page ---------------- */

export function Dashboard() {
  const [range, setRange] = useState<Range>("30D");
  const [active, setActive] = useState("overview");
  const [synced, setSynced] = useState(0);
  const [collapsed, setCollapsed] = useRailCollapsed();
  const t = useRef<number | null>(null);

  useEffect(() => {
    t.current = window.setInterval(() => setSynced((s) => (s + 1) % 60), 1000);
    return () => {
      if (t.current) window.clearInterval(t.current);
    };
  }, []);

  const reach = useMemo(() => REACH[range], [range]);

  return (
    <div className={`dash-app${collapsed ? " is-rail-collapsed" : ""}`}>
      {/* ---------- sidebar ---------- */}
      <Sidebar current="dashboard" collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)}>
        <nav className="rail-nav">
          <span className="rail-section">Analytics</span>
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className={`rail-link${active === n.id ? " is-active" : ""}`}
              onClick={() => setActive(n.id)}
              title={n.label}
            >
              <span className="rail-ico rail-ico-dot" aria-hidden="true" />
              <span className="rail-label">{n.label}</span>
            </a>
          ))}
        </nav>
      </Sidebar>

      {/* ---------- content ---------- */}
      <main className="dash-main">
        {/* toolbar */}
        <header className="dash-toolbar">
          <div className="toolbar-title">
            <h1>CMO Agent · Overview</h1>
            <span className="toolbar-sub">Autonomous marketing performance</span>
          </div>
          <div className="toolbar-actions">
            <a className="btn btn-accent btn-sm" href="/schedule">
              Schedule content <span className="arrow">→</span>
            </a>
            <span className="sync-pill">
              <span className="sync-dot" /> synced {synced === 0 ? "now" : `${synced}s`}
            </span>
            <div className="seg" role="tablist" aria-label="Time range">
              {(["7D", "30D", "90D"] as Range[]).map((r) => (
                <button key={r} role="tab" aria-selected={range === r} className={`seg-btn${range === r ? " is-on" : ""}`} onClick={() => setRange(r)}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="dash-scroll">
          {/* integrations */}
          <section id="integrations">
            <div className="block-head">
              <span className="card-eyebrow">Connected sources</span>
              <span className="conn-summary">
                <ConnLight sm /> {CHANNELS.length} live
              </span>
            </div>
            <div className="int-grid">
              {CHANNELS.map((c) => (
                <div className="int-tile" key={c.name}>
                  <span className="int-glyph">{c.glyph}</span>
                  <span className="int-meta">
                    <span className="int-name">{c.name}</span>
                    <span className="int-handle">{c.handle}</span>
                  </span>
                  <span className="int-status">
                    <ConnLight sm /> Connected
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* kpi strip */}
          <section id="overview" className="kpi-strip">
            {KPIS.map((k) => {
              const down = k.delta.trim().startsWith("-");
              const lowerBetter = k.higherBetter === false;
              const good = down ? lowerBetter : !lowerBetter;
              return (
                <div className="kpi" key={k.label}>
                  <div className="kpi-top">
                    <span className="kpi-label">{k.label}</span>
                    <span className={`kpi-delta ${good ? "pos" : "neg"}`}>{k.delta}</span>
                  </div>
                  <span className="kpi-value">{k.value}</span>
                  <Spark data={k.spark} neg={!good} />
                </div>
              );
            })}
          </section>

          {/* chart + briefing */}
          <section className="dash-grid">
            <div className="card chart-card">
              <div className="card-head">
                <div>
                  <span className="card-eyebrow">Reach · {range}</span>
                  <span className="card-figure">
                    {reach.points[reach.points.length - 1]}K
                    <span className="card-figure-delta pos">▲ +280% all-time</span>
                  </span>
                </div>
                <span className="legend">
                  <span className="legend-swatch" /> reach
                </span>
              </div>
              <ReachChart data={reach.points} />
              <div className="chart-ticks">
                {reach.ticks.map((tk) => (
                  <span key={tk}>{tk}</span>
                ))}
              </div>
            </div>

            <div className="card briefing-card" id="briefing">
              <div className="card-head">
                <div className="briefing-id">
                  <span className="briefing-avatar">A</span>
                  <div>
                    <span className="card-eyebrow">Head of Data Agent</span>
                    <span className="briefing-name">Atlas</span>
                  </div>
                </div>
                <span className="briefing-live">
                  <ConnLight sm /> live
                </span>
              </div>
              <ul className="briefing-feed">
                {UPDATES.map((u, i) => (
                  <li className="briefing-row" key={i}>
                    <span className="briefing-ts">{u.ts}</span>
                    <span className={`chip chip-${u.tag.toLowerCase()}`}>{u.tag}</span>
                    <p>{u.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* channel table */}
          <section className="card table-card" id="channels">
            <div className="card-head">
              <span className="card-eyebrow">Channel performance · {range}</span>
              <span className="muted-note">{CHANNELS.length} channels</span>
            </div>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Status</th>
                  <th className="num">Posts</th>
                  <th className="num">Reach</th>
                  <th className="num">Engagement</th>
                  <th className="trend-col">Trend</th>
                </tr>
              </thead>
              <tbody>
                {CHANNELS.map((c) => (
                  <tr key={c.name}>
                    <td>
                      <span className="cell-channel">
                        <span className="cell-glyph">{c.glyph}</span>
                        <span>
                          <span className="cell-name">{c.name}</span>
                          <span className="cell-handle">{c.handle}</span>
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className="status-cell">
                        <ConnLight sm /> Connected
                      </span>
                    </td>
                    <td className="num">{c.posts}</td>
                    <td className="num">{c.reach}</td>
                    <td className="num">{c.eng}</td>
                    <td className="trend-col">
                      <Spark data={c.trend} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </div>
  );
}
