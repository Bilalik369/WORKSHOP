/**
 * Illustration du héros, recréée en SVG animé à partir de l'affiche :
 * un profil humain dont le cerveau est un réseau de neurones lumineux,
 * relié par des circuits à un livre ouvert d'où s'élèvent des particules.
 *
 * Tout est généré de façon déterministe (même rendu serveur et client).
 */

type Point = { x: number; y: number; r: number };

/** Générateur pseudo-aléatoire à graine fixe (mulberry32). */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (value: number) => Math.round(value * 10) / 10;

/** Nœuds du « cerveau » : répartis dans un dôme, espacés régulièrement. */
function buildBrain(): { nodes: Point[]; edges: [Point, Point][] } {
  const random = createRandom(20270102);
  const center = { x: 346, y: 176 };
  const radius = { x: 116, y: 90 };
  const nodes: Point[] = [];
  let attempts = 0;

  while (nodes.length < 58 && attempts < 6000) {
    attempts += 1;
    const x = center.x + (random() * 2 - 1) * radius.x;
    const y = center.y + (random() * 2 - 1) * radius.y;
    const nx = (x - center.x) / radius.x;
    const ny = (y - center.y) / radius.y;
    // Dôme : ellipse dont la base est légèrement aplatie.
    if (nx * nx + ny * ny > 1 || (ny > 0.72 && Math.abs(nx) > 0.55)) continue;
    if (nodes.some((node) => Math.hypot(node.x - x, node.y - y) < 23)) continue;
    nodes.push({ x: round(x), y: round(y), r: round(1.8 + random() * 2.4) });
  }

  const edges: [Point, Point][] = [];
  const seen = new Set<string>();
  nodes.forEach((node, index) => {
    nodes
      .map((other, otherIndex) => ({
        otherIndex,
        distance: Math.hypot(other.x - node.x, other.y - node.y),
      }))
      .filter((entry) => entry.otherIndex !== index && entry.distance < 58)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4)
      .forEach(({ otherIndex }) => {
        const key = [Math.min(index, otherIndex), Math.max(index, otherIndex)].join("-");
        if (seen.has(key)) return;
        seen.add(key);
        edges.push([node, nodes[otherIndex]]);
      });
  });

  return { nodes, edges };
}

/** Circuits imprimés descendant du cerveau vers le livre. */
function buildCircuits(): { d: string; start: { x: number; y: number } }[] {
  return Array.from({ length: 10 }, (_, i) => {
    const x0 = 322 + i * 12;
    const y0 = 250 + (i % 3) * 7;
    const y1 = 300 + i * 9;
    const jog = 22 + i * 3;
    const x1 = x0 - jog;
    const y2 = 452 + (i % 2) * 8;
    const x2 = 268 + i * 7;
    const y3 = y2 + Math.abs(x1 - x2);
    return {
      d: `M${x0} ${y0}V${y1}L${x1} ${y1 + jog}V${y2}L${x2} ${y3}V590`,
      start: { x: x0, y: y0 },
    };
  });
}

/** Faisceau lumineux jaillissant de la reliure du livre. */
function buildRays(): string[] {
  const rays: string[] = [];
  for (let k = -9; k <= 9; k += 1) {
    const angle = (k / 9) * 1.32;
    const length = 236 - Math.abs(k) * 5;
    const endX = 300 + Math.sin(angle) * length;
    const endY = 604 - Math.cos(angle) * length * 0.8;
    const controlX = 300 + Math.sin(angle) * 22;
    const controlY = 604 - 150;
    rays.push(`M300 604Q${round(controlX)} ${round(controlY)} ${round(endX)} ${round(endY)}`);
  }
  return rays;
}

/** Particules qui s'élèvent du livre. */
function buildParticles() {
  const random = createRandom(42);
  return Array.from({ length: 22 }, (_, index) => ({
    x: round(150 + random() * 300),
    y: round(500 + random() * 100),
    r: round(1.6 + random() * 2.8),
    dx: `${Math.round((random() * 2 - 1) * 50)}px`,
    delay: `${round(random() * 7)}s`,
    duration: `${round(5.5 + random() * 4.5)}s`,
    tone: index % 4 === 0 ? "mint" : index % 3 === 0 ? "lavender" : "azure",
  }));
}

