/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Menu, X, Search, ChevronDown, Sun, Moon } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { useLocale } from "@/hooks/use-locale";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

const nav = [
  { to: "/", label: "Home", tKey: "nav.home" },
  { to: "/tracking", label: "Tracking", tKey: "nav.tracking" },
  { to: "/about", label: "About Us", tKey: "nav.about" },
  { to: "/support", label: "Support", tKey: "nav.support" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [track, setTrack] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { t } = useLocale();

  const onTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const id = track.trim();
    if (id) navigate({ to: "/tracking/$trackingId", params: { trackingId: id } });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:gap-6 lg:px-8">
        <Link to="/" className="shrink-0" aria-label="SwiftArc home">
          <Logo />
        </Link>

        <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="Main">
          {nav.slice(1).map((item) => {
            const active =
              pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to as any}
                className={cn(
                  "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.tKey ? t(item.tKey) : item.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-amber" />
                )}
              </Link>
            );
          })}
        </nav>

        <form
          onSubmit={onTrack}
          className="hidden items-center rounded-full border border-border bg-card px-3 py-1.5 shadow-sm md:flex"
        >
          <Search className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            aria-label="Enter tracking number"
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            placeholder="Track a shipment"
            className="w-40 bg-transparent text-sm outline-none placeholder:text-muted-foreground xl:w-48"
          />
        </form>

        <div className="hidden items-center gap-1 md:flex">
          <InstallPrompt />
          <button
            type="button"
            onClick={toggle}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        <button
          type="button"
          className="ml-auto grid h-11 w-11 place-items-center rounded-md lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="border-t border-border/60 bg-background lg:hidden overflow-hidden"
          >
            <nav className="mx-auto grid max-w-7xl gap-1 px-4 py-4" aria-label="Mobile">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to as any}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-md px-3 py-3 text-sm font-medium hover:bg-secondary transition-colors"
                >
                  {item.tKey ? t(item.tKey) : item.label}
                  <ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground" />
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
