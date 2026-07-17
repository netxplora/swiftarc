import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Menu, X, Search, ChevronDown, Sun, Moon, Bell, LayoutDashboard, CheckCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { listNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api.functions";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const nav = [
  { to: "/", label: "Home" },
  { to: "/shipping", label: "Shipping" },
  { to: "/tracking", label: "Tracking" },
  { to: "/rates", label: "Rates" },
  { to: "/pickup", label: "Pickup" },
  { to: "/about", label: "About Us" },
  { to: "/support", label: "Support" },
] as const;

function relative(iso: string) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function NotificationBell() {
  const qc = useQueryClient();
  const fetchNotifs = useServerFn(listNotifications);
  const markOne = useServerFn(markNotificationRead);
  const markAll = useServerFn(markAllNotificationsRead);

  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifs(),
    refetchInterval: 60_000,
  });
  const items = (q.data ?? []).slice(0, 6);
  const unread = (q.data ?? []).filter((n) => !n.read).length;

  const readMut = useMutation({
    mutationFn: (id: string) => markOne({ data: { id, read: true } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const allMut = useMutation({
    mutationFn: () => markAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-amber px-1 text-[10px] font-bold text-navy-deep">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unread > 0 && (
            <button onClick={() => allMut.mutate()} className="inline-flex items-center gap-1 text-xs font-medium text-amber hover:underline">
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">No notifications yet.</p>
        )}
        {items.map((n) => (
          <div key={n.id} className={`flex flex-col gap-1 px-3 py-2 ${!n.read ? "bg-amber/5" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium">{n.title}</span>
              <span className="whitespace-nowrap text-[10px] text-muted-foreground">{relative(n.created_at)}</span>
            </div>
            <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
            {!n.read && (
              <button
                onClick={(e) => { e.preventDefault(); readMut.mutate(n.id); }}
                className="self-start text-[11px] font-medium text-navy-deep hover:underline"
              >
                Mark as read
              </button>
            )}
          </div>
        ))}
        <DropdownMenuSeparator />
        <Link to="/dashboard/notifications" className="block px-3 py-2 text-center text-sm font-medium text-amber hover:bg-secondary">
          View all
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [track, setTrack] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { signedIn } = useAuth();

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
            const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <Link key={item.to} to={item.to} className={cn(
                "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}>
                {item.label}
                {active && <span className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-amber" />}
              </Link>
            );
          })}
        </nav>

        <form onSubmit={onTrack} className="hidden items-center rounded-full border border-border bg-card px-3 py-1.5 shadow-sm md:flex">
          <Search className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden />
          <input aria-label="Enter tracking number" value={track} onChange={(e) => setTrack(e.target.value)}
            placeholder="Track a shipment"
            className="w-40 bg-transparent text-sm outline-none placeholder:text-muted-foreground xl:w-48" />
        </form>

        <div className="hidden items-center gap-1 md:flex">
          <button type="button" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {signedIn && <NotificationBell />}

          {signedIn ? (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard"><LayoutDashboard className="mr-1 h-4 w-4" /> Dashboard</Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Log in</Link>
            </Button>
          )}
          <Button size="sm" className="bg-navy-deep text-cream hover:bg-navy" asChild>
            <Link to={signedIn ? "/shipping" : "/register"}>{signedIn ? "New shipment" : "Open account"}</Link>
          </Button>
        </div>

        <button type="button" className="ml-auto grid h-11 w-11 place-items-center rounded-md lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)}>
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
                <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-md px-3 py-3 text-sm font-medium hover:bg-secondary transition-colors">
                  {item.label}
                  <ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground" />
                </Link>
              ))}
              <div className="mt-2 flex gap-2 border-t border-border pt-3">
                <Button variant="outline" className="flex-1" asChild>
                  <Link to={signedIn ? "/dashboard" : "/login"} onClick={() => setOpen(false)}>{signedIn ? "Dashboard" : "Log in"}</Link>
                </Button>
                <Button className="flex-1 bg-navy-deep text-cream transition-colors hover:bg-navy" asChild>
                  <Link to={signedIn ? "/shipping" : "/register"} onClick={() => setOpen(false)}>{signedIn ? "New shipment" : "Open account"}</Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
