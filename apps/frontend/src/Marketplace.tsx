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

/* ---------------- contact glyphs ---------------- */

function MailGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 6.5 12 13l8.5-6.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

/* ---------------- mock data ---------------- */

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
  email: string;
  x: string;
  instagram: string;
  tiktok: string;
};

const CREATORS: Creator[] = [
  {
    name: "Maya Chen",
    handle: "@mayamakes",
    photo: "https://i.pravatar.cc/400?img=47",
    location: "Austin, TX",
    specialisations: ["Food & Drink", "Short-form video", "Recipes"],
    audience: ["Gen Z", "Foodies", "Local · ATX"],
    rating: 4.9,
    reviews: 128,
    followers: "412K",
    rate: 850,
    available: true,
    email: "maya.chen@creators.mock",
    x: "https://x.com/mayamakes",
    instagram: "https://instagram.com/mayamakes",
    tiktok: "https://tiktok.com/@mayamakes",
  },
  {
    name: "Jordan Reyes",
    handle: "@jordanlifts",
    photo: "https://i.pravatar.cc/400?img=12",
    location: "Los Angeles, CA",
    specialisations: ["Fitness", "Wellness", "Day-in-the-life"],
    audience: ["Millennials", "Gym-goers", "Health-conscious"],
    rating: 4.8,
    reviews: 96,
    followers: "287K",
    rate: 1200,
    available: true,
    email: "jordan.reyes@creators.mock",
    x: "https://x.com/jordanlifts",
    instagram: "https://instagram.com/jordanlifts",
    tiktok: "https://tiktok.com/@jordanlifts",
  },
  {
    name: "Aisha Bello",
    handle: "@aishabeauty",
    photo: "https://i.pravatar.cc/400?img=32",
    location: "Brooklyn, NY",
    specialisations: ["Beauty", "Skincare", "Tutorials"],
    audience: ["Gen Z", "Beauty buyers", "Women 18–34"],
    rating: 5.0,
    reviews: 211,
    followers: "738K",
    rate: 1500,
    available: false,
    email: "aisha.bello@creators.mock",
    x: "https://x.com/aishabeauty",
    instagram: "https://instagram.com/aishabeauty",
    tiktok: "https://tiktok.com/@aishabeauty",
  },
  {
    name: "Leo Martins",
    handle: "@leobuilds",
    photo: "https://i.pravatar.cc/400?img=15",
    location: "Denver, CO",
    specialisations: ["Home & DIY", "Reviews", "Tutorials"],
    audience: ["Homeowners", "Millennials", "Dads"],
    rating: 4.7,
    reviews: 64,
    followers: "154K",
    rate: 600,
    available: true,
    email: "leo.martins@creators.mock",
    x: "https://x.com/leobuilds",
    instagram: "https://instagram.com/leobuilds",
    tiktok: "https://tiktok.com/@leobuilds",
  },
  {
    name: "Priya Nair",
    handle: "@priyatravels",
    photo: "https://i.pravatar.cc/400?img=45",
    location: "Miami, FL",
    specialisations: ["Travel", "Lifestyle", "Photography"],
    audience: ["Millennials", "Luxury", "Couples"],
    rating: 4.9,
    reviews: 142,
    followers: "523K",
    rate: 1800,
    available: true,
    email: "priya.nair@creators.mock",
    x: "https://x.com/priyatravels",
    instagram: "https://instagram.com/priyatravels",
    tiktok: "https://tiktok.com/@priyatravels",
  },
  {
    name: "Sam Okafor",
    handle: "@samtechtips",
    photo: "https://i.pravatar.cc/400?img=51",
    location: "Seattle, WA",
    specialisations: ["Tech", "Gadget reviews", "Explainers"],
    audience: ["Gen Z", "Early adopters", "Students"],
    rating: 4.6,
    reviews: 88,
    followers: "201K",
    rate: 900,
    available: true,
    email: "sam.okafor@creators.mock",
    x: "https://x.com/samtechtips",
    instagram: "https://instagram.com/samtechtips",
    tiktok: "https://tiktok.com/@samtechtips",
  },
  {
    name: "Hana Kim",
    handle: "@hanaeats",
    photo: "https://i.pravatar.cc/400?img=23",
    location: "San Francisco, CA",
    specialisations: ["Food & Drink", "Vlogs", "Local guides"],
    audience: ["Foodies", "Local · SF", "Gen Z"],
    rating: 4.8,
    reviews: 73,
    followers: "168K",
    rate: 700,
    available: false,
    email: "hana.kim@creators.mock",
    x: "https://x.com/hanaeats",
    instagram: "https://instagram.com/hanaeats",
    tiktok: "https://tiktok.com/@hanaeats",
  },
  {
    name: "Marcus Hill",
    handle: "@marcusfits",
    photo: "https://i.pravatar.cc/400?img=59",
    location: "Chicago, IL",
    specialisations: ["Fitness", "Nutrition", "Coaching"],
    audience: ["Millennials", "Athletes", "Men 25–40"],
    rating: 4.7,
    reviews: 109,
    followers: "342K",
    rate: 1100,
    available: true,
    email: "marcus.hill@creators.mock",
    x: "https://x.com/marcusfits",
    instagram: "https://instagram.com/marcusfits",
    tiktok: "https://tiktok.com/@marcusfits",
  },
  {
    name: "Elena Rossi",
    handle: "@elenastyle",
    photo: "https://i.pravatar.cc/400?img=20",
    location: "New York, NY",
    specialisations: ["Fashion", "Styling", "Hauls"],
    audience: ["Gen Z", "Fashion buyers", "Women 18–34"],
    rating: 4.9,
    reviews: 187,
    followers: "604K",
    rate: 1600,
    available: true,
    email: "elena.rossi@creators.mock",
    x: "https://x.com/elenastyle",
    instagram: "https://instagram.com/elenastyle",
    tiktok: "https://tiktok.com/@elenastyle",
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
  return f.toUpperCase().includes("K") ? n * 1_000 : n;
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

function CreatorCard({ c }: { c: Creator }) {
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
            <ContactButton href={`mailto:${c.email}`} label={`Email ${c.name}`}>
              <MailGlyph />
            </ContactButton>
            <ContactButton href={c.x} label={`${c.name} on X`}>
              <XGlyph />
            </ContactButton>
            <ContactButton href={c.instagram} label={`${c.name} on Instagram`}>
              <IgGlyph />
            </ContactButton>
            <ContactButton href={c.tiktok} label={`${c.name} on TikTok`}>
              <TikTokGlyph />
            </ContactButton>
          </div>
        </div>
      </div>
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
          <h1>Hire UGC creators by specialisation and audience.</h1>
          <p>
            Browse vetted creators, compare rates and reach, then reach out directly —
            email, X, Instagram, or TikTok.
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
