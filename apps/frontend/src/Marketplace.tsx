import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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

/* ---------------- contact glyphs ---------------- */

function XGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M4 4l16 16M20 4 4 20" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function IgGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.4" cy="6.6" r="1.3" fill="currentColor" />
    </svg>
  );
}

function TikTokGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M14 3.5c.4 2.3 1.9 3.9 4.2 4.2v2.7c-1.5 0-2.9-.4-4.2-1.2v5.4a5.4 5.4 0 1 1-5.4-5.4c.3 0 .6 0 .9.1v2.8a2.7 2.7 0 1 0 1.9 2.6V3.5H14Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 17l-5.3 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ---------------- creator data ----------------
 * Real public figures with their verified, official social accounts.
 * Photos are freely-licensed portraits served from Wikimedia Commons.
 * Marketplace fields (rate / availability / rating) are illustrative.
 */

type Creator = {
  name: string;
  handle: string;
  photo: string;
  location: string;
  specialisations: string[];
  audience: string[];
  rating: number;
  reviews: number;
  followers: string;
  rate: number;
  available: boolean;
  x?: string;
  instagram?: string;
  tiktok?: string;
};

const commonsPhoto = (file: string, width = 480) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;

const CREATORS: Creator[] = [
  {
    name: "Cristiano Ronaldo",
    handle: "@cristiano",
    photo: commonsPhoto("Cristiano Ronaldo in Al Nassr in 2023.jpg"),
    location: "Riyadh, SA",
    specialisations: ["Football", "Sport", "Lifestyle"],
    audience: ["Global", "Sports fans", "Men 18–44"],
    rating: 5.0,
    reviews: 9800,
    followers: "660M",
    rate: 3200000,
    available: false,
    x: "https://x.com/Cristiano",
    instagram: "https://instagram.com/cristiano",
    tiktok: "https://tiktok.com/@cristiano",
  },
  {
    name: "Lionel Messi",
    handle: "@leomessi",
    photo: commonsPhoto("Lionel Messi WC2022.jpg"),
    location: "Miami, FL",
    specialisations: ["Football", "Sport", "Lifestyle"],
    audience: ["Global", "Sports fans", "Families"],
    rating: 5.0,
    reviews: 8700,
    followers: "505M",
    rate: 2600000,
    available: false,
    instagram: "https://instagram.com/leomessi",
    tiktok: "https://tiktok.com/@leomessi",
  },
  {
    name: "Selena Gomez",
    handle: "@selenagomez",
    photo: commonsPhoto("Selena Gomez at the 2024 Toronto International Film Festival 10 (cropped).jpg"),
    location: "Los Angeles, CA",
    specialisations: ["Beauty", "Music", "Acting"],
    audience: ["Gen Z", "Beauty buyers", "Women 18–34"],
    rating: 4.9,
    reviews: 5400,
    followers: "420M",
    rate: 1800000,
    available: true,
    x: "https://x.com/selenagomez",
    instagram: "https://instagram.com/selenagomez",
    tiktok: "https://tiktok.com/@selenagomez",
  },
  {
    name: "Dwayne Johnson",
    handle: "@therock",
    photo: commonsPhoto("Dwayne Johnson 2014 (cropped).jpg"),
    location: "Los Angeles, CA",
    specialisations: ["Fitness", "Acting", "Lifestyle"],
    audience: ["Global", "Gym-goers", "Men 18–44"],
    rating: 4.9,
    reviews: 6100,
    followers: "393M",
    rate: 1700000,
    available: true,
    x: "https://x.com/TheRock",
    instagram: "https://instagram.com/therock",
    tiktok: "https://tiktok.com/@therock",
  },
  {
    name: "Kim Kardashian",
    handle: "@kimkardashian",
    photo: commonsPhoto("Kim Kardashian 2017 (cropped).png"),
    location: "Los Angeles, CA",
    specialisations: ["Fashion", "Beauty", "Business"],
    audience: ["Millennials", "Beauty buyers", "Women 18–34"],
    rating: 4.8,
    reviews: 4700,
    followers: "364M",
    rate: 1500000,
    available: true,
    x: "https://x.com/KimKardashian",
    instagram: "https://instagram.com/kimkardashian",
    tiktok: "https://tiktok.com/@kimkardashian",
  },
  {
    name: "Billie Eilish",
    handle: "@billieeilish",
    photo: commonsPhoto("Billie Eilish 2019 by Glenn Francis (cropped).jpg"),
    location: "Los Angeles, CA",
    specialisations: ["Music", "Fashion", "Sustainability"],
    audience: ["Gen Z", "Music fans", "Women 16–30"],
    rating: 4.9,
    reviews: 3900,
    followers: "120M",
    rate: 900000,
    available: true,
    x: "https://x.com/billieeilish",
    instagram: "https://instagram.com/billieeilish",
    tiktok: "https://tiktok.com/@billieeilish",
  },
  {
    name: "Zendaya",
    handle: "@zendaya",
    photo: commonsPhoto("Zendaya 2019 by Glenn Francis (cropped).jpg"),
    location: "Oakland, CA",
    specialisations: ["Fashion", "Acting", "Beauty"],
    audience: ["Gen Z", "Fashion buyers", "Women 18–34"],
    rating: 4.9,
    reviews: 4200,
    followers: "184M",
    rate: 1300000,
    available: true,
    x: "https://x.com/Zendaya",
    instagram: "https://instagram.com/zendaya",
  },
  {
    name: "Gordon Ramsay",
    handle: "@gordongram",
    photo: commonsPhoto("Gordon Ramsay.jpg"),
    location: "London, UK",
    specialisations: ["Food & Drink", "Cooking", "Reviews"],
    audience: ["Foodies", "Home cooks", "Millennials"],
    rating: 4.8,
    reviews: 5100,
    followers: "17.7M",
    rate: 650000,
    available: true,
    x: "https://x.com/GordonRamsay",
    instagram: "https://instagram.com/gordongram",
    tiktok: "https://tiktok.com/@gordonramsayofficial",
  },
  {
    name: "MrBeast",
    handle: "@mrbeast",
    photo: commonsPhoto("MrBeast 2023 (cropped).jpg"),
    location: "Greenville, NC",
    specialisations: ["YouTube", "Short-form video", "Challenges"],
    audience: ["Gen Z", "Gamers", "Teens"],
    rating: 4.9,
    reviews: 7200,
    followers: "65M",
    rate: 1200000,
    available: true,
    x: "https://x.com/MrBeast",
    instagram: "https://instagram.com/mrbeast",
    tiktok: "https://tiktok.com/@mrbeast",
  },
];

