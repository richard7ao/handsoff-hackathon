# Design

> Deliberate reference match to **background-agents.com** (the user named it as the
> target). This lands in the editorial-typographic lane on purpose; reference fidelity
> wins over the greenfield "avoid editorial" reflex.

## Theme

Light "white-paper" editorial. A warm near-neutral light-gray field with a faint dotted
grid, refined serif headlines, and a single crimson accent. Calm, academic, considered —
the page reads like a research note about a system that runs itself.

## Color (exact tokens, copied from background-agents.com "gartner" theme)

| Role        | Value     | Use |
|-------------|-----------|-----|
| bg          | `#FAFAFA` | Page background |
| panel       | `#FFFFFF` | Cards, white callout panels |
| panel-alt   | `#F0F0F0` | Alternating gray section bands |
| ink         | `#1A1A1A` | Headings + body |
| muted       | `#666666` | Subtitles, secondary text |
| accent      | `#C41E3A` | Crimson — micro-labels, active nav, dots, primary CTA |
| accent-ink  | `#A01830` | Crimson hover/darker |
| border      | `#E0E0E0` | Hairlines, card borders |
| grid-dot    | `#D8D8D8` | Dotted hero background |
| phase1–4    | `#C41E3A` / `#8B4513` / `#2E5A1C` / `#1A4A6E` | Pipeline dot colors |

Strategy: **Restrained editorial** — neutral light field, crimson ≤10%, black for the
secondary CTA. White text on crimson/black fills. Border-radius **2px** (sharp, per source).

## Typography (exact, copied from source)

- **Headings:** **Playfair Display** (Georgia fallback) — high-contrast display serif.
- **Body / leads / prose:** **Source Serif 4** (Source Serif Pro), 18px base.
- **Micro-labels / nav / pipeline labels / tags:** **Inter**, uppercase, letter-spacing 0.09em.
  Crimson for kickers, muted gray for metadata.
- Headings get a **crimson left-rule** (3px vertical bar) on key blocks, per the reference.
- `text-wrap: balance` on headings; `pretty` on prose. Body ≤72ch.

## Signature elements (from the reference)

1. **Dotted-grid background** behind the hero (radial-dot pattern, faint).
2. **The SDLC "pinch" diagram** → Buzz pipeline: `DESCRIBE · RESEARCH · WRITE · POST · IMPROVE`
   as labelled ticks over a horizontal pinch curve with scattered colored dots; active stage
   in crimson. Custom inline SVG.
3. **Hairline white cards**, ~4px radius, small crimson uppercase label → serif title →
   footer row (avatar/initial + "Watch →"-style link). Used for the three agents.
4. **CTA pair:** crimson filled primary ("Go to Demo") + thin-bordered/black secondary.
5. Uppercase tracked **metadata labels** above sections (`THE PROBLEM`, `HOW IT WORKS`).

## Motion

- Restrained, like the reference. Quiet fade-up on the hero only; no per-section reveal reflex.
- A single small crimson **live dot** (slow pulse) for the "running" buzz. Respects
  `prefers-reduced-motion`.

## Layout

- Centered, generous-whitespace editorial column; fixed minimal top bar (`ONA`-style wordmark
  left, links + CTA right).
- Order: Hero (dotted grid) → Pipeline diagram → The Problem → How it works → The three agents
  (cards) → Closing CTA → Footer. "Go to Demo" in the top bar and footer.
