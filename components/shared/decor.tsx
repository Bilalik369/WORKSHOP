import { useId } from "react";
import { cn } from "@/lib/utils";

const TILE = 96;
const OUTER = 30;
/** Rayon intérieur d'une étoile à huit branches formée de deux carrés. */
const INNER = OUTER * 0.7654;

/** Contour d'une étoile à huit branches centrée en (cx, cy). */
function star(cx: number, cy: number): string {
  return Array.from({ length: 16 }, (_, index) => {
    const radius = index % 2 === 0 ? OUTER : INNER;
    const angle = (index * Math.PI) / 8;
    const x = (cx + Math.sin(angle) * radius).toFixed(1);
    const y = (cy - Math.cos(angle) * radius).toFixed(1);
    return `${index === 0 ? "M" : "L"}${x} ${y}`;
  })
    .join("")
    .concat("Z");
}

const STARS = [
  star(TILE / 2, TILE / 2),
  star(0, 0),
  star(TILE, 0),
  star(0, TILE),
  star(TILE, TILE),
].join("");

/** Entrelacs : filets reliant les pointes des étoiles voisines. */
const DIAGONAL = (OUTER * Math.SQRT1_2).toFixed(1);
const FAR = (TILE / 2 - OUTER * Math.SQRT1_2).toFixed(1);
const LINKS = [
  `M${TILE / 2} ${TILE / 2 - OUTER}V${OUTER}`,
  `M${TILE / 2} ${TILE / 2 + OUTER}V${TILE - OUTER}`,
  `M${TILE / 2 - OUTER} ${TILE / 2}H${OUTER}`,
  `M${TILE / 2 + OUTER} ${TILE / 2}H${TILE - OUTER}`,
  `M${DIAGONAL} ${DIAGONAL}L${FAR} ${FAR}`,
  `M${TILE - Number(DIAGONAL)} ${DIAGONAL}L${TILE - Number(FAR)} ${FAR}`,
  `M${DIAGONAL} ${TILE - Number(DIAGONAL)}L${FAR} ${TILE - Number(FAR)}`,
  `M${TILE - Number(DIAGONAL)} ${TILE - Number(DIAGONAL)}L${TILE - Number(FAR)} ${TILE - Number(FAR)}`,
].join("");

/**
 * Motif géométrique marocain (étoiles à huit branches, façon zellige),
 * tracé en filets très légers et estompé vers l'extérieur — comme dans
 * les angles de l'affiche.
 */
export function ZelligePattern({ className }: { className?: string }) {
  const id = useId();
  const patternId = `zellige-${id}`;
  const fadeId = `zellige-fade-${id}`;
  const maskId = `zellige-mask-${id}`;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={cn("pointer-events-none absolute text-azure", className)}
      width="560"
      height="560"
      viewBox="0 0 560 560"
      fill="none"
    >
      <defs>
        <pattern id={patternId} width={TILE} height={TILE} patternUnits="userSpaceOnUse">
          <path d={STARS} stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
          <path d={LINKS} stroke="currentColor" strokeWidth="1" />
          <circle cx={TILE / 2} cy={TILE / 2} r="9" stroke="currentColor" strokeWidth="1" />
          <circle cx="0" cy="0" r="9" stroke="currentColor" strokeWidth="1" />
          <circle cx={TILE} cy="0" r="9" stroke="currentColor" strokeWidth="1" />
          <circle cx="0" cy={TILE} r="9" stroke="currentColor" strokeWidth="1" />
          <circle cx={TILE} cy={TILE} r="9" stroke="currentColor" strokeWidth="1" />
        </pattern>
        <radialGradient id={fadeId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={maskId}>
          <rect width="560" height="560" fill={`url(#${fadeId})`} />
        </mask>
      </defs>
      <rect width="560" height="560" fill={`url(#${patternId})`} mask={`url(#${maskId})`} />
    </svg>
  );
}
