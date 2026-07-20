import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

interface SectionHeadProps {
  eyebrow: string;
  title: string;
  link?: { to: string; label: string };
  tone?: "light" | "dark";
  align?: "left" | "center";
}

export function SectionHead({
  eyebrow,
  title,
  link,
  tone = "dark",
  align = "center",
}: SectionHeadProps) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-end ${align === "center" ? "justify-between" : "justify-start"}`}>
      <div>
        <p className={`text-xs font-semibold uppercase tracking-widest ${tone === "light" ? "text-amber" : "text-amber"}`}>
          {eyebrow}
        </p>
        <h2 className={`mt-2 max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl ${tone === "light" ? "text-cream" : ""}`}>
          {title}
        </h2>
      </div>
      {link && (
        <Link
          to={link.to}
          className={`group inline-flex items-center gap-1 text-sm font-medium ${tone === "light" ? "text-cream" : "text-navy-deep"}`}
        >
          {link.label} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
