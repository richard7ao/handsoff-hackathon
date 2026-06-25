import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Hourglass "cinch" animation — ported directly from background-agents.com's
 * HourglassCinch component (constants, easing, state machine and dot physics
 * preserved). Adapted to Buzz's loop: Describe → Research → Write → Post → Improve.
 *
 * Dots flow left→right continuously. On a timer (or while hovered) the stream
 * "cinches" toward the centre stage — the curves pinch in and nearby dots are
 * pulled to the midline and slowed, like sand through an hourglass.
 */

const STAGES = ["Describe", "Research", "Write", "Post", "Improve"];

// geometry (from the source: r, c, L, $, O)
const TOP_Y = 80;
const BOT_Y = 220;
const MID = 150;
const W = 1000;
const H = 240;

// timing (ms) — it, lt, ft, ht
const FREE_FLOW = 800;
const CINCH = 600;
const HOLD = 3500;
const RELEASE = 450;
const CINCH_MAX = 0.75;

const PHASE_COLORS = ["#c41e3a", "#8b4513", "#2e5a1c", "#1a4a6e"];

// lerp + easeInOutQuad (P and q in the source)
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

type Phase = "free-flow" | "cinching" | "holding" | "releasing";
type Dot = { id: number; x: number; baseY: number; renderY: number; color: string };

// label x positions (dt): p = W - 280, pos = 140 + p/(n-1)*i
function labelPositions(n: number) {
  const p = W - 280;
  return Array.from({ length: n }, (_, i) => 140 + (p / (n - 1)) * i);
}

// hourglass paths (ut): t = cinchX, l = cinchAmount
function paths(t: number, l: number) {
  const d = lerp(TOP_Y, MID, l);
  const f = lerp(BOT_Y, MID, l);
  const g = 40;
  const x = W - 40;
  const o = 80;
  const topPath = `M ${g} ${TOP_Y} L ${t - 40 - o} ${TOP_Y} C ${t - 40} ${TOP_Y}, ${t - 40} ${d}, ${t} ${d} C ${t + 40} ${d}, ${t + 40} ${TOP_Y}, ${t + 40 + o} ${TOP_Y} L ${x} ${TOP_Y}`;
  const bottomPath = `M ${g} ${BOT_Y} L ${t - 40 - o} ${BOT_Y} C ${t - 40} ${BOT_Y}, ${t - 40} ${f}, ${t} ${f} C ${t + 40} ${f}, ${t + 40} ${BOT_Y}, ${t + 40 + o} ${BOT_Y} L ${x} ${BOT_Y}`;
  const fillPath = `${topPath} L ${x} ${BOT_Y} L ${t + 40 + o} ${BOT_Y} C ${t + 40} ${BOT_Y}, ${t + 40} ${f}, ${t} ${f} C ${t - 40} ${f}, ${t - 40} ${BOT_Y}, ${t - 40 - o} ${BOT_Y} L ${g} ${BOT_Y} Z`;
  return { topPath, bottomPath, fillPath };
}

