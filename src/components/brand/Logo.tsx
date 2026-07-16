interface LogoProps {
  className?: string;
  tone?: "light" | "dark";
  showWord?: boolean;
}

export function Logo({ className, tone = "dark", showWord = true }: LogoProps) {
  const stroke = tone === "light" ? "var(--color-cream)" : "var(--color-navy-deep)";
  const accent = "var(--color-amber)";
  return (
    <div className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <svg
        width="34"
        height="34"
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="20" cy="20" r="19" stroke={stroke} strokeWidth="1.5" opacity="0.15" />
        <path
          d="M6 28 Q 20 -2 34 24"
          stroke={accent}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="34" cy="24" r="3" fill={accent} />
        <circle cx="6" cy="28" r="1.6" fill={stroke} />
      </svg>
      {showWord && (
        <span
          className="font-display text-lg font-bold tracking-tight"
          style={{ color: stroke, fontFamily: "var(--font-display)" }}
        >
          Swift<span style={{ color: accent }}>Arc</span>
        </span>
      )}
    </div>
  );
}
