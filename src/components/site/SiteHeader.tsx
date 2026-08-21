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
    <header className="sticky top-0 z-40 h-[56px] border-b border-accent/20 bg-secondary text-white shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
      <div className="mx-auto flex h-[56px] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:gap-6 lg:px-8">
        <Link to="/" className="shrink-0 text-white" aria-label="SwiftArc home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {nav.slice(1).map((item) => {
            const active =
              pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to as any}
                className={cn(
                  "relative flex h-[56px] items-center px-3 text-[14px] font-normal transition-colors",
                  active ? "text-white font-semibold" : "text-white/80 hover:text-white",
                )}
              >
                {item.tKey ? t(item.tKey) : item.label}
                {active && (
                  <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-sm bg-accent" />
                )}
              </Link>
            );
          })}
        </nav>

        <form
          onSubmit={onTrack}
          className="mx-auto hidden h-[36px] max-w-xs flex-1 items-center rounded-[4px] bg-white/15 px-3 text-white shadow-inner transition-colors focus-within:bg-white/20 md:flex"
        >
          <Search className="mr-2 h-4 w-4 text-white/70" aria-hidden />
          <input
            aria-label="Enter tracking number"
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            placeholder="Search tracking ID..."
            className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-white/60"
          />
        </form>

        <div className="hidden items-center gap-2 md:flex">
          <InstallPrompt />
          <button
            type="button"
            onClick={toggle}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className="grid h-9 w-9 place-items-center rounded-[4px] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        <button
          type="button"
          className="ml-auto grid h-9 w-9 place-items-center rounded-[4px] text-white hover:bg-white/10 lg:hidden"
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
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="border-t border-white/10 bg-secondary text-white shadow-lg lg:hidden overflow-hidden"
          >
            <nav className="mx-auto grid max-w-7xl gap-1 px-4 py-3" aria-label="Mobile">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to as any}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-[4px] px-3 py-2.5 text-[14px] font-medium text-white/90 hover:bg-white/10 transition-colors"
                >
                  {item.tKey ? t(item.tKey) : item.label}
                  <ChevronDown className="h-4 w-4 -rotate-90 text-white/60" />
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

