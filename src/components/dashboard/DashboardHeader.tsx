import { Link, useNavigate } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Search,
  Bell,
  User,
  CheckCheck,
  Package,
  Truck,
  AlertTriangle,
  Info,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api.functions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";

function relative(iso: string) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function iconFor(category: string) {
  if (category === "pickup") return Package;
  if (category === "shipment") return Truck;
  if (category === "exception") return AlertTriangle;
  return Info;
}

function toneClass(tone: string) {
  if (tone === "warning") return "bg-destructive/10 text-destructive";
  if (tone === "success") return "bg-success/15 text-success";
  return "bg-secondary text-navy-deep";
}

export function DashboardHeader() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const name = user?.user_metadata?.display_name || user?.email || "User";
  const initials = name.slice(0, 1).toUpperCase();
  const nav = useNavigate();
  const qc = useQueryClient();

  const fetchNotifs = useServerFn(listNotifications);
  const markOne = useServerFn(markNotificationRead);
  const markAll = useServerFn(markAllNotificationsRead);

  const notifs = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifs(),
    staleTime: Infinity,
  });

  useEffect(() => {
    const channel = supabase
      .channel("schema-db-changes-header-notifs")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () =>
        qc.invalidateQueries({ queryKey: ["notifications"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const items = useMemo(() => (notifs.data ?? []).slice(0, 5), [notifs.data]);
  const unreadCount = (notifs.data ?? []).filter((n) => !n.read).length;

  const toggleRead = useMutation({
    mutationFn: (v: { id: string; read: boolean }) => markOne({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMut = useMutation({
    mutationFn: () => markAll(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All caught up");
    },
  });

  return (
    <div className="sticky top-0 z-20 flex h-[56px] w-full items-center justify-between border-b border-border bg-white dark:bg-card px-4 shadow-[0_2px_4px_rgba(0,0,0,0.07)] dark:border-border">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="hidden sm:flex h-[36px] items-center gap-2 rounded-[4px] border border-border bg-muted px-3 text-[14px] text-muted-foreground w-64 focus-within:border-accent focus-within:bg-white transition-colors dark:bg-white/10 dark:border-white/20 dark:text-white">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground dark:text-white/70" />
          <input
            type="text"
            placeholder="Search tracking, invoices..."
            className="bg-transparent outline-none w-full text-[13px] text-secondary placeholder:text-muted-foreground dark:text-white dark:placeholder:text-white/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          className="relative grid h-9 w-9 place-items-center rounded-[4px] border border-border bg-white hover:bg-muted transition-colors text-secondary dark:bg-white/10 dark:border-white/20 dark:text-white"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <Popover>
          <PopoverTrigger asChild>
            <button className="relative grid h-9 w-9 place-items-center rounded-[4px] border border-border bg-white hover:bg-muted transition-colors dark:bg-white/10 dark:border-white/20">
              <Bell className="h-4 w-4 text-secondary dark:text-white" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent animate-pulse"></span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-80 p-0 rounded-[8px] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.12)] border-border bg-white dark:bg-secondary dark:border-white/20"
          >
            <div className="flex items-center justify-between border-b border-border p-4 bg-muted dark:bg-white/5 dark:border-white/10">
              <h3 className="font-bold text-[14px] text-secondary dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllMut.mutate()}
                  className="text-[11px] uppercase font-bold text-accent hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-[350px] overflow-y-auto">
              {notifs.isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-muted-foreground dark:text-white/70">
                  You have no notifications.
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-[#D8DDE6] dark:divide-white/10">
                  {items.map((n) => {
                    const Icon = iconFor(n.category);
                    return (
                      <div
                        key={n.id}
                        className={`flex gap-3 p-4 transition-colors hover:bg-muted dark:hover:bg-white/5 ${n.read ? "opacity-70" : "bg-accent/5"}`}
                      >
                        <div
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-[4px] ${toneClass(n.tone)}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[13px] font-semibold text-secondary dark:text-white truncate pr-2">{n.title}</p>
                            <span className="text-[11px] text-muted-foreground dark:text-white/60 shrink-0">
                              {relative(n.created_at)}
                            </span>
                          </div>
                          <p className="text-[12px] text-muted-foreground dark:text-white/70 line-clamp-1 mt-0.5">
                            {n.body}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="border-t border-border bg-muted p-2 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-wider dark:bg-white/5 dark:border-white/10 dark:text-white/70">
              All caught up
            </div>
          </PopoverContent>
        </Popover>

        <Link
          to="/admin/settings"
          className="flex items-center gap-2 rounded-full border border-border p-1 pr-3 hover:bg-muted transition-colors dark:border-white/20 dark:hover:bg-white/10"
        >
          <div className="grid h-7 w-7 place-items-center rounded-full bg-accent text-[12px] font-bold text-white">
            {initials}
          </div>
          <span className="hidden sm:block text-[13px] font-semibold text-secondary dark:text-white">{name}</span>
        </Link>
      </div>
    </div>
  );
}
