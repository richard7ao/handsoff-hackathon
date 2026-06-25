import { useEffect, useRef, useState } from "react";

const HOME_URL = "/";
const DEMO_URL = "/demo";

/** Same-origin API base — matches App.tsx. The backend isn't wired yet; see generate(). */
const API_BASE = import.meta.env.VITE_API_URL ?? "";

function Logo() {
  return (
    <svg className="logo" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="21" fill="none" stroke="var(--accent)" strokeWidth="3" opacity="0.35" />
      <circle cx="32" cy="32" r="12" fill="none" stroke="var(--accent)" strokeWidth="3" opacity="0.6" />
      <circle cx="32" cy="32" r="5" fill="var(--accent)" />
    </svg>
  );
}

/* ----------------------------- types ----------------------------- */

type Platform = "reddit" | "instagram" | "x" | "whatsapp";
type Tone = "Honest & plain" | "Warm & local" | "Expert & direct";
type Goal = "Build trust" | "Drive visits" | "Answer a question";

type Brief = {
  name: string;
  type: string;
  city: string;
  topic: string;
  platform: Platform;
  tone: Tone;
  goal: Goal;
};

type Draft = {
  id: string;
  platform: Platform;
  channel: string;
  title?: string;
  body: string;
  tags?: string[];
  score: number; // 0–100, voice + brief match
  best: boolean;
};

const PLATFORMS: { id: Platform; label: string; channel: string }[] = [
  { id: "reddit", label: "Reddit", channel: "r/" },
  { id: "instagram", label: "Instagram", channel: "Caption" },
  { id: "x", label: "X", channel: "Post" },
  { id: "whatsapp", label: "WhatsApp", channel: "Broadcast" },
];

const TONES: Tone[] = ["Honest & plain", "Warm & local", "Expert & direct"];
const GOALS: Goal[] = ["Build trust", "Drive visits", "Answer a question"];

const DEFAULT_BRIEF: Brief = {
  name: "Bella's Barbershop",
  type: "Barbershop",
  city: "Austin, TX",
  topic: "Why walk-ins almost always beat chain salons for a quick trim",
  platform: "reddit",
  tone: "Honest & plain",
  goal: "Build trust",
};

/* ----------------------- mock generation ------------------------- */
/* This is the only place the backend plugs in. Replace the body of  */
/* generate() with a POST to Scout; the UI already consumes Draft[]. */

function citySub(city: string) {
  const c = city.split(",")[0].trim().replace(/\s+/g, "");
  return c ? `r/${c}` : "r/smallbusiness";
}

