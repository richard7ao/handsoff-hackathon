import { useMemo, useState } from "react";
import { AppShell } from "./Sidebar";

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
type Status = "posted" | "scheduled" | "draft";

type Post = {
  id: string;
  day: number; // 0 = Monday … 6 = Sunday
  time: string; // "09:00"
  platform: Platform;
  channel: string;
  title: string;
  status: Status;
};

const PLATFORM_LABEL: Record<Platform, string> = {
  reddit: "Reddit",
  instagram: "Instagram",
  x: "X",
  whatsapp: "WhatsApp",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DATES = [3, 4, 5, 6, 7, 8, 9]; // illustrative week of the month

/* ----------------------------- mock data ----------------------------- */

const POSTS: Post[] = [
  { id: "p1", day: 0, time: "08:30", platform: "reddit", channel: "r/Austin", title: "12 years running a barbershop in Austin taught me one thing about regulars", status: "posted" },
  { id: "p2", day: 0, time: "17:00", platform: "instagram", channel: "Reel", title: "Behind the chair: the Monday rush, in 20 seconds", status: "posted" },
  { id: "p3", day: 1, time: "12:15", platform: "x", channel: "Post", title: "Unpopular opinion from a barbershop owner about walk-ins", status: "scheduled" },
  { id: "p4", day: 2, time: "09:00", platform: "reddit", channel: "r/smallbusiness", title: "A few honest things Austin folks ask us about barbershops", status: "scheduled" },
  { id: "p5", day: 2, time: "18:30", platform: "whatsapp", channel: "Broadcast", title: "This week's quiet hours for our regulars", status: "scheduled" },
  { id: "p6", day: 3, time: "10:00", platform: "instagram", channel: "Caption", title: "No gimmicks — just the work, done right, here in Austin", status: "scheduled" },
  { id: "p7", day: 4, time: "16:45", platform: "x", channel: "Post", title: "Friday chair openings — first come, first served", status: "draft" },
  { id: "p8", day: 5, time: "11:30", platform: "reddit", channel: "r/Austin", title: "Saturday walk-ins: what to expect and when to come in", status: "scheduled" },
  { id: "p9", day: 6, time: "19:00", platform: "instagram", channel: "Story", title: "Sunday wrap — the week at Bella's", status: "draft" },
];

const STATUS_LABEL: Record<Status, string> = {
  posted: "Posted",
  scheduled: "Scheduled",
  draft: "Draft",
};

/* ----------------------------- page ----------------------------- */

export function Schedule() {
  const [filter, setFilter] = useState<Status | "all">("all");

  const visible = useMemo(
    () => (filter === "all" ? POSTS : POSTS.filter((p) => p.status === filter)),
    [filter],
  );

  const byDay = useMemo(() => {
    const map: Record<number, Post[]> = {};
    for (let d = 0; d < 7; d++) map[d] = [];
    for (const p of visible) map[p.day].push(p);
    for (let d = 0; d < 7; d++) map[d].sort((a, b) => a.time.localeCompare(b.time));
    return map;
  }, [visible]);

  const upcoming = useMemo(
    () =>
      [...visible]
        .filter((p) => p.status !== "posted")
        .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time)),
    [visible],
  );

  const counts = useMemo(
    () => ({
      scheduled: POSTS.filter((p) => p.status === "scheduled").length,
      draft: POSTS.filter((p) => p.status === "draft").length,
      posted: POSTS.filter((p) => p.status === "posted").length,
    }),
    [],
  );

  const FILTERS: { key: Status | "all"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "scheduled", label: `Scheduled · ${counts.scheduled}` },
    { key: "draft", label: `Drafts · ${counts.draft}` },
    { key: "posted", label: `Posted · ${counts.posted}` },
  ];

  return (
    <AppShell current="schedule">
      <main className="sched">
        <div className="wrap">
          {/* ---------- header ---------- */}
          <div className="demo-head">
            <span className="label label-accent">
              <span className="live" aria-hidden="true">
                <span className="ring" />
                <span className="core" />
              </span>
              Content schedule · Pulse
            </span>
            <h1>Your posting schedule.</h1>
            <p>
              Everything Pulse has queued for this week — across Reddit, Instagram, X, and
              WhatsApp. It posts on its own; this is just where you can see and steer it.
            </p>
          </div>

          {/* ---------- controls ---------- */}
          <div className="sched-controls">
            <div className="sched-filters" role="group" aria-label="Filter posts by status">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  className={`sched-chip ${filter === f.key ? "is-active" : ""}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <a className="btn btn-accent btn-sm" href="/content">
              New post in studio <span className="arrow">→</span>
            </a>
          </div>

          {/* ---------- week calendar ---------- */}
          <section className="sched-week" aria-label="This week's schedule">
            {DAYS.map((d, i) => (
              <div className="sched-col" key={d}>
                <div className="sched-col-head">
                  <span className="sched-dow">{d}</span>
                  <span className="sched-date">{DATES[i]}</span>
                </div>
                <div className="sched-col-body">
                  {byDay[i].length === 0 ? (
                    <span className="sched-empty">—</span>
                  ) : (
                    byDay[i].map((p) => (
                      <article className={`sched-pill plat-${p.platform} st-${p.status}`} key={p.id}>
                        <span className="sched-pill-top">
                          <span className="sched-plat-dot" aria-hidden="true" />
                          <span className="sched-time">{p.time}</span>
                          <span className="sched-plat">{PLATFORM_LABEL[p.platform]}</span>
                        </span>
                        <span className="sched-pill-title">{p.title}</span>
                      </article>
                    ))
                  )}
                </div>
              </div>
            ))}
          </section>

          {/* ---------- upcoming queue ---------- */}
          <section className="sched-queue">
            <div className="sched-queue-head">
              <h2>Up next</h2>
              <span className="sched-queue-sub">
                {upcoming.length} post{upcoming.length === 1 ? "" : "s"} waiting to go out
              </span>
            </div>

            {upcoming.length === 0 ? (
              <p className="sched-queue-empty">Nothing queued for this filter.</p>
            ) : (
              <ul className="sched-list">
                {upcoming.map((p) => (
                  <li className="sched-row" key={p.id}>
                    <span className="sched-row-when">
                      <span className="sched-row-day">{DAYS[p.day]}</span>
                      <span className="sched-row-time">{p.time}</span>
                    </span>
                    <span className={`sched-plat-dot plat-${p.platform}`} aria-hidden="true" />
                    <div className="sched-row-main">
                      <span className="sched-row-title">{p.title}</span>
                      <span className="sched-row-meta">
                        {PLATFORM_LABEL[p.platform]} · {p.channel}
                      </span>
                    </div>
                    <span className={`sched-status st-${p.status}`}>{STATUS_LABEL[p.status]}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ---------- footer ---------- */}
        <footer className="footer">
          <div className="wrap footer-inner">
            <div className="footer-left">
              <Logo />
              <span>© {new Date().getFullYear()} Signal</span>
            </div>
            <div className="footer-right">
              <a href="/dashboard">Dashboard</a>
              <a href="/content">Studio</a>
            </div>
          </div>
        </footer>
      </main>
    </AppShell>
  );
}
