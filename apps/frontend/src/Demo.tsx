import { useEffect, useRef, useState } from "react";

const HOME_URL = "/";
const CONTENT_URL = "/content";

function Logo() {
  return (
    <svg className="logo" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="21" fill="none" stroke="var(--accent)" strokeWidth="3" opacity="0.35" />
      <circle cx="32" cy="32" r="12" fill="none" stroke="var(--accent)" strokeWidth="3" opacity="0.6" />
      <circle cx="32" cy="32" r="5" fill="var(--accent)" />
    </svg>
  );
}

type Log = { ts: string; text: string; cls?: "ok" | "key" | "dim" | "warn" };
type Phase = "idle" | "running" | "done";

type Form = { name: string; type: string; city: string };
const DEFAULT_FORM: Form = { name: "Bella's Barbershop", type: "Barbershop", city: "Austin, TX" };

function citySub(city: string) {
  const c = city.split(",")[0].trim().replace(/\s+/g, "");
  return c ? `r/${c}` : "r/smallbusiness";
}

export function Demo() {
  const [form, setForm] = useState<Form>(DEFAULT_FORM);
  const [phase, setPhase] = useState<Phase>("idle");
  const [active, setActive] = useState(-1);
  const [jack, setJack] = useState<Log[]>([]);
  const [scout, setScout] = useState<Log[]>([]);
  const [pulse, setPulse] = useState<Log[]>([]);
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [post, setPost] = useState<{
    sub: string;
    title: string;
    body: string;
    upvotes: number;
    comments: number;
    rewritten: boolean;
  } | null>(null);

  const timers = useRef<number[]>([]);
  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  function reset() {
    clearTimers();
    setPhase("idle");
    setActive(-1);
    setJack([]);
    setScout([]);
    setPulse([]);
    setProgress(0);
    setScore(0);
    setPost(null);
  }

  function run() {
    clearTimers();
    setActive(-1);
    setJack([]);
    setScout([]);
    setPulse([]);
    setProgress(0);
    setScore(0);
    setPost(null);
    setPhase("running");

    const sub = citySub(form.city);
    const niche = form.type.toLowerCase();
    const cityName = form.city.split(",")[0];
    const steps: { d: number; run: () => void }[] = [];
    const push = (d: number, fn: () => void) => steps.push({ d, run: fn });
    const addJack = (l: Log) => setJack((p) => [...p, l]);
    const addScout = (l: Log) => setScout((p) => [...p, l]);
    const addPulse = (l: Log) => setPulse((p) => [...p, l]);

    // ---- Jack: intake ----
    push(200, () => setActive(0));
    push(500, () => addJack({ ts: "10:00:02", text: `Q1/5  What does ${form.name} do?`, cls: "dim" }));
    push(650, () => addJack({ ts: "10:00:14", text: `→ "${form.type} in ${form.city}"`, cls: "dim" }));
    push(650, () => addJack({ ts: "10:01:09", text: "Q3/5  What makes you different?", cls: "dim" }));
    push(650, () => addJack({ ts: "10:02:41", text: "Q5/5  Who is your ideal customer?", cls: "dim" }));
    push(700, () => addJack({ ts: "10:04:50", text: "✓ brief.json written to Supabase", cls: "ok" }));
    push(500, () => addJack({ ts: "10:04:50", text: "→ handing off to Scout", cls: "key" }));

    // ---- Scout: research + content ----
    push(500, () => setActive(1));
    push(400, () => addScout({ ts: "+00:03", text: `loading brief for ${form.name}`, cls: "dim" }));
    push(500, () =>
      addScout({
        ts: "+00:21",
        text: `scanning ${sub}, r/smallbusiness, r/${niche.replace(/\s+/g, "")}…`,
        cls: "dim",
      }),
    );
    for (let i = 1; i <= 20; i++) push(140, () => setProgress(i * 5));
    push(200, () => addScout({ ts: "+11:48", text: "audience found · 3 candidate threads", cls: "dim" }));
    push(500, () => addScout({ ts: "+22:30", text: "drafting post in business voice…", cls: "dim" }));
    for (let i = 1; i <= 17; i++) push(40, () => setScore(Number((i * 0.05).toFixed(2))));
    push(300, () => addScout({ ts: "+28:07", text: "draft scored 0.86 — voice match high", cls: "ok" }));
    push(500, () => addScout({ ts: "+31:22", text: "✓ post drafted · queued for Pulse", cls: "key" }));

    // ---- Pulse: posting + self-improvement ----
    push(500, () => setActive(2));
    push(400, () =>
      setPost({
        sub,
        title: `After 12 years in ${cityName}, here's what I wish more ${niche}s knew`,
        body: `Ran ${form.name} for over a decade. A few honest lessons on consistency, regulars, and why the conversation matters more than the service itself…`,
        upvotes: 1,
        comments: 0,
        rewritten: false,
      }),
    );
    push(300, () => addPulse({ ts: "13:00", text: `✓ posted to ${sub}`, cls: "ok" }));
    push(700, () => {
      addPulse({ ts: "13:10", text: "+2 upvotes · below threshold", cls: "warn" });
      setPost((p) => (p ? { ...p, upvotes: 2 } : p));
    });
    push(700, () => addPulse({ ts: "13:10", text: "reasoning: title too generic → rewriting", cls: "key" }));
    push(800, () =>
      setPost((p) =>
        p
          ? {
              ...p,
              rewritten: true,
              title: `12 years running a ${niche} in ${cityName} taught me one thing about regulars`,
              upvotes: 3,
            }
          : p,
      ),
    );
    push(500, () => addPulse({ ts: "13:40", text: "✓ reposted · monitoring", cls: "ok" }));
    const climb: [string, number, number][] = [
      ["13:50", 9, 1],
      ["14:00", 14, 3],
      ["14:10", 19, 4],
    ];
    climb.forEach(([ts, up, com]) => {
      push(600, () => {
        setPost((p) => (p ? { ...p, upvotes: up, comments: com } : p));
        addPulse({ ts, text: `+${up} upvotes · ${com} comments`, cls: "dim" });
      });
    });
    push(500, () => addPulse({ ts: "14:10", text: "✓ above threshold · keeping it live", cls: "ok" }));
    push(300, () => {
      setActive(-1);
      setPhase("done");
    });

    let acc = 0;
    for (const s of steps) {
      acc += s.d;
      timers.current.push(window.setTimeout(s.run, acc));
    }
  }

  const running = phase === "running";

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
              <a href={HOME_URL}>← Back to home</a>
              <a href={CONTENT_URL}>Content studio</a>
            </div>
            <a className="btn btn-accent" href={CONTENT_URL}>
              Open content studio <span className="arrow">→</span>
            </a>
          </nav>
        </div>
      </header>

      <main className="demo">
        <div className="wrap">
          <div className="demo-head">
            <span className="label label-accent">
              <span className="live" aria-hidden="true">
                <span className="ring" />
                <span className="core" />
              </span>
              Live demo · simulated run
            </span>
            <h1>Watch Signal run.</h1>
            <p>
              Describe a business, then watch <strong>Jack</strong>, <strong>Scout</strong>, and{" "}
              <strong>Pulse</strong> take it from a 5-minute brief to a live, self-improving post —
              with no one at the keyboard.
            </p>
          </div>

          <div className="demo-form">
            <label>
              <span>Business name</span>
              <input
                value={form.name}
                disabled={running}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              <span>Type</span>
              <input
                value={form.type}
                disabled={running}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              />
            </label>
            <label>
              <span>City</span>
              <input
                value={form.city}
                disabled={running}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </label>
            <div className="demo-form-actions">
              {phase === "idle" && (
                <button className="btn btn-accent" onClick={run}>
                  Run Signal <span className="arrow">▸</span>
                </button>
              )}
              {running && (
                <button className="btn btn-ghost" disabled>
                  Running…
                </button>
              )}
              {phase === "done" && (
                <button className="btn btn-dark" onClick={reset}>
                  Run again
                </button>
              )}
            </div>
          </div>

          <div className="demo-rail">
            <AgentPanel
              index={0}
              active={active}
              phase={phase}
              label="Agent 01 · Intake"
              name="Jack"
              role="the intake conversation"
              logs={jack}
            />
            <AgentPanel
              index={1}
              active={active}
              phase={phase}
              label="Agent 02 · Research & content"
              name="Scout"
              role="the long-running researcher"
              logs={scout}
            >
              {(scout.length > 0 || running) && (
                <div className="demo-metrics">
                  <Meter label="research" value={progress} suffix="%" />
                  <Meter label="voice match" value={Math.round(score * 100)} suffix="%" accent />
                </div>
              )}
            </AgentPanel>
            <AgentPanel
              index={2}
              active={active}
              phase={phase}
              label="Agent 03 · Posting & self-improvement"
              name="Pulse"
              role="the engagement loop"
              logs={pulse}
            />
          </div>

          {post && (
            <div className={`demo-result ${post.rewritten ? "is-rewritten" : ""}`}>
              <div className="demo-result-head">
                <span className="label label-accent">Live on Reddit</span>
                {post.rewritten && <span className="rewrite-badge">rewritten by Pulse ↻</span>}
              </div>
              <div className="reddit-card">
                <div className="reddit-meta">
                  <span className="reddit-sub">{post.sub}</span>
                  <span className="reddit-dot">·</span>
                  <span>posted by u/{form.name.replace(/[^a-zA-Z]/g, "").slice(0, 10).toLowerCase()}</span>
                </div>
                <h3 className="reddit-title">{post.title}</h3>
                <p className="reddit-body">{post.body}</p>
                <div className="reddit-stats">
                  <span className="up">▲ {post.upvotes}</span>
                  <span>{post.comments} comments</span>
                  {phase === "done" && <span className="reddit-live">● self-improving</span>}
                </div>
              </div>
              {phase === "done" && (
                <div className="demo-handoff">
                  <p>Want to write the next one yourself? Take the brief into the studio.</p>
                  <a className="btn btn-accent" href={CONTENT_URL}>
                    Generate content in the studio <span className="arrow">→</span>
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="demo-footnote">
            This is a simulated walkthrough for demonstration. In production Jack runs on
            WhatsApp + Supabase, Scout on Hermes + Modal, and Pulse on a Hermes cron against the
            live Reddit API.
          </div>
        </div>
      </main>
    </>
  );
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
        <div
          className={`meter-fill ${accent ? "accent" : ""}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

function AgentPanel({
  index,
  active,
  phase,
  label,
  name,
  role,
  logs,
  children,
}: {
  index: number;
  active: number;
  phase: Phase;
  label: string;
  name: string;
  role: string;
  logs: Log[];
  children?: React.ReactNode;
}) {
  const isActive = active === index;
  const done = phase !== "idle" && active > index;
  const state = isActive ? "active" : done ? "done" : "idle";
  return (
    <article className={`demo-agent state-${state}`}>
      <div className="demo-agent-head">
        <div>
          <span className="agent-label">{label}</span>
          <h3>{name}</h3>
          <span className="role">{role}</span>
        </div>
        <span className="agent-state">
          {isActive ? (
            <span className="dot-pulse">
              <span className="ring" />
              <span className="core" />
            </span>
          ) : done ? (
            <span className="check">✓</span>
          ) : (
            <span className="idle-dot">●</span>
          )}
        </span>
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
      {children}
    </article>
  );
}