function mockDrafts(b: Brief): Draft[] {
  const cityName = b.city.split(",")[0].trim();
  const niche = b.type.toLowerCase();
  const handle = b.name.replace(/[^a-zA-Z]/g, "").slice(0, 12).toLowerCase();
  const topic = b.topic.trim() || `running a ${niche} in ${cityName}`;

  if (b.platform === "reddit") {
    const sub = citySub(b.city);
    return [
      {
        id: "r1",
        platform: "reddit",
        channel: sub,
        title: `${b.type} owner here — ${topic.charAt(0).toLowerCase()}${topic.slice(1)}`,
        body: `Ran ${b.name} for years and figured this thread was the right place to be honest about it. No pitch — happy to answer anything about ${niche}s in ${cityName} if it's useful to anyone here.`,
        score: 91,
        best: true,
      },
      {
        id: "r2",
        platform: "reddit",
        channel: sub,
        title: `A few honest things ${cityName} folks ask us about ${niche}s`,
        body: `Posting this because the same questions come up every week at the counter. Sharing what we actually tell people — not a promo, just the real answers.`,
        score: 84,
        best: false,
      },
    ];
  }

  if (b.platform === "instagram") {
    return [
      {
        id: "i1",
        platform: "instagram",
        channel: "Caption",
        body: `${topic}.\n\nNo gimmicks — just the work, done right, here in ${cityName}. Swing by ${b.name} when you're ready.`,
        tags: [`#${cityName.replace(/\s+/g, "")}`, `#${niche.replace(/\s+/g, "")}`, "#shoplocal", "#smallbusiness"],
        score: 89,
        best: true,
      },
      {
        id: "i2",
        platform: "instagram",
        channel: "Caption",
        body: `Behind the chair at ${b.name}. Twelve years in ${cityName} taught us one thing: the conversation matters as much as the cut.`,
        tags: [`#${cityName.replace(/\s+/g, "")}`, "#local", `#${niche.replace(/\s+/g, "")}`],
        score: 82,
        best: false,
      },
    ];
  }

  if (b.platform === "x") {
    return [
      {
        id: "x1",
        platform: "x",
        channel: "Post",
        body: `${topic} — from someone who's run a ${niche} in ${cityName} for years. AMA in the replies.`,
        tags: [`#${cityName.replace(/\s+/g, "")}`],
        score: 87,
        best: true,
      },
      {
        id: "x2",
        platform: "x",
        channel: "Post",
        body: `Unpopular opinion from a ${niche} owner: ${topic.charAt(0).toLowerCase()}${topic.slice(1)}.`,
        score: 80,
        best: false,
      },
    ];
  }

  // whatsapp
  return [
    {
      id: "w1",
      platform: "whatsapp",
      channel: "Broadcast",
      body: `Hi from ${b.name} 👋 Quick note for our ${cityName} regulars: ${topic.charAt(0).toLowerCase()}${topic.slice(1)}. Reply here anytime — we read every message.`,
      score: 88,
      best: true,
    },
    {
      id: "w2",
      platform: "whatsapp",
      channel: "Broadcast",
      body: `It's @${handle}. Wanted to share something useful rather than another offer: ${topic}. Stop by when it suits you.`,
      score: 81,
      best: false,
    },
  ];
}

/** The single backend seam. Today it simulates Scout; swap in a fetch and the UI is unchanged. */
async function generate(brief: Brief): Promise<Draft[]> {
  // TODO(backend): wire to Scout.
  // const res = await fetch(`${API_BASE}/api/generate`, {
  //   method: "POST",
  //   headers: { "content-type": "application/json" },
  //   body: JSON.stringify(brief),
  // });
  // if (!res.ok) throw new Error("generation failed");
  // return (await res.json()).drafts as Draft[];
  void API_BASE;
  return mockDrafts(brief);
}

/* ----------------------------- page ------------------------------ */

type Phase = "idle" | "writing" | "done";
type Log = { ts: string; text: string; cls?: "ok" | "key" | "dim" };

