import type { SVGProps } from "react";

/**
 * SF Symbols-style glyphs hand-authored to match the four symbols Angel
 * picked from the SF Symbols app: sparkles, clock, water.waves, gearshape.
 *
 * Stroke-based so NavBar can vary stroke-width between active (2.2) and
 * inactive (1.7) states. `currentColor` lets the parent's text-color class
 * drive the fill — same pattern as lucide.
 *
 * 24×24 viewBox to match lucide's coordinate system, so swapping is a
 * one-line change at the import site.
 */
type IconProps = SVGProps<SVGSVGElement>;

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/**
 * sparkles — three 4-pointed stars: large center-left, medium top-right,
 * small bottom-right. Concave-diamond glyph shape via quadratic curves.
 */
export function SparklesGlyph(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      {/* Large center-left */}
      <path d="M11 4.5 Q12 11 17.5 12 Q12 13 11 19.5 Q10 13 4.5 12 Q10 11 11 4.5 Z" />
      {/* Medium top-right */}
      <path d="M18.5 3 Q19 5.5 21 6 Q19 6.5 18.5 9 Q18 6.5 16 6 Q18 5.5 18.5 3 Z" />
      {/* Small bottom-right */}
      <path d="M19.5 15 Q19.85 16.7 21.5 17 Q19.85 17.3 19.5 19 Q19.15 17.3 17.5 17 Q19.15 16.7 19.5 15 Z" />
    </svg>
  );
}

/**
 * clock — circle outline + hour and minute hands.
 * Hands sit at the iconic Apple "10:10" smile position.
 */
export function ClockGlyph(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      {/* Hour hand to ~"10" position; minute hand to ~"2" */}
      <path d="M12 12 L8.5 9.5" />
      <path d="M12 12 L17 8.5" />
    </svg>
  );
}

/**
 * water.waves — three stacked horizontal sine curves, each slightly offset
 * to read as flowing water rather than perfect alignment.
 */
export function WaterWavesGlyph(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M2.5 7.5 Q5.5 5.5 8.5 7.5 T14.5 7.5 T20.5 7.5" />
      <path d="M2.5 12 Q5.5 10 8.5 12 T14.5 12 T20.5 12" />
      <path d="M2.5 16.5 Q5.5 14.5 8.5 16.5 T14.5 16.5 T20.5 16.5" />
    </svg>
  );
}

/**
 * gearshape — 8-tooth gear silhouette with a center post. Path is computed
 * once at module load: 8 trapezoidal teeth joined by inner-radius arcs
 * between them, producing the smooth gear outline iOS Settings uses.
 */
function buildGearPath(): string {
  const cx = 12;
  const cy = 12;
  const innerR = 7.5; // body radius (between teeth)
  const outerR = 10.5; // tooth tip radius
  const halfTooth = 11; // half-tooth angular width (degrees)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const fmt = (n: number) => n.toFixed(2);

  let p = "";
  for (let i = 0; i < 8; i++) {
    const center = i * 45;
    const t1 = toRad(center - halfTooth);
    const t2 = toRad(center + halfTooth);

    const ax = cx + Math.cos(t1) * innerR;
    const ay = cy + Math.sin(t1) * innerR;
    const bx = cx + Math.cos(t1) * outerR;
    const by = cy + Math.sin(t1) * outerR;
    const cx2 = cx + Math.cos(t2) * outerR;
    const cy2 = cy + Math.sin(t2) * outerR;
    const dx = cx + Math.cos(t2) * innerR;
    const dy = cy + Math.sin(t2) * innerR;

    if (i === 0) p += `M${fmt(ax)} ${fmt(ay)}`;
    else p += ` L${fmt(ax)} ${fmt(ay)}`;
    p += ` L${fmt(bx)} ${fmt(by)}`;
    p += ` L${fmt(cx2)} ${fmt(cy2)}`;
    p += ` L${fmt(dx)} ${fmt(dy)}`;

    // Arc along the gear body to the next tooth's left edge.
    const nextStart = toRad((i + 1) * 45 - halfTooth);
    const nx = cx + Math.cos(nextStart) * innerR;
    const ny = cy + Math.sin(nextStart) * innerR;
    p += ` A${innerR} ${innerR} 0 0 1 ${fmt(nx)} ${fmt(ny)}`;
  }
  return p + " Z";
}

const GEAR_PATH = buildGearPath();

export function GearshapeGlyph(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d={GEAR_PATH} />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

/**
 * xmark — two diagonal strokes forming an X. Inset 6px from each edge
 * so the visual weight matches the other glyphs in the set rather than
 * filling the full 24×24 viewBox.
 */
export function XmarkGlyph(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M6 6 L18 18" />
      <path d="M18 6 L6 18" />
    </svg>
  );
}
