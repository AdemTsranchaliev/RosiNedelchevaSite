type IconProps = {
  className?: string;
};

export function IconLeaf({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <path
        d="M24 34V16M24 16c-4 2-8 7-8 12 0 5 3.5 8 8 8s8-3 8-8c0-5-4-10-8-12Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconFlower({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <circle cx="24" cy="24" r="3" stroke="currentColor" strokeWidth="1.4" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <ellipse
          key={deg}
          cx="24"
          cy="14"
          rx="3.2"
          ry="5.5"
          stroke="currentColor"
          strokeWidth="1.2"
          transform={`rotate(${deg} 24 24)`}
        />
      ))}
    </svg>
  );
}

export function IconTree({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <path
        d="M24 34V22M18 34h12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="24" cy="18" r="7" stroke="currentColor" strokeWidth="1.3" strokeDasharray="1.5 2" />
    </svg>
  );
}

export function IconSun({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <path
        d="M12 30h24M16 26c2.5-5 5.5-8 8-8s5.5 3 8 8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M24 14v3M18 16l1.5 2.5M30 16l-1.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IconLotus({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <path
        d="M24 32c-3-4-8-6-11-6 2 5 6 9 11 10 5-1 9-5 11-10-3 0-8 2-11 6Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M24 30c-2-5-2-10 0-14 2 4 2 9 0 14Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconHandsHeart({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <path
        d="M16 28c0-3 2-5 5-5 1.5 0 2.5.5 3 1.2.5-.7 1.5-1.2 3-1.2 3 0 5 2 5 5 0 4-5 7-8 9-3-2-8-5-8-9Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M14 26c-1.5 1-2.5 3-2.5 5S14 36 17 37M34 26c1.5 1 2.5 3 2.5 5S34 36 31 37"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconTruck({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <path
        d="M6 30V14h24v16M30 20h8l4 6v4H30"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="34" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="34" cy="34" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function IconShield({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <path
        d="M24 8 10 14v10c0 9 6 14 14 16 8-2 14-7 14-16V14L24 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="m18 24 4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconUsers({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <circle cx="18" cy="18" r="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="31" cy="20" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 36c1.5-5 5-8 10-8s8.5 3 10 8M28 30c3.5.5 6.5 2.5 8 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconSpark({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <path
        d="M24 8v8M24 32v8M8 24h8M32 24h8M13 13l5.5 5.5M29.5 29.5 35 35M35 13l-5.5 5.5M18.5 29.5 13 35"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export const sectionIcons = [
  IconLeaf,
  IconFlower,
  IconTree,
  IconSun,
  IconLotus,
  IconHandsHeart,
] as const;
