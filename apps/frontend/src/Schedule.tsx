import { Fragment, useMemo, useState } from "react";
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

type Platform = "bluesky" | "instagram" | "x" | "whatsapp";
type Status = "posted" | "scheduled" | "draft";
type ViewMode = "day" | "week";

const PLATFORMS: Platform[] = ["bluesky", "instagram", "x", "whatsapp"];

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

// A planner item: when date/time are null it lives in the pending tray.
type Item = {
  id: string;
  date: Date | null;
  time: string | null;
  platform: Platform;
  channel: string;
  title: string;
  status: Status;
  thumb: string;
};

const PLATFORM_LABEL: Record<Platform, string> = {
  bluesky: "Bluesky",
  instagram: "Instagram",
  x: "X",
  whatsapp: "WhatsApp",
};

function PlatformIcon({ platform }: { platform: Platform }) {
  switch (platform) {
    case "bluesky":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M12 10.8C10.7 8.3 7.2 3.9 4.2 4c-1.6.1-1.7 2.2-1.6 3.5.2 2.6 1.5 6.6 6.1 7.3-2 .3-4 .8-3.4 3 .7 2.4 3.4 1 5-1.1 1-1.3 1.5-2.5 1.7-3 .2.5.7 1.7 1.7 3 1.6 2.1 4.3 3.5 5 1.1.6-2.2-1.4-2.7-3.4-3 4.6-.7 5.9-4.7 6.1-7.3.1-1.3 0-3.4-1.6-3.5-3-.1-6.5 4.3-7.8 6.8Z"
            fill="currentColor"
          />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="12" cy="12" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="17.4" cy="6.6" r="1.3" fill="currentColor" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M4 4l16 16M20 4 4 20" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M4 20l1.2-3.6A7.4 7.4 0 1 1 8.4 19L4 20Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M9 9.2c.2-.5.4-.5.7-.5h.5c.2 0 .4 0 .6.5l.6 1.4c.1.2 0 .4-.1.5l-.4.5c-.1.2-.2.3 0 .6.3.5.8 1 1.4 1.3.3.2.4.1.6 0l.5-.5c.2-.2.3-.2.5-.1l1.3.7c.3.1.4.3.4.5 0 .6-.5 1.3-1 1.4-.5.1-1 .2-2.4-.4-1.9-.8-3.1-2.6-3.2-2.8-.1-.2-.8-1-.8-2 0-.9.5-1.3.6-1.5Z"
            fill="currentColor"
          />
        </svg>
      );
  }
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function fmtDayHeader(d: Date) {
  return `${WEEKDAYS_LONG[dowIndex(d)]} ${fmtDMY(d)}`;
}

/* ----- day-grid time axis ----- */
// Columns along the x-axis, one per hour across the full posting window (15 hours).
const SLOT_START = 7; // 07:00
const SLOT_END = 21; // 21:00 inclusive
const SLOTS = Array.from({ length: SLOT_END - SLOT_START + 1 }, (_, i) => `${pad(SLOT_START + i)}:00`);
const slotIndexOf = (time: string) => {
  const hour = Number(time.split(":")[0]);
  return Math.min(Math.max(hour - SLOT_START, 0), SLOTS.length - 1);
};

/* ----------------------------- mock data ----------------------------- */

const thumb = (seed: string) => `https://picsum.photos/seed/${seed}/320/200`;

