import Link from "next/link";
import { site } from "@/lib/content";

const leaves = [132, 154, 176, 198].map((deg) => {
  const rad = (deg * Math.PI) / 180;
  return {
    deg,
    x: 40 + Math.cos(rad) * 28.2,
    y: 38 + Math.sin(rad) * 28.2,
  };
});

export function Monogram({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <span className={`relative inline-block text-accent ${className}`} aria-hidden>
      <svg viewBox="0 0 80 80" className="h-full w-full" fill="none">
        <circle cx="40" cy="38" r="22.5" stroke="currentColor" strokeWidth="0.7" />
        <path
          d={`M ${leaves[0].x} ${leaves[0].y} C 22 56, 16 48, ${leaves[3].x} ${leaves[3].y}`}
          stroke="currentColor"
          strokeWidth="0.55"
          strokeLinecap="round"
        />
        {leaves.map((leaf) => (
          <g
            key={leaf.deg}
            transform={`translate(${leaf.x.toFixed(2)} ${leaf.y.toFixed(2)}) rotate(${leaf.deg - 90})`}
            stroke="currentColor"
            strokeWidth="0.55"
            strokeLinecap="round"
          >
            <ellipse cx="0" cy="-1" rx="2.3" ry="5" />
            <path d="M0 3.2V-5" />
          </g>
        ))}
        <text
          x="40"
          y="49"
          textAnchor="middle"
          fill="currentColor"
          fontSize="31"
          letterSpacing="-0.8"
          className="font-script"
          style={{ fontFamily: "var(--font-script-face), cursive" }}
        >
          RN
        </text>
      </svg>
    </span>
  );
}

export function BrandMark() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-3"
      aria-label="Росица Неделчева — начало"
    >
      <Monogram className="h-11 w-11 shrink-0" />
      <span className="hidden flex-col leading-tight sm:flex">
        <span className="font-display text-sm tracking-[0.16em] uppercase text-ink">
          {site.name}
        </span>
        <span className="text-[11px] text-mute">{site.tagline}</span>
      </span>
    </Link>
  );
}