/** Petits points « constellation » autour de la tête. */
function buildStars() {
  const random = createRandom(7);
  return Array.from({ length: 16 }, () => ({
    x: round(430 + random() * 150),
    y: round(40 + random() * 420),
    r: round(1.5 + random() * 4),
    opacity: round(0.25 + random() * 0.5),
  }));
}

const brain = buildBrain();
const circuits = buildCircuits();
const rays = buildRays();
const particles = buildParticles();
const stars = buildStars();

const HEAD_PATH =
  "M302 60C226 60 180 106 173 170c-1 15-6 26-13 38l-25 41c-5 8 2 14 15 13-5 8-8 14-4 20 4 4 4 8 1 12-4 6-1 14 3 20-4 16 2 32 22 36 28 6 56 0 68 2 12 28 16 68 10 128h156c-8-60-2-110 20-145 35-45 42-120 20-185-22-60-75-90-144-90z";

const TONES = {
  azure: "#5b8def",
  lavender: "#a99bf0",
  mint: "#3cc6b8",
} as const;

export function HeroVisual({ label, className }: { label: string; className?: string }) {
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 600 716"
      className={className}
      fill="none"
    >
      <defs>
        <radialGradient id="hv-halo" cx="0.5" cy="0.45" r="0.55">
          <stop offset="0" stopColor="#cfe0ff" stopOpacity="0.95" />
          <stop offset="0.6" stopColor="#dcd9ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#e9e4ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hv-head" x1="150" y1="120" x2="470" y2="420" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6ea5f4" />
          <stop offset="0.55" stopColor="#9fc2f8" />
          <stop offset="1" stopColor="#cbd2fb" />
        </linearGradient>
        <linearGradient id="hv-head-fade" x1="0" y1="340" x2="0" y2="500" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="hv-head-mask" maskUnits="userSpaceOnUse" x="100" y="40" width="400" height="460">
          <rect x="100" y="40" width="400" height="460" fill="url(#hv-head-fade)" />
        </mask>
        <radialGradient id="hv-brain-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.6" stopColor="#dbe9ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#dbe9ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hv-circuit" x1="0" y1="250" x2="0" y2="596" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#8fb6f7" />
          <stop offset="1" stopColor="#4f86ee" />
        </linearGradient>
        <linearGradient id="hv-ray" x1="0" y1="604" x2="0" y2="410" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4f86ee" stopOpacity="0.95" />
          <stop offset="1" stopColor="#a99bf0" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="hv-book-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#7fb0f8" stopOpacity="0.75" />
          <stop offset="1" stopColor="#7fb0f8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hv-page" x1="300" y1="520" x2="560" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#dfe9ff" />
          <stop offset="0.35" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eef2ff" />
        </linearGradient>
        <filter id="hv-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      {/* Halo circulaire derrière la tête */}
      <circle cx="345" cy="262" r="238" fill="url(#hv-halo)" />
      <circle cx="345" cy="262" r="238" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1.5" />

      {/* Constellation de points (à droite, comme sur l'affiche) */}
      <g className="animate-drift motion-reduce:animate-none">
        <path
          d="M455 70l52 38 40-30M507 108l28 60M470 420l60-34 34 44M530 386l22-70"
          stroke="#a9b8f5"
          strokeOpacity="0.55"
          strokeWidth="1"
        />
        {stars.map((star, index) => (
          <circle
            key={index}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill={index % 3 === 0 ? TONES.lavender : TONES.azure}
            opacity={star.opacity}
          />
        ))}
      </g>

      {/* Profil : la silhouette s'estompe au niveau du cou */}
      <g mask="url(#hv-head-mask)">
        <path d={HEAD_PATH} fill="url(#hv-head)" />
        <path d={HEAD_PATH} stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.5" />
      </g>

      {/* Cerveau en réseau de neurones */}
      <ellipse cx="346" cy="178" rx="138" ry="108" fill="url(#hv-brain-glow)" />
      <g stroke="#ffffff" strokeOpacity="0.8" strokeWidth="0.9">
        {brain.edges.map(([a, b], index) => (
          <line key={index} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        ))}
      </g>
      <g fill="#ffffff" filter="url(#hv-soft)" opacity="0.9">
        {brain.nodes.map((node, index) => (
          <circle key={index} cx={node.x} cy={node.y} r={node.r * 1.9} />
        ))}
      </g>
      <g fill="#ffffff">
        {brain.nodes.map((node, index) => (
          <circle
            key={index}
            cx={node.x}
            cy={node.y}
            r={node.r}
            className={
              index % 2 === 0
                ? "animate-pulse-node origin-center [transform-box:fill-box] motion-reduce:animate-none"
                : undefined
            }
            style={index % 2 === 0 ? { animationDelay: `${(index % 9) * 0.4}s` } : undefined}
          />
        ))}
      </g>

      {/* Circuits : du cerveau vers le livre */}
      <g stroke="url(#hv-circuit)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {circuits.map((circuit, index) => (
          <path key={index} d={circuit.d} opacity="0.85" />
        ))}
      </g>
      {/* Impulsions lumineuses parcourant les circuits */}
      <g
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="motion-hide motion-lite"
      >
        {circuits.map((circuit, index) => (
          <path
            key={index}
            d={circuit.d}
            strokeDasharray="14 126"
            className="animate-flow"
            style={{
              animationDelay: `${-index * 0.55}s`,
              animationDuration: `${4 + (index % 4) * 0.6}s`,
            }}
          />
        ))}
      </g>
      <g fill="#ffffff" stroke="#8fb6f7" strokeWidth="1">
        {circuits.map((circuit, index) =>
          index % 2 === 0 ? (
            <circle key={index} cx={circuit.start.x} cy={circuit.start.y} r="2.6" />
          ) : (
            <rect
              key={index}
              x={circuit.start.x - 2.5}
              y={circuit.start.y - 2.5}
              width="5"
              height="5"
              rx="1"
            />
          ),
        )}
      </g>

      {/* Faisceau lumineux jaillissant du livre */}
      <ellipse cx="300" cy="566" rx="170" ry="92" fill="url(#hv-book-glow)" />
      <g stroke="url(#hv-ray)" strokeWidth="1.1" strokeLinecap="round">
        {rays.map((d, index) => (
          <path key={index} d={d} />
        ))}
      </g>

      {/* Livre ouvert */}
      <g transform="translate(0 56)">
        {/* Ombre portée */}
        <ellipse cx="300" cy="632" rx="250" ry="14" fill="#0a2a8c" opacity="0.08" />
        {[0, 1].map((side) => (
          <g key={side} transform={side === 1 ? "translate(600 0) scale(-1 1)" : undefined}>
            {/* Couverture */}
            <path
              d="M300 626C352 598 452 592 566 616l-6-14C452 580 352 586 300 612z"
              fill="#3f7ff0"
            />
            {/* Tranche : feuilles superposées */}
            <path
              d="M300 612C352 586 452 580 560 602l-10-22C452 560 352 566 300 592z"
              fill="#dbe6ff"
            />
            <path
              d="M300 598C352 572 452 566 553 587M300 604C352 578 452 572 556 594"
              stroke="#8fb0f5"
              strokeWidth="1"
            />
            {/* Page */}
            <path
              d="M300 592C352 566 452 560 550 580l-26-56C440 504 344 510 300 536z"
              fill="url(#hv-page)"
            />
            <path
              d="M300 536C344 510 440 504 524 524"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M330 546c40-16 110-20 176-8M332 560c42-16 116-20 186-7"
              stroke="#c6d6fb"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.7"
            />
          </g>
        ))}
        {/* Reliure */}
        <path d="M300 536v56" stroke="#7fa6f6" strokeWidth="1.6" />
        <path d="M288 624q12 12 24 0" stroke="#2f6be6" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* Particules ascendantes */}
      <g className="motion-hide motion-lite">
        {particles.map((particle, index) => (
          <circle
            key={index}
            cx={particle.x}
            cy={particle.y}
            r={particle.r}
            fill={TONES[particle.tone as keyof typeof TONES]}
            className="animate-float-up opacity-0"
            style={
              {
                "--dx": particle.dx,
                animationDelay: particle.delay,
                animationDuration: particle.duration,
              } as React.CSSProperties
            }
          />
        ))}
      </g>
    </svg>
  );
}
