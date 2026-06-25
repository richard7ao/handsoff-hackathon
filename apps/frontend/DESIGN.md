# Design

> Deliberate reference match to **background-agents.com** (the user named it as the
> target). This lands in the editorial-typographic lane on purpose; reference fidelity
> wins over the greenfield "avoid editorial" reflex.

## Theme

Light "white-paper" editorial. A warm near-neutral light-gray field with a faint dotted
grid, refined serif headlines, and a single crimson accent. Calm, academic, considered —
the page reads like a research note about a system that runs itself.

## Color (OKLCH)

| Role        | Value                     | Use |
|-------------|---------------------------|-----|
| bg          | `oklch(0.945 0.003 70)`   | Page background (warm light gray, NOT cream — chroma kept ≤0.004) |
| panel       | `oklch(0.985 0.002 70)`   | Cards, white callout panels |
| panel-alt   | `oklch(0.925 0.003 70)`   | Alternating gray section bands |
| ink         | `oklch(0.23 0.008 50)`    | Headings + body (≥11:1 on bg) |
| muted       | `oklch(0.50 0.008 50)`    | Subtitles, secondary text (≥4.5:1) |
| accent      | `oklch(0.52 0.20 22)`     | Crimson — micro-labels, active nav, dots, primary CTA |
| accent-ink  | `oklch(0.45 0.20 22)`     | Crimson hover/darker |
| black       | `oklch(0.18 0.006 50)`    | Black pill CTA, strong marks |
| border      | `oklch(0.85 0.004 70)`    | Hairlines, card borders |
| grid-dot    | `oklch(0.80 0.003 70)`    | Dotted background pattern |

Strategy: **Restrained editorial** — neutral light field, crimson ≤10%, black for the
secondary CTA. White text on crimson/black fills.

## Typography

- **Display + body:** **Spectral** (Google) — a screen-first transitional serif with real
  contrast. Bold for headings, regular/italic for leads and prose. NOT on the reflex-reject
  serif list. This carries the editorial voice.
- **Micro-labels / nav / pipeline ticks / tags:** **Geist** sans, uppercase, ~0.78rem,
  letter-spacing 0.08em. Crimson for kickers, muted gray for metadata.
- Headings get a **crimson left-rule** (3px vertical bar) on key blocks, per the reference.
- Display clamp ceiling ~5rem; letter-spacing -0.02em (serif, looser than the grotesque floor).
- `text-wrap: balance` on headings; `pretty` on prose. Body ≤72ch.

## Signature elements (from the reference)

1. **Dotted-grid background** behind the hero (radial-dot pattern, faint).
2. **The SDLC "pinch" diagram** → Signal pipeline: `DESCRIBE · RESEARCH · WRITE · POST · IMPROVE`
   as labelled ticks over a horizontal pinch curve with scattered colored dots; active stage
   in crimson. Custom inline SVG.
3. **Hairline white cards**, ~4px radius, small crimson uppercase label → serif title →
   footer row (avatar/initial + "Watch →"-style link). Used for the three agents.
4. **CTA pair:** crimson filled primary ("Go to Demo") + thin-bordered/black secondary.
5. Uppercase tracked **metadata labels** above sections (`THE PROBLEM`, `HOW IT WORKS`).

## Motion

- Restrained, like the reference. Quiet fade-up on the hero only; no per-section reveal reflex.
- A single small crimson **live dot** (slow pulse) for the "running" signal. Respects
  `prefers-reduced-motion`.

## Layout

- Centered, generous-whitespace editorial column; fixed minimal top bar (`ONA`-style wordmark
  left, links + CTA right).
- Order: Hero (dotted grid) → Pipeline diagram → The Problem → How it works → The three agents
  (cards) → Closing CTA → Footer. "Go to Demo" in the top bar and footer.
