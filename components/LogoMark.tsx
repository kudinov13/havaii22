/** Фирменный знак Гавайи22: два домика-контура с окошками. Цвет — currentColor. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={className} aria-hidden="true">
      <path
        d="M10 72 L28 20 Q31 13 34 20 L52 66"
        stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M50 66 L77 9 Q80 3 83 9 L112 72"
        stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
      />
      <g fill="currentColor">
        <rect x="22" y="50" width="8" height="8" rx="1.5" />
        <rect x="33" y="50" width="8" height="8" rx="1.5" />
        <rect x="22" y="60" width="8" height="8" rx="1.5" />
        <rect x="33" y="60" width="8" height="8" rx="1.5" />
        <rect x="71" y="50" width="8" height="8" rx="1.5" />
        <rect x="82" y="50" width="8" height="8" rx="1.5" />
        <rect x="71" y="60" width="8" height="8" rx="1.5" />
        <rect x="82" y="60" width="8" height="8" rx="1.5" />
      </g>
    </svg>
  );
}