/** All unique specialisations, for the filter rail. */
const ALL_SPECIALISATIONS = Array.from(
  new Set(CREATORS.flatMap((c) => c.specialisations)),
).sort();

type SortKey = "rating" | "followers" | "rate-asc" | "rate-desc";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "rating", label: "Top rated" },
  { key: "followers", label: "Most followers" },
  { key: "rate-asc", label: "Rate: low to high" },
  { key: "rate-desc", label: "Rate: high to low" },
];

function followersToNum(f: string) {
  const n = parseFloat(f);
  const u = f.toUpperCase();
  if (u.includes("B")) return n * 1_000_000_000;
  if (u.includes("M")) return n * 1_000_000;
  if (u.includes("K")) return n * 1_000;
  return n;
}

function ContactButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  const external = href.startsWith("http");
  return (
    <a
      className="mp-contact"
      href={href}
      aria-label={label}
      title={label}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

function defaultEmailBody(c: Creator) {
  const niche = c.specialisations[0]?.toLowerCase() ?? "content";
  return `Hi ${c.name.split(" ")[0]},

I hope this finds you well. I'm reaching out because we'd love to connect with you and have you promote our brand.

We've been following your ${niche} work for a while and your audience feels like a natural fit for what we're building. We think a partnership could be genuinely valuable for both sides — authentic content that resonates with your community, and a collaboration we'd be proud to support long term.

We're flexible on format and creative direction, and we'd love to hear how you like to work. If you're open to it, I'd be happy to share more about the campaign, deliverables, and budget, and to set up a quick call whenever suits you.

Looking forward to hopefully working together.

Warm regards,
The Signal Team`;
}

function EmailOverlay({
  c,
  onClose,
  onSend,
}: {
  c: Creator;
  onClose: () => void;
  onSend: () => void;
}) {
  const [to, setTo] = useState(`${c.name} (${c.handle})`);
  const [subject, setSubject] = useState(`Partnership with ${c.name} — promote our brand`);
  const [body, setBody] = useState(() => defaultEmailBody(c));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="mp-email-backdrop" role="dialog" aria-modal="true" aria-label={`Email ${c.name}`} onClick={onClose}>
      <div className="mp-email" onClick={(e) => e.stopPropagation()}>
        <div className="mp-email-head">
          <span className="mp-email-title">New message · {c.name}</span>
          <button type="button" className="mp-email-x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <label className="mp-email-row">
          <span className="mp-email-label">To</span>
          <input value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="mp-email-row">
          <span className="mp-email-label">Subject</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </label>
        <textarea
          className="mp-email-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={14}
          aria-label="Message"
        />

        <div className="mp-email-foot">
          <button type="button" className="mp-email-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="mp-email-send" onClick={onSend}>
            Send <span className="arrow">→</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CreatorCard({ c }: { c: Creator }) {
  const [contacted, setContacted] = useState(false);
  const [composing, setComposing] = useState(false);
  return (
    <article className="mp-card">
      <div className="mp-photo">
        <img src={c.photo} alt={`${c.name}, UGC creator`} loading="lazy" />
        <span className={`mp-avail ${c.available ? "is-open" : "is-busy"}`}>
          {c.available ? "Available" : "Booked"}
        </span>
      </div>
      <div className="mp-body">
        <div className="mp-id">
          <div className="mp-id-top">
            <h3>{c.name}</h3>
            <span className="mp-rating">
              <StarGlyph />
              {c.rating.toFixed(1)}
              <span className="mp-reviews">({c.reviews})</span>
            </span>
          </div>
          <span className="mp-handle">{c.handle}</span>
          <span className="mp-loc">
            {c.location} · {c.followers} followers
          </span>
        </div>

        <div className="mp-tagblock">
          <span className="mp-tag-label">Specialisations</span>
          <div className="mp-tags">
            {c.specialisations.map((s) => (
              <span className="tag tag-spec" key={s}>
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="mp-tagblock">
          <span className="mp-tag-label">Audience</span>
          <div className="mp-tags">
            {c.audience.map((a) => (
              <span className="tag tag-aud" key={a}>
                {a}
              </span>
            ))}
          </div>
        </div>

        <div className="mp-foot">
          <div className="mp-rate">
            <span className="mp-rate-val">${c.rate.toLocaleString()}</span>
            <span className="mp-rate-unit">/ deliverable</span>
          </div>
          <div className="mp-contacts">
            {c.x && (
              <ContactButton href={c.x} label={`${c.name} on X`}>
                <XGlyph />
              </ContactButton>
            )}
            {c.instagram && (
              <ContactButton href={c.instagram} label={`${c.name} on Instagram`}>
                <IgGlyph />
              </ContactButton>
            )}
            {c.tiktok && (
              <ContactButton href={c.tiktok} label={`${c.name} on TikTok`}>
                <TikTokGlyph />
              </ContactButton>
            )}
          </div>
        </div>

        <button
          type="button"
          className={`mp-agent-btn ${contacted ? "is-contacted" : ""}`}
          onClick={() => setComposing(true)}
          disabled={contacted}
          aria-live="polite"
        >
          {contacted ? (
            <>Agent contacted ✓</>
          ) : (
            <>Content Agent <span className="arrow">→</span></>
          )}
        </button>
      </div>

      {composing && (
        <EmailOverlay
          c={c}
          onClose={() => setComposing(false)}
          onSend={() => {
            setContacted(true);
            setComposing(false);
          }}
        />
      )}
    </article>
  );
}

export function Marketplace() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("rating");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = CREATORS.filter((c) => {
      const matchesSpec = !active || c.specialisations.includes(active);
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.specialisations.some((s) => s.toLowerCase().includes(q)) ||
        c.audience.some((a) => a.toLowerCase().includes(q));
      return matchesSpec && matchesQuery;
    });

    return filtered.sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating || b.reviews - a.reviews;
      if (sort === "followers") return followersToNum(b.followers) - followersToNum(a.followers);
      if (sort === "rate-asc") return a.rate - b.rate;
      return b.rate - a.rate;
    });
  }, [query, active, sort]);

  return (
    <AppShell current="marketplace">
      <main className="mp">
      <div className="wrap">
        {/* ---------- header ---------- */}
        <div className="mp-head">
          <span className="label label-accent mp-kicker">Creator Marketplace</span>
          <h1>Hire creators by specialisation and audience.</h1>
          <p>
            Browse creators, compare reach, then connect directly on their
            official socials — X, Instagram, or TikTok.
          </p>
        </div>

        {/* ---------- search + filters ---------- */}
        <div className="mp-controls">
          <input
            className="mp-search"
            type="search"
            placeholder="Search creators, niches, audiences…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search creators"
          />
          <select
            className="mp-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort creators"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mp-filters" role="group" aria-label="Filter by specialisation">
          <button
            className={`mp-chip ${active === null ? "is-active" : ""}`}
            onClick={() => setActive(null)}
          >
            All
          </button>
          {ALL_SPECIALISATIONS.map((s) => (
            <button
              key={s}
              className={`mp-chip ${active === s ? "is-active" : ""}`}
              onClick={() => setActive((cur) => (cur === s ? null : s))}
            >
              {s}
            </button>
          ))}
        </div>

        <p className="mp-count">
          {results.length} creator{results.length === 1 ? "" : "s"}
          {active ? ` in ${active}` : ""} available to hire
        </p>

        {/* ---------- grid ---------- */}
        {results.length > 0 ? (
          <div className="mp-grid">
            {results.map((c) => (
              <CreatorCard c={c} key={c.handle} />
            ))}
          </div>
        ) : (
          <p className="mp-empty">No creators match that search yet. Try a different niche.</p>
        )}
      </div>

      {/* ---------- footer ---------- */}
      <footer className="footer mp-footer">
        <div className="wrap footer-inner">
          <div className="footer-left">
            <Logo />
            <span>© {new Date().getFullYear()} Signal</span>
          </div>
          <div className="footer-right">
            <a href="/dashboard">Dashboard</a>
            <a href="/marketplace">Marketplace</a>
          </div>
        </div>
      </footer>
      </main>
    </AppShell>
  );
}
