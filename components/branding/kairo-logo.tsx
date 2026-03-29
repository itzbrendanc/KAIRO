type KairoLogoProps = {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  stacked?: boolean;
};

const sizeMap = {
  sm: 34,
  md: 48,
  lg: 76
} as const;

export function KairoLogo({
  size = "md",
  showWordmark = true,
  stacked = false
}: KairoLogoProps) {
  const dimension = sizeMap[size];

  return (
    <div className={`kairo-lockup ${stacked ? "kairo-lockup-stacked" : ""}`}>
      <div className="kairo-mark" aria-hidden="true">
        <svg
          viewBox="0 0 120 120"
          width={dimension}
          height={dimension}
          role="img"
        >
          <defs>
            <linearGradient id="kairo-gold" x1="8%" y1="10%" x2="88%" y2="92%">
              <stop offset="0%" stopColor="#fff6d1" />
              <stop offset="42%" stopColor="#e1bc63" />
              <stop offset="100%" stopColor="#7b5a1a" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="112" height="112" rx="28" fill="#050505" stroke="rgba(255,255,255,0.12)" />
          <path
            d="M26 88L54 30L69 58L85 24L94 24L69 88L54 60L42 88Z"
            fill="url(#kairo-gold)"
          />
          <path
            d="M34 93C48 80 64 75 87 72"
            fill="none"
            stroke="#f6f2e8"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.92"
          />
          <circle cx="90" cy="70" r="7" fill="#f4cf73" />
        </svg>
      </div>
      {showWordmark ? (
        <div className="kairo-wordmark">
          <span className="kairo-name">KAIRO</span>
          <span className="kairo-tag">market intelligence</span>
        </div>
      ) : null}
    </div>
  );
}
