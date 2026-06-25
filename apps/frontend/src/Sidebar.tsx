import { useEffect, useState, type ReactNode } from "react";

export type PageId = "dashboard" | "schedule" | "chat" | "marketplace";

/* ---------------- icons ---------------- */

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M4 9h16l-1-4H5L4 9Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M5 9v10h14V9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M10 19v-5h4v5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M4 5h16v11H9l-4 3v-3H4V5Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M4 11l8-6.5 8 6.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v9h12v-9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M10 19v-5h4v5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function CollapseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M14 7l-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Flashing red "connected" light, scoped to the rail. */
function ConnLight() {
  return (
    <span className="conn-light sm" aria-hidden="true">
      <span className="ring" />
      <span className="core" />
    </span>
  );
}

/* ---------------- page nav (every page except the landing page) ---------------- */

const PAGES: { id: PageId; label: string; href: string; icon: JSX.Element }[] = [
  { id: "chat", label: "Chat", href: "/chat", icon: <ChatIcon /> },
  { id: "marketplace", label: "Marketplace", href: "/marketplace", icon: <StoreIcon /> },
  { id: "schedule", label: "Schedule", href: "/schedule", icon: <CalendarIcon /> },
];

/* ---------------- analytics nav (dashboard in-page sections, persistent on every page) ---------------- */

const ANALYTICS_NAV = [
  { id: "overview", label: "Overview" },
  { id: "channels", label: "Channels" },
  { id: "briefing", label: "Data briefing" },
  { id: "integrations", label: "Integrations" },
];

function AnalyticsNav({ current }: { current: PageId }) {
  const onDashboard = current === "dashboard";
  const [hash, setHash] = useState(() => (typeof location !== "undefined" ? location.hash.slice(1) : ""));

  useEffect(() => {
    if (!onDashboard) return;
    const onHashChange = () => setHash(location.hash.slice(1));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [onDashboard]);

  return (
    <nav className="rail-nav">
      <span className="rail-section">Analytics</span>
      {ANALYTICS_NAV.map((n) => {
        const isActive = onDashboard && hash === n.id;
        return (
          <a
            key={n.id}
            href={`/dashboard#${n.id}`}
            className={`rail-link${isActive ? " is-active" : ""}`}
            aria-current={isActive ? "true" : undefined}
            title={n.label}
          >
            <span className="rail-ico rail-ico-dot" aria-hidden="true" />
            <span className="rail-label">{n.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

/* ---------------- collapse state (shared, persisted) ---------------- */

export function useRailCollapsed() {
  const [collapsed, setCollapsed] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem("rail-collapsed") === "1",
  );
  useEffect(() => {
    localStorage.setItem("rail-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);
  return [collapsed, setCollapsed] as const;
}

/* ---------------- sidebar ---------------- */

export function Sidebar({
  current,
  collapsed,
  onToggle,
  children,
}: {
  current: PageId;
  collapsed: boolean;
  onToggle: () => void;
  /** Optional extra nav sections (e.g. the dashboard's in-page anchors). */
  children?: ReactNode;
}) {
  return (
    <aside className="dash-rail">
      <div className="rail-top">
        <span className="rail-brand">
          <span className="rail-logo">
            <svg viewBox="0 0 64 64" width="20" height="20" aria-hidden="true">
              <circle cx="32" cy="32" r="21" fill="none" stroke="var(--d-accent)" strokeWidth="4" opacity="0.35" />
              <circle cx="32" cy="32" r="11" fill="none" stroke="var(--d-accent)" strokeWidth="4" opacity="0.6" />
              <circle cx="32" cy="32" r="5" fill="var(--d-accent)" />
            </svg>
          </span>
          <span className="rail-label">Signal</span>
        </span>
        <button
          type="button"
          className="rail-toggle"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <CollapseIcon />
        </button>
      </div>

      <nav className="rail-nav">
        <a
          href="/dashboard"
          className={`rail-link${current === "dashboard" ? " is-active" : ""}`}
          aria-current={current === "dashboard" ? "page" : undefined}
          title="Home"
        >
          <span className="rail-ico"><HomeIcon /></span>
          <span className="rail-label">Home</span>
        </a>
        <span className="rail-section">Workspace</span>
        {PAGES.map((p) => (
          <a
            key={p.id}
            href={p.href}
            className={`rail-link${p.id === current ? " is-active" : ""}`}
            aria-current={p.id === current ? "page" : undefined}
            title={p.label}
          >
            <span className="rail-ico">{p.icon}</span>
            <span className="rail-label">{p.label}</span>
          </a>
        ))}
      </nav>

      <AnalyticsNav current={current} />

      {children}

      <div className="rail-agent">
        <div className="rail-agent-row">
          <span className="rail-agent-name rail-label">CMO Agent</span>
          <span className="rail-agent-state">
            <ConnLight /> <span className="rail-label">running</span>
          </span>
        </div>
        <p className="rail-agent-sub rail-label">Autonomous · no operator</p>
      </div>
    </aside>
  );
}

/* ---------------- shell wrapper for non-dashboard pages ---------------- */

export function AppShell({ current, children }: { current: PageId; children: ReactNode }) {
  const [collapsed, setCollapsed] = useRailCollapsed();
  return (
    <div className={`app-shell${collapsed ? " is-rail-collapsed" : ""}`}>
      <Sidebar current={current} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="app-shell-main">{children}</div>
    </div>
  );
}
