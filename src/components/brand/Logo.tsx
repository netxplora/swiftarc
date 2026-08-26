import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { Skeleton } from "@/components/ui/skeleton";

interface LogoProps {
  className?: string;
  tone?: "light" | "dark" | "auto";
  showWord?: boolean;
}

export function Logo({ className, tone = "auto", showWord = true }: LogoProps) {
  const { data: settings, isLoading } = usePlatformSettings();

  if (isLoading) {
    return <Skeleton className="h-8 w-24 rounded" />;
  }

  const logoLightUrl = settings?.visual_assets?.logoLight || settings?.visual_assets?.primaryLogo;
  const logoDarkUrl = settings?.visual_assets?.logoDark || settings?.visual_assets?.primaryLogo;
  const platformName = settings?.contact_info?.platformName || "SwiftArc";

  // Select logo based on tone
  const preferredLogo =
    tone === "light" ? logoLightUrl : tone === "dark" ? logoDarkUrl : logoLightUrl || logoDarkUrl;

  // If a custom logo is uploaded, prefer rendering it
  if (preferredLogo) {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
        <img src={preferredLogo} alt={`${platformName} logo`} className="h-8 object-contain" />
        {showWord && (
          <span
            className="font-display text-lg font-bold tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {platformName}
          </span>
        )}
      </div>
    );
  }

  // Fallback to SVG logo
  const stroke =
    tone === "light"
      ? "var(--color-cream, #FFF)"
      : tone === "dark"
        ? "var(--color-navy-deep, #0A192F)"
        : "currentColor";
  const accent = "var(--primary, #00A1E0)";

  return (
    <div className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden="true">
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
          className="font-display text-lg font-bold tracking-tight text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {platformName}
        </span>
      )}
    </div>
  );
}