export function Content() {
  const [brief, setBrief] = useState<Brief>(DEFAULT_BRIEF);
  const [phase, setPhase] = useState<Phase>("idle");
  const [logs, setLogs] = useState<Log[]>([]);
  const [research, setResearch] = useState(0);
  const [voice, setVoice] = useState(0);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [queued, setQueued] = useState<Set<string>>(new Set());

  const timers = useRef<number[]>([]);
  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  function set<K extends keyof Brief>(key: K, value: Brief[K]) {
    setBrief((b) => ({ ...b, [key]: value }));
  }

  async function run() {
    clearTimers();
    setPhase("writing");
    setLogs([]);
    setResearch(0);
    setVoice(0);
    setDrafts([]);
    setCopied(null);
    setQueued(new Set());

    const sub = citySub(brief.city);
    const niche = brief.type.toLowerCase();
    const steps: { d: number; run: () => void }[] = [];
    const push = (d: number, fn: () => void) => steps.push({ d, run: fn });
    const log = (l: Log) => setLogs((p) => [...p, l]);

    push(120, () => log({ ts: "+00:00", text: `loading brief for ${brief.name}`, cls: "dim" }));
    push(420, () =>
      log({ ts: "+00:06", text: `scanning ${sub}, r/smallbusiness, r/${niche.replace(/\s+/g, "")}…`, cls: "dim" }),
    );
    for (let i = 1; i <= 20; i++) push(70, () => setResearch(i * 5));
    push(220, () => log({ ts: "+04:12", text: "audience found · matching voice to brief", cls: "dim" }));
    for (let i = 1; i <= 20; i++) push(45, () => setVoice(i * 5));
    push(220, () => log({ ts: "+06:48", text: `drafting for ${brief.platform} in ${brief.tone.toLowerCase()} tone…`, cls: "dim" }));

    // The actual generation (backend seam).
    let produced: Draft[] = [];
    push(260, () => {
      generate(brief).then((d) => {
        produced = d;
      });
    });
    push(360, () => log({ ts: "+08:30", text: `${produced.length || 2} drafts scored · revealing best first`, cls: "ok" }));
    push(120, () => setDrafts(produced.length ? produced : mockDrafts(brief)));
    push(260, () => log({ ts: "+08:31", text: "✓ ready to review · queue any draft to Pulse", cls: "key" }));
    push(60, () => setPhase("done"));

    let acc = 0;
    for (const s of steps) {
      acc += s.d;
      timers.current.push(window.setTimeout(s.run, acc));
    }
  }

  function reset() {
    clearTimers();
    setPhase("idle");
    setLogs([]);
    setResearch(0);
    setVoice(0);
    setDrafts([]);
    setCopied(null);
    setQueued(new Set());
  }

  async function copy(d: Draft) {
    const text = [d.title, d.body, d.tags?.join(" ")].filter(Boolean).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(d.id);
      window.setTimeout(() => setCopied((c) => (c === d.id ? null : c)), 1600);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  function queue(d: Draft) {
    setQueued((q) => {
      const next = new Set(q);
      next.add(d.id);
      return next;
    });
  }

  const writing = phase === "writing";

  return (
    <>
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
              <a href="/dashboard">Dashboard</a>
            </div>
            <a className="btn btn-ghost" href={DEMO_URL}>
              ← Back to demo
            </a>
          </nav>
        </div>
      </header>

      <main className="studio">
        <div className="wrap">
          <div className="demo-head">
            <span className="label label-accent">
              <span className="live" aria-hidden="true">
                <span className="ring" />
                <span className="core" />
              </span>
              Content studio · Scout
            </span>
            <h1>Generate content in your voice.</h1>
            <p>
              Hand Scout a brief and it drafts on-platform content, scores each one against your
              business voice, and lets you queue the winner to <strong>Pulse</strong> — the same
              loop the demo runs, now with you in the chair.
            </p>
          </div>

          {/* ---------- brief / chatbox ---------- */}
          <section className="studio-brief">
            <div className="studio-brief-grid">
              <label>
                <span>Business</span>
                <input value={brief.name} disabled={writing} onChange={(e) => set("name", e.target.value)} />
              </label>
              <label>
                <span>Type</span>
                <input value={brief.type} disabled={writing} onChange={(e) => set("type", e.target.value)} />
              </label>
              <label>
                <span>City</span>
                <input value={brief.city} disabled={writing} onChange={(e) => set("city", e.target.value)} />
              </label>
            </div>

            <label className="studio-topic">
              <span>What should this post be about?</span>
              <textarea
                rows={2}
                value={brief.topic}
                disabled={writing}
                placeholder="e.g. why regulars matter more than discounts"
                onChange={(e) => set("topic", e.target.value)}
              />
            </label>

            <div className="studio-controls">
              <div className="studio-field">
                <span className="studio-field-label">Platform</span>
                <div className="studio-chips" role="radiogroup" aria-label="Platform">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={brief.platform === p.id}
                      disabled={writing}
                      className={`studio-chip ${brief.platform === p.id ? "is-on" : ""}`}
                      onClick={() => set("platform", p.id)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="studio-field">
                <span className="studio-field-label">Tone</span>
                <select
                  value={brief.tone}
                  disabled={writing}
                  onChange={(e) => set("tone", e.target.value as Tone)}
                >
                  {TONES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="studio-field">
                <span className="studio-field-label">Goal</span>
                <select
                  value={brief.goal}
                  disabled={writing}
                  onChange={(e) => set("goal", e.target.value as Goal)}
                >
                  {GOALS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="studio-run">
                {phase !== "writing" ? (
                  <button className="btn btn-accent" onClick={run}>
                    {phase === "done" ? "Regenerate" : "Generate"} <span className="arrow">▸</span>
                  </button>
                ) : (
                  <button className="btn btn-ghost" disabled>
                    Scout is writing…
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ---------- writing state ---------- */}
          {(writing || logs.length > 0) && (
            <section className="studio-progress">
              <div className="studio-meters">
                <Meter label="research" value={research} suffix="%" />
                <Meter label="voice match" value={voice} suffix="%" accent />
              </div>
              <div className="demo-term">
                {logs.length === 0 ? (
                  <div className="demo-term-empty">waiting…</div>
                ) : (
                  logs.map((l, i) => (
                    <div className="line" key={i}>
                      <span className="ts">{l.ts}</span>
                      <span className={l.cls}>{l.text}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* ---------- drafts ---------- */}
          {drafts.length > 0 && (
            <section className="studio-drafts">
              <div className="studio-drafts-head">
                <h2>{drafts.length} drafts, best first.</h2>
                <span className="studio-drafts-sub">
                  Scored against {brief.name}'s brief · {brief.tone.toLowerCase()}
                </span>
              </div>

              <div className="studio-draft-list">
                {drafts.map((d, i) => (
                  <article
                    key={d.id}
                    className={`studio-draft ${d.best ? "is-best" : ""}`}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="studio-draft-top">
                      <span className="studio-draft-channel">
                        {channelLabel(d)}
                      </span>
                      {d.best && <span className="studio-best">Top pick</span>}
                      <span className="studio-score" title="Voice + brief match">
                        <span className="studio-score-bar">
                          <span style={{ width: `${d.score}%` }} />
                        </span>
                        {d.score}
                      </span>
                    </div>

                    {d.title && <h3 className="studio-draft-title">{d.title}</h3>}
                    <p className="studio-draft-body">{d.body}</p>
                    {d.tags && d.tags.length > 0 && (
                      <div className="studio-tags">
                        {d.tags.map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </div>
                    )}

                    <div className="studio-draft-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => copy(d)}>
                        {copied === d.id ? "Copied ✓" : "Copy"}
                      </button>
                      {queued.has(d.id) ? (
                        <span className="studio-queued">Queued to Pulse ↻</span>
                      ) : (
                        <button className="btn btn-accent btn-sm" onClick={() => queue(d)}>
                          Queue to Pulse <span className="arrow">→</span>
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <div className="studio-drafts-foot">
                <button className="btn btn-dark" onClick={run}>
                  Generate more <span className="arrow">▸</span>
                </button>
                <button className="btn btn-ghost" onClick={reset}>
                  Clear
                </button>
              </div>
            </section>
          )}

          <p className="demo-footnote">
            Drafts are generated client-side for this preview. The{" "}
            <code>generate()</code> function in <code>Content.tsx</code> is the single seam — point
            it at Scout's <code>/api/generate</code> endpoint and the rest of the studio works
            unchanged.
          </p>
        </div>
      </main>
    </>
  );
}

function channelLabel(d: Draft) {
  const p = PLATFORMS.find((x) => x.id === d.platform);
  const name = p ? p.label : d.platform;
  return d.platform === "reddit" ? `${name} · ${d.channel}` : `${name} · ${d.channel}`;
}

function Meter({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="meter">
      <div className="meter-top">
        <span>{label}</span>
        <span className="meter-val">
          {value}
          {suffix}
        </span>
      </div>
      <div className="meter-track">
        <div className={`meter-fill ${accent ? "accent" : ""}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}