export function Pipeline() {
  const stages = STAGES;
  const positions = useMemo(() => labelPositions(stages.length), [stages.length]);
  const centerX = positions[Math.floor(stages.length / 2)];

  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef(0);
  const idRef = useRef(0);
  const lastSpawn = useRef(0);

  const cinchXRef = useRef(centerX);
  const cinchAmtRef = useRef(0);
  const phaseRef = useRef<Phase>("free-flow");
  const phaseStart = useRef(performance.now());
  const hoveringRef = useRef(false);
  const hoverXRef = useRef(centerX);
  const dotsRef = useRef<Dot[]>([]);

  const [frame, setFrame] = useState<{ cinchX: number; cinchAmount: number; items: Dot[] }>(
    { cinchX: centerX, cinchAmount: 0, items: [] },
  );

  const makeDot = useCallback((x: number): Dot => {
    idRef.current += 1;
    const id = idRef.current;
    const baseY = MID + (Math.random() - 0.5) * 30;
    return { id, x, baseY, renderY: baseY, color: PHASE_COLORS[id % 4] };
  }, []);

  const mapX = useCallback((clientX: number) => {
    const node = svgRef.current;
    if (!node) return centerX;
    const r = node.getBoundingClientRect();
    return Math.max(80, Math.min(W - 80, ((clientX - r.left) / r.width) * W));
  }, [centerX]);

  const onMove = useCallback((e: React.PointerEvent) => {
    hoveringRef.current = true;
    hoverXRef.current = mapX(e.clientX);
  }, [mapX]);

  const onLeave = useCallback(() => {
    hoveringRef.current = false;
    phaseRef.current = "free-flow";
    phaseStart.current = performance.now();
  }, []);

  useEffect(() => {
    // seed 20 dots spread across the width
    const seed: Dot[] = [];
    for (let i = 0; i < 20; i++) seed.push(makeDot(50 + Math.random() * (W - 100)));
    dotsRef.current = seed;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const tick = () => {
      const now = performance.now();
      const elapsed = now - phaseStart.current;

      let target = centerX;
      let R = 0;

      if (hoveringRef.current && !reduced) {
        target = hoverXRef.current;
        R = CINCH_MAX;
      } else if (!reduced) {
        const phase = phaseRef.current;
        if (phase === "free-flow") {
          R = 0;
          if (elapsed >= FREE_FLOW) { phaseRef.current = "cinching"; phaseStart.current = now; }
        } else if (phase === "cinching") {
          const p = Math.min(elapsed / CINCH, 1);
          R = easeInOutQuad(p) * CINCH_MAX;
          if (p >= 1) { phaseRef.current = "holding"; phaseStart.current = now; }
        } else if (phase === "holding") {
          R = CINCH_MAX;
          if (elapsed >= HOLD) { phaseRef.current = "releasing"; phaseStart.current = now; }
        } else if (phase === "releasing") {
          const p = Math.min(elapsed / RELEASE, 1);
          R = (1 - easeInOutQuad(p)) * CINCH_MAX;
          if (p >= 1) { phaseRef.current = "free-flow"; phaseStart.current = now; }
        }
      }

      cinchXRef.current = lerp(cinchXRef.current, target, 0.12);
      cinchAmtRef.current = lerp(cinchAmtRef.current, R, 0.12);
      const cinchX = cinchXRef.current;
      const cinch = cinchAmtRef.current;

      // spawn a new dot every ~300ms
      if (now - lastSpawn.current > 300) {
        lastSpawn.current = now;
        dotsRef.current.push(makeDot(20));
      }

      dotsRef.current = dotsRef.current
        .map((dot) => {
          const h = dot.x - cinchX;
          let speed: number;
          if (cinch < 0.05) speed = 1.2 + Math.random() * 0.2;
          else if (h < -80) speed = 1.8 + Math.random() * 0.3;
          else if (h < 40) speed = lerp(1.2, 0.1, cinch / CINCH_MAX) + Math.random() * 0.1;
          else speed = 0.5 + Math.random() * 0.2;

          let offset = dot.baseY - MID;
          if (Math.abs(h) < 60) offset *= 1 - cinch * (1 - Math.abs(h) / 60);
          return { ...dot, x: dot.x + speed, renderY: MID + offset };
        })
        .filter((dot) => dot.x < W + 20);

      setFrame({ cinchX, cinchAmount: cinch, items: [...dotsRef.current] });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [centerX, makeDot]);

  const { cinchX, cinchAmount, items } = frame;
  const { topPath, bottomPath, fillPath } = paths(cinchX, cinchAmount);
  const activeIdx =
    cinchAmount > 0.1
      ? positions.reduce(
          (best, p, i) => (Math.abs(p - cinchX) < Math.abs(positions[best] - cinchX) ? i : best),
          0,
        )
      : -1;

  return (
    <div className="pipeline">
      <div className="wrap">
        <svg
          ref={svgRef}
          className="pipeline-svg"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Buzz's continuous loop: describe, research, write, post, improve"
          onPointerMove={onMove}
          onPointerLeave={onLeave}
        >
          <rect x={0} y={0} width={W} height={H} fill="transparent" />

          {/* droplines from labels to the top curve */}
          {positions.map((p, i) => (
            <line
              key={`t-${i}`}
              x1={p}
              y1={TOP_Y - 32}
              x2={p}
              y2={TOP_Y}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          ))}

          <path d={fillPath} fill="#ffffff" opacity={0.5} />
          <path d={topPath} fill="none" stroke="#d0d0d0" strokeWidth={1.5} />
          <path d={bottomPath} fill="none" stroke="#d0d0d0" strokeWidth={1.5} />

          {cinchAmount > 0.1 && (
            <line
              x1={cinchX}
              y1={TOP_Y - 8}
              x2={cinchX}
              y2={BOT_Y + 8}
              stroke="var(--accent)"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.7}
            />
          )}

          {/* stage labels */}
          {stages.map((s, i) => (
            <text
              key={s}
              x={positions[i]}
              y={TOP_Y - 40}
              textAnchor="middle"
              fontFamily="Inter, system-ui, sans-serif"
              fontSize={13}
              fontWeight={600}
              letterSpacing="1.2"
              fill={i === activeIdx ? "var(--accent)" : "var(--muted)"}
              style={{ textTransform: "uppercase" }}
            >
              {s.toUpperCase()}
            </text>
          ))}

          {/* flowing dots */}
          {items.map((dot) => (
            <circle key={dot.id} cx={dot.x} cy={dot.renderY} r={4.5} fill={dot.color} />
          ))}
        </svg>
        <p className="pipeline-caption">
          One loop, always running. Hover to pinch the stream — the handoff in the middle is where a
          draft becomes a live post.
        </p>
      </div>
    </div>
  );
}