const POSTS: Post[] = [
  { id: "p1", day: 0, time: "08:30", platform: "bluesky", channel: "#Austin", title: "12 years running a barbershop in Austin taught me one thing about regulars", status: "posted", thumb: thumb("buzz-barber-1") },
  { id: "p2", day: 0, time: "17:00", platform: "instagram", channel: "Reel", title: "Behind the chair: the Monday rush, in 20 seconds", status: "posted", thumb: thumb("buzz-reel-2") },
  { id: "p3", day: 1, time: "12:15", platform: "x", channel: "Post", title: "Unpopular opinion from a barbershop owner about walk-ins", status: "scheduled", thumb: thumb("buzz-x-3") },
  { id: "p4", day: 2, time: "09:00", platform: "bluesky", channel: "#smallbusiness", title: "A few honest things Austin folks ask us about barbershops", status: "scheduled", thumb: thumb("buzz-barber-4") },
  { id: "p5", day: 2, time: "18:30", platform: "whatsapp", channel: "Broadcast", title: "This week's quiet hours for our regulars", status: "scheduled", thumb: thumb("buzz-wa-5") },
  { id: "p6", day: 3, time: "10:00", platform: "instagram", channel: "Caption", title: "No gimmicks — just the work, done right, here in Austin", status: "scheduled", thumb: thumb("buzz-ig-6") },
  { id: "p7", day: 4, time: "16:45", platform: "x", channel: "Post", title: "Friday chair openings — first come, first served", status: "draft", thumb: thumb("buzz-x-7") },
  { id: "p8", day: 5, time: "11:30", platform: "bluesky", channel: "#Austin", title: "Saturday walk-ins: what to expect and when to come in", status: "scheduled", thumb: thumb("buzz-barber-8") },
  { id: "p9", day: 6, time: "19:00", platform: "instagram", channel: "Story", title: "Sunday wrap — the week at Bella's", status: "draft", thumb: thumb("buzz-ig-9") },
];

// Videos waiting to be placed — they start life in the pending tray.
const PENDING: Item[] = [
  { id: "q1", date: null, time: null, platform: "instagram", channel: "Reel", title: "Fresh fade, slow motion — the Tuesday walk-in", status: "draft", thumb: thumb("buzz-pending-1") },
  { id: "q2", date: null, time: null, platform: "x", channel: "Post", title: "Three things every Austin barber wishes you knew", status: "draft", thumb: thumb("buzz-pending-2") },
  { id: "q3", date: null, time: null, platform: "bluesky", channel: "#Austin", title: "We tried staying open late on Thursdays. Here's what happened.", status: "draft", thumb: thumb("buzz-pending-3") },
];

function buildItems(): Item[] {
  const ws = startOfWeek(new Date());
  const placed: Item[] = POSTS.map((p) => ({
    id: p.id,
    date: addDays(ws, p.day),
    time: p.time,
    platform: p.platform,
    channel: p.channel,
    title: p.title,
    status: p.status,
    thumb: p.thumb,
  }));
  return [...placed, ...PENDING.map((q) => ({ ...q }))];
}

/* ----------------------------- video card ----------------------------- */

function VideoCard({
  item,
  showTime,
  compact,
  onDragStart,
  onDragEnd,
  dragging,
}: {
  item: Item;
  showTime?: boolean;
  compact?: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  dragging: boolean;
}) {
  return (
    <article
      className={`vcard plat-${item.platform} st-${item.status}${compact ? " vcard-compact" : ""}${dragging ? " is-dragging" : ""}`}
      draggable
      title={item.title}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", item.id);
        onDragStart(item.id);
      }}
      onDragEnd={onDragEnd}
    >
      <div className="vcard-thumb">
        <img src={item.thumb} alt="" loading="lazy" />
        <span className="vcard-play" aria-hidden="true">▶</span>
        {compact && showTime && item.time ? <span className="vcard-time">{item.time}</span> : null}
      </div>
      <div className="vcard-body">
        {!compact && (
          <span className="vcard-meta">
            <span className="sched-plat-dot" aria-hidden="true" />
            {showTime && item.time ? `${item.time} · ` : ""}
            {PLATFORM_LABEL[item.platform]}
          </span>
        )}
        <span className="vcard-title">{item.title}</span>
      </div>
    </article>
  );
}

/* ----------------------------- page ----------------------------- */

