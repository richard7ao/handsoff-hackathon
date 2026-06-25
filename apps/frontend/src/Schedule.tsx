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
type ViewMode = "day" | "week" | "month";

type Post = {
  id: string;
  day: number; // 0 = Monday … 6 = Sunday (offset within the current week)
  time: string; // "09:00"
  platform: Platform;
  channel: string;
  title: string;
  status: Status;
  thumb: string;
};

type Event = Post & { date: Date };

const PLATFORM_LABEL: Record<Platform, string> = {
  reddit: "Reddit",
  instagram: "Instagram",
  x: "X",
  whatsapp: "WhatsApp",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_LABEL: Record<Status, string> = {
  posted: "Posted",
  scheduled: "Scheduled",
  draft: "Draft",
};

/* ----------------------------- date helpers ----------------------------- */

const pad = (n: number) => String(n).padStart(2, "0");
const fmtDMY = (d: Date) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
const dowIndex = (d: Date) => (d.getDay() + 6) % 7; // Monday = 0

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setDate(x.getDate() - dowIndex(x));
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function fmtDayHeader(d: Date) {
  return `${WEEKDAYS_LONG[dowIndex(d)]} ${fmtDMY(d)}`;
}
function shiftTime(t: string, mins: number) {
  const [h, m] = t.split(":").map(Number);
  const total = (h * 60 + m + mins + 1440) % 1440;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/* ----------------------------- mock data ----------------------------- */

const thumb = (seed: string) => `https://picsum.photos/seed/${seed}/320/200`;

const POSTS: Post[] = [
  { id: "p1", day: 0, time: "08:30", platform: "reddit", channel: "r/Austin", title: "12 years running a barbershop in Austin taught me one thing about regulars", status: "posted", thumb: thumb("signal-barber-1") },
  { id: "p2", day: 0, time: "17:00", platform: "instagram", channel: "Reel", title: "Behind the chair: the Monday rush, in 20 seconds", status: "posted", thumb: thumb("signal-reel-2") },
  { id: "p3", day: 1, time: "12:15", platform: "x", channel: "Post", title: "Unpopular opinion from a barbershop owner about walk-ins", status: "scheduled", thumb: thumb("signal-x-3") },
  { id: "p4", day: 2, time: "09:00", platform: "reddit", channel: "r/smallbusiness", title: "A few honest things Austin folks ask us about barbershops", status: "scheduled", thumb: thumb("signal-barber-4") },
  { id: "p5", day: 2, time: "18:30", platform: "whatsapp", channel: "Broadcast", title: "This week's quiet hours for our regulars", status: "scheduled", thumb: thumb("signal-wa-5") },
  { id: "p6", day: 3, time: "10:00", platform: "instagram", channel: "Caption", title: "No gimmicks — just the work, done right, here in Austin", status: "scheduled", thumb: thumb("signal-ig-6") },
  { id: "p7", day: 4, time: "16:45", platform: "x", channel: "Post", title: "Friday chair openings — first come, first served", status: "draft", thumb: thumb("signal-x-7") },
  { id: "p8", day: 5, time: "11:30", platform: "reddit", channel: "r/Austin", title: "Saturday walk-ins: what to expect and when to come in", status: "scheduled", thumb: thumb("signal-barber-8") },
  { id: "p9", day: 6, time: "19:00", platform: "instagram", channel: "Story", title: "Sunday wrap — the week at Bella's", status: "draft", thumb: thumb("signal-ig-9") },
];

function buildEvents(): Event[] {
  const ws = startOfWeek(new Date());
  return POSTS.map((p) => ({ ...p, date: addDays(ws, p.day) }));
}

/* ----------------------------- page ----------------------------- */

export function Schedule() {
  const [filter, setFilter] = useState<Status | "all">("all");
  const [editing, setEditing] = useState(true);
  const [view, setView] = useState<ViewMode>("month");
  const [allEvents, setAllEvents] = useState<Event[]>(buildEvents);
  // editor anchor — default to Monday of the current week ("Monday dd-mm-yyyy")
  const [anchor, setAnchor] = useState<Date>(() => startOfWeek(new Date()));

  const events = useMemo(
    () => (filter === "all" ? allEvents : allEvents.filter((e) => e.status === filter)),
    [allEvents, filter],
  );

  const counts = useMemo(
    () => ({
      scheduled: allEvents.filter((e) => e.status === "scheduled").length,
      draft: allEvents.filter((e) => e.status === "draft").length,
      posted: allEvents.filter((e) => e.status === "posted").length,
    }),
    [allEvents],
  );

  const FILTERS: { key: Status | "all"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "scheduled", label: `Scheduled · ${counts.scheduled}` },
    { key: "draft", label: `Drafts · ${counts.draft}` },
    { key: "posted", label: `Posted · ${counts.posted}` },
  ];

  /* ----- overview helpers ----- */
  const byDay = useMemo(() => {
    const map: Record<number, Event[]> = {};
    for (let d = 0; d < 7; d++) map[d] = [];
    for (const e of events) map[e.day].push(e);
    for (let d = 0; d < 7; d++) map[d].sort((a, b) => a.time.localeCompare(b.time));
    return map;
  }, [events]);

  const upcoming = useMemo(
    () =>
      [...events]
        .filter((e) => e.status !== "posted")
        .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time)),
    [events],
  );

  /* ----- editor helpers ----- */
  const eventsOn = (d: Date) =>
    events.filter((e) => sameDay(e.date, d)).sort((a, b) => a.time.localeCompare(b.time));

  function step(dir: 1 | -1) {
    setAnchor((a) => (view === "day" ? addDays(a, dir) : view === "week" ? addDays(a, dir * 7) : addMonths(a, dir)));
  }
  function goToday() {
    setAnchor(view === "day" ? new Date(new Date().setHours(0, 0, 0, 0)) : startOfWeek(new Date()));
  }
  function nudge(id: string, mins: number) {
    setAllEvents((list) => list.map((e) => (e.id === id ? { ...e, time: shiftTime(e.time, mins) } : e)));
  }
  function moveDay(id: string, dir: 1 | -1) {
    setAllEvents((list) =>
      list.map((e) => (e.id === id ? { ...e, date: addDays(e.date, dir), day: (e.day + dir + 7) % 7 } : e)),
    );
  }

  const weekStart = startOfWeek(anchor);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthCells = useMemo(() => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const gridStart = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [anchor]);

  const headerLabel =
    view === "day"
      ? fmtDayHeader(anchor)
      : view === "week"
        ? `${fmtDMY(weekStart)} – ${fmtDMY(addDays(weekStart, 6))}`
        : `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;

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
            <div className="sched-control-actions">
              {editing ? (
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>
                  Done editing
                </button>
              ) : (
                <button className="btn btn-dark btn-sm" onClick={() => setEditing(true)}>
                  Edit schedule <span className="arrow">→</span>
                </button>
              )}
              <a className="btn btn-accent btn-sm" href="/content">
                New post in studio <span className="arrow">→</span>
              </a>
            </div>
          </div>

          {editing ? (
            /* ===================== EDITOR ===================== */
            <section className="sched-editor" aria-label="Edit schedule">
              <div className="sched-nav">
                <div className="sched-nav-left">
                  <button className="sched-navbtn" onClick={() => step(-1)} aria-label={`Previous ${view}`}>
                    ‹
                  </button>
                  <button className="sched-navbtn" onClick={() => step(1)} aria-label={`Next ${view}`}>
                    ›
                  </button>
                  <button className="sched-today" onClick={goToday}>
                    Today
                  </button>
                  <h2 className="sched-nav-label">{headerLabel}</h2>
                </div>
                <label className="sched-viewwrap">
                  <span className="sched-viewlabel">View</span>
                  <select
                    className="sched-viewsel"
                    value={view}
                    onChange={(e) => setView(e.target.value as ViewMode)}
                    aria-label="Calendar view"
                  >
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                  </select>
                </label>
              </div>

              {/* ----- DAY VIEW ----- */}
              {view === "day" && (
                <div className="sched-day">
                  {eventsOn(anchor).length === 0 ? (
                    <p className="sched-queue-empty">Nothing scheduled on {fmtDayHeader(anchor)}.</p>
                  ) : (
                    eventsOn(anchor).map((e) => (
                      <article className={`sched-event plat-${e.platform}`} key={e.id}>
                        <div className="sched-thumb">
                          <img src={e.thumb} alt="" loading="lazy" />
                          <span className="sched-thumb-play" aria-hidden="true">▶</span>
                        </div>
                        <div className="sched-event-body">
                          <span className="sched-event-when">
                            <span className="sched-plat-dot" aria-hidden="true" />
                            {WEEKDAYS_LONG[dowIndex(e.date)]} · {e.time}
                          </span>
                          <span className="sched-event-title">{e.title}</span>
                          <span className="sched-event-meta">
                            {PLATFORM_LABEL[e.platform]} · {e.channel}
                            <span className={`sched-status st-${e.status}`}>{STATUS_LABEL[e.status]}</span>
                          </span>
                        </div>
                        <div className="sched-event-actions">
                          <button onClick={() => nudge(e.id, -15)} title="15 minutes earlier">−15m</button>
                          <button onClick={() => nudge(e.id, 15)} title="15 minutes later">+15m</button>
                          <button onClick={() => moveDay(e.id, -1)} title="Move to previous day">‹ day</button>
                          <button onClick={() => moveDay(e.id, 1)} title="Move to next day">day ›</button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              )}

              {/* ----- WEEK VIEW ----- */}
              {view === "week" && (
                <div className="sched-week">
                  {weekDays.map((d) => (
                    <div className="sched-col" key={d.toISOString()}>
                      <div className="sched-col-head">
                        <span className="sched-dow">{DAYS[dowIndex(d)]}</span>
                        <span className="sched-date">{d.getDate()}</span>
                      </div>
                      <div className="sched-col-body">
                        {eventsOn(d).length === 0 ? (
                          <span className="sched-empty">—</span>
                        ) : (
                          eventsOn(d).map((e) => (
                            <article className={`sched-pill plat-${e.platform} st-${e.status}`} key={e.id}>
                              <div className="sched-pill-thumb">
                                <img src={e.thumb} alt="" loading="lazy" />
                              </div>
                              <span className="sched-pill-top">
                                <span className="sched-plat-dot" aria-hidden="true" />
                                <span className="sched-time">{e.time}</span>
                                <span className="sched-plat">{PLATFORM_LABEL[e.platform]}</span>
                              </span>
                              <span className="sched-pill-title">{e.title}</span>
                            </article>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ----- MONTH VIEW ----- */}
              {view === "month" && (
                <div className="sched-month">
                  {DAYS.map((d) => (
                    <div className="sched-mhead" key={d}>
                      {d}
                    </div>
                  ))}
                  {monthCells.map((d) => {
                    const dayEvents = eventsOn(d);
                    const inMonth = d.getMonth() === anchor.getMonth();
                    return (
                      <div className={`sched-mcell${inMonth ? "" : " is-out"}`} key={d.toISOString()}>
                        <span className="sched-mdate">{d.getDate()}</span>
                        <div className="sched-mevents">
                          {dayEvents.slice(0, 3).map((e) => (
                            <span className={`sched-mevent plat-${e.platform}`} key={e.id} title={`${DAYS[dowIndex(e.date)]} ${e.time} · ${e.title}`}>
                              <img className="sched-mthumb" src={e.thumb} alt="" loading="lazy" />
                              <span className="sched-mtime">{e.time}</span>
                              <span className="sched-mtitle">{e.title}</span>
                            </span>
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="sched-mmore">+{dayEvents.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ) : (
            /* ===================== OVERVIEW ===================== */
            <>
              {/* week calendar */}
              <section className="sched-week" aria-label="This week's schedule">
                {weekDays.map((d, i) => (
                  <div className="sched-col" key={d.toISOString()}>
                    <div className="sched-col-head">
                      <span className="sched-dow">{DAYS[i]}</span>
                      <span className="sched-date">{d.getDate()}</span>
                    </div>
                    <div className="sched-col-body">
                      {byDay[i].length === 0 ? (
                        <span className="sched-empty">—</span>
                      ) : (
                        byDay[i].map((e) => (
                          <article className={`sched-pill plat-${e.platform} st-${e.status}`} key={e.id}>
                            <span className="sched-pill-top">
                              <span className="sched-plat-dot" aria-hidden="true" />
                              <span className="sched-time">{e.time}</span>
                              <span className="sched-plat">{PLATFORM_LABEL[e.platform]}</span>
                            </span>
                            <span className="sched-pill-title">{e.title}</span>
                          </article>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </section>

              {/* upcoming queue */}
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
                    {upcoming.map((e) => (
                      <li className="sched-row" key={e.id}>
                        <span className="sched-row-when">
                          <span className="sched-row-day">{DAYS[e.day]}</span>
                          <span className="sched-row-time">{e.time}</span>
                        </span>
                        <span className={`sched-plat-dot plat-${e.platform}`} aria-hidden="true" />
                        <div className="sched-row-main">
                          <span className="sched-row-title">{e.title}</span>
                          <span className="sched-row-meta">
                            {PLATFORM_LABEL[e.platform]} · {e.channel}
                          </span>
                        </div>
                        <span className={`sched-status st-${e.status}`}>{STATUS_LABEL[e.status]}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
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
