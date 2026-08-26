/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Menu, X, Search, ChevronDown, Sun, Moon, PackageSearch, ChevronRight } from "lucide-react";
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
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { t } = useLocale();

  // Track scroll for header glass effect
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const onTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const id = track.trim();
    if (id) navigate({ to: "/tracking/$trackingId", params: { trackingId: id } });
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 h-[60px] transition-all duration-300",
        scrolled
          ? "bg-white/85 dark:bg-card/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm shadow-slate-200/40"
          : "bg-white dark:bg-card border-b border-border",
      )}
    >
      <div className="mx-auto flex h-[60px] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:gap-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="shrink-0 text-foreground" aria-label="SwiftArc home">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {nav.slice(1).map((item) => {
            const active =
              pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to as any}
                className={cn(
                  "relative flex h-[60px] items-center px-3.5 text-[14px] font-medium transition-colors",
                  active
                    ? "text-primary font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:text-[#032D60] dark:hover:text-white",
                )}
              >
                {item.tKey ? t(item.tKey) : item.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-2 bottom-0 h-[2.5px] rounded-t-sm bg-primary"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Tracking search (desktop) */}
        <form
          onSubmit={onTrack}
          className="mx-auto hidden h-[38px] max-w-xs flex-1 items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-muted/50 px-3 text-foreground transition-all focus-within:bg-white dark:focus-within:bg-muted focus-within:border-primary/40 focus-within:shadow-sm focus-within:ring-1 focus-within:ring-primary/20 md:flex"
        >
          <PackageSearch className="mr-2 h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
          <input
            aria-label="Enter tracking number"
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            placeholder="Track a shipment..."
            className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </form>

        {/* Right controls */}
        <div className="hidden items-center gap-2 md:flex">
          <InstallPrompt />
          <button
            type="button"
            onClick={toggle}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-slate-100 dark:hover:bg-muted hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link to="/contact">
            <button
              type="button"
              className="h-9 px-4 rounded-xl bg-primary text-white text-[13px] font-bold hover:bg-primary/90 transition-all hover:-translate-y-px shadow-sm hover:shadow-md hover:shadow-primary/20"
            >
              Get a Quote
            </button>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="ml-auto grid h-9 w-9 place-items-center rounded-xl text-foreground hover:bg-muted lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span
                key="x"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="h-5 w-5" />
              </motion.span>
            ) : (
              <motion.span
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Menu className="h-5 w-5" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="border-t border-border bg-white/95 dark:bg-card/95 backdrop-blur-xl text-foreground shadow-xl lg:hidden overflow-hidden"
          >
            <nav className="mx-auto grid max-w-7xl gap-1 px-4 py-3" aria-label="Mobile">
              {nav.map((item, i) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={item.to as any}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-4 py-3 text-[14px] font-medium transition-colors",
                      pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to))
                        ? "bg-primary/8 text-primary"
                        : "text-foreground hover:bg-slate-50 dark:hover:bg-muted",
                    )}
                  >
                    {item.tKey ? t(item.tKey) : item.label}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </motion.div>
              ))}
              <div className="mt-2 pt-2 border-t border-border">
                <Link to="/contact" onClick={() => setOpen(false)}>
                  <button
                    type="button"
                    className="w-full h-11 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                  >
                    Get a Quote
                  </button>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