export function Schedule() {
  const [filter, setFilter] = useState<Status | "all">("all");
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<Item[]>(buildItems);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overTarget, setOverTarget] = useState<string | null>(null); // "platform|col" or "pending"
  const [view, setView] = useState<ViewMode>("day");
  // editor anchor — default to today
  const [anchor, setAnchor] = useState<Date>(() => new Date(new Date().setHours(0, 0, 0, 0)));

  const passes = (it: Item) => filter === "all" || it.status === filter;

  const counts = useMemo(
    () => ({
      scheduled: items.filter((e) => e.status === "scheduled").length,
      draft: items.filter((e) => e.status === "draft").length,
      posted: items.filter((e) => e.status === "posted").length,
    }),
    [items],
  );

  const FILTERS: { key: Status | "all"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "scheduled", label: `Scheduled · ${counts.scheduled}` },
    { key: "draft", label: `Drafts · ${counts.draft}` },
    { key: "posted", label: `Posted · ${counts.posted}` },
  ];

  /* ----- overview helpers (current week) ----- */
  const weekStart = startOfWeek(new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const byDay = useMemo(() => {
    const map: Record<number, Item[]> = {};
    for (let d = 0; d < 7; d++) map[d] = [];
    for (const it of items) {
      if (!it.date || !it.time || !passes(it)) continue;
      const dayIdx = weekDays.findIndex((d) => sameDay(d, it.date as Date));
      if (dayIdx >= 0) map[dayIdx].push(it);
    }
    for (let d = 0; d < 7; d++) map[d].sort((a, b) => (a.time as string).localeCompare(b.time as string));
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, filter]);

  const upcoming = useMemo(
    () =>
      items
        .filter((it) => it.date && it.time && it.status !== "posted" && passes(it))
        .sort((a, b) => (a.date as Date).getTime() - (b.date as Date).getTime() || (a.time as string).localeCompare(b.time as string)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, filter],
  );

  /* ----- editor helpers ----- */
  const pending = useMemo(() => items.filter((it) => it.date === null), [items]);

  // Columns along the x-axis: hours in Day view, weekdays in Week view.
  const anchorWeek = useMemo(() => {
    const ws = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  }, [anchor]);

  const columns = useMemo(
    () =>
      view === "day"
        ? SLOTS.map((s) => ({ key: s, label: s }))
        : anchorWeek.map((d, i) => ({ key: d.toISOString(), label: `${DAYS[i]} ${d.getDate()}` })),
    [view, anchorWeek],
  );

  const itemsInCell = (platform: Platform, colIndex: number) =>
    items
      .filter((it) => {
        if (!it.date || !it.time || it.platform !== platform) return false;
        return view === "day"
          ? sameDay(it.date, anchor) && slotIndexOf(it.time) === colIndex
          : sameDay(it.date, anchorWeek[colIndex]);
      })
      .sort((a, b) => (a.time as string).localeCompare(b.time as string));

  function step(dir: 1 | -1) {
    setAnchor((a) => addDays(a, view === "day" ? dir : dir * 7));
  }
  function goToday() {
    setAnchor(new Date(new Date().setHours(0, 0, 0, 0)));
  }

  function placeInCell(platform: Platform, colIndex: number) {
    if (!dragId) return;
    setItems((list) =>
      list.map((it) => {
        if (it.id !== dragId) return it;
        const status: Status = it.status === "posted" ? "posted" : "scheduled";
        if (view === "day") {
          return { ...it, platform, date: new Date(anchor), time: SLOTS[colIndex], status };
        }
        return { ...it, platform, date: new Date(anchorWeek[colIndex]), time: it.time ?? "09:00", status };
      }),
    );
    resetDrag();
  }
  function moveToPending() {
    if (!dragId) return;
    setItems((list) =>
      list.map((it) => (it.id === dragId ? { ...it, date: null, time: null, status: "draft" } : it)),
    );
    resetDrag();
  }
  function resetDrag() {
    setDragId(null);
    setOverTarget(null);
  }

  const headerLabel =
    view === "day"
      ? fmtDayHeader(anchor)
      : `${fmtDMY(anchorWeek[0])} – ${fmtDMY(anchorWeek[6])}`;

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
              Everything Pulse has queued for this week — across Bluesky, Instagram, X, and
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
              <a className="btn btn-accent btn-sm" href="/chat">
                New post with assistant <span className="arrow">→</span>
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
                <div className="sched-nav-right">
                  <span className="sched-hint">
                    Drag a video onto an account &amp; {view === "day" ? "time" : "day"}.
                  </span>
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
                    </select>
                  </label>
                </div>
              </div>

              <div className="sched-planner">
                {/* ----- pending tray (left) ----- */}
                <aside
                  className={`sched-pending${overTarget === "pending" ? " is-over" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOverTarget("pending");
                  }}
                  onDragLeave={() => setOverTarget((t) => (t === "pending" ? null : t))}
                  onDrop={(e) => {
                    e.preventDefault();
                    moveToPending();
                  }}
                >
                  <div className="sched-pending-head">
                    <h3>Pending videos</h3>
                    <span className="sched-pending-count">{pending.length}</span>
                  </div>
                  <div className="sched-pending-list">
                    {pending.length === 0 ? (
                      <p className="sched-pending-empty">
                        Nothing pending — every video is on the schedule. Drag one back here to unschedule it.
                      </p>
                    ) : (
                      pending.map((it) => (
                        <VideoCard
                          key={it.id}
                          item={it}
                          onDragStart={setDragId}
                          onDragEnd={resetDrag}
                          dragging={dragId === it.id}
                        />
                      ))
                    )}
                  </div>
                </aside>

                {/* ----- matrix (right): y-axis = accounts, x-axis = time / days ----- */}
                <div className="sched-matrix-wrap">
                  <div
                    className="sched-matrix"
                    style={{ ["--cols" as string]: columns.length }}
                    role="grid"
                    aria-label={`Schedule for ${headerLabel}`}
                  >
                    {/* header row */}
                    <div className="sched-matrix-corner">
                      <span className="sched-axis-y">Account</span>
                      <span className="sched-axis-x">{view === "day" ? "Time →" : "Day →"}</span>
                    </div>
                    {columns.map((c) => (
                      <div className="sched-colhead2" key={c.key}>
                        {c.label}
                      </div>
                    ))}

                    {/* one row per account */}
                    {PLATFORMS.map((p) => (
                      <Fragment key={p}>
                        <div className="sched-rowhead2" title={PLATFORM_LABEL[p]}>
                          <span className={`sched-plat-icon plat-${p}`} aria-label={PLATFORM_LABEL[p]} role="img">
                            <PlatformIcon platform={p} />
                          </span>
                        </div>
                        {columns.map((c, ci) => {
                          const cellItems = itemsInCell(p, ci);
                          const tkey = `${p}|${ci}`;
                          return (
                            <div
                              key={c.key}
                              className={`sched-cell2${overTarget === tkey ? " is-over" : ""}`}
                              onDragOver={(e) => {
                                e.preventDefault();
                                setOverTarget(tkey);
                              }}
                              onDragLeave={() => setOverTarget((t) => (t === tkey ? null : t))}
                              onDrop={(e) => {
                                e.preventDefault();
                                placeInCell(p, ci);
                              }}
                            >
                              {cellItems.map((it) => (
                                <VideoCard
                                  key={it.id}
                                  item={it}
                                  compact
                                  showTime
                                  onDragStart={setDragId}
                                  onDragEnd={resetDrag}
                                  dragging={dragId === it.id}
                                />
                              ))}
                            </div>
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>
                </div>
              </div>
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
                            <div className="sched-pill-thumb">
                              <img src={e.thumb} alt="" loading="lazy" />
                              <span className="sched-pill-play" aria-hidden="true">▶</span>
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
                          <span className="sched-row-day">{DAYS[dowIndex(e.date as Date)]}</span>
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
              <span>© {new Date().getFullYear()} Buzz</span>
            </div>
            <div className="footer-right">
              <a href="/dashboard">Dashboard</a>
              <a href="/chat">Assistant</a>
            </div>
          </div>
        </footer>
      </main>
    </AppShell>
  );
}
