import { Link, useNavigate } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Search, Bell, User, CheckCheck, Package, Truck, AlertTriangle, Info, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api.functions";
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
  const name = user?.user_metadata?.display_name || user?.email || "User";
  const initials = name.slice(0, 1).toUpperCase();
  const nav = useNavigate();
  const qc = useQueryClient();

  const fetchNotifs = useServerFn(listNotifications);
  const markOne = useServerFn(markNotificationRead);
  const markAll = useServerFn(markAllNotificationsRead);

  // We only really need to fetch unread notifs here, but we'll fetch all and filter for now to share cache with main page
  const notifs = useQuery({ queryKey: ["notifications"], queryFn: () => fetchNotifs(), staleTime: Infinity });

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes-header-notifs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => qc.invalidateQueries({ queryKey: ["notifications"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
    <div className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur shadow-sm">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-sm text-muted-foreground w-64 focus-within:border-amber focus-within:bg-background transition-colors">
          <Search className="h-4 w-4 shrink-0" />
          <input 
            type="text" 
            placeholder="Search tracking, invoices..." 
            className="bg-transparent outline-none w-full text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-card hover:bg-secondary transition-colors">
              <Bell className="h-4 w-4 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-amber border-2 border-background animate-pulse"></span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 rounded-xl overflow-hidden shadow-xl border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4 bg-secondary/30">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllMut.mutate()}
                  className="text-[10px] uppercase font-bold text-navy-deep hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-[350px] overflow-y-auto">
              {notifs.isLoading ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">You have no notifications.</div>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {items.map((n) => {
                    const Icon = iconFor(n.category);
                    return (
                      <div key={n.id} className={`flex gap-3 p-4 transition-colors hover:bg-secondary/50 cursor-pointer ${n.read ? 'opacity-70' : 'bg-amber/5'}`} onClick={() => nav({ to: "/dashboard/notifications/$id", params: { id: n.id } })}>
                        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${toneClass(n.tone)}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold truncate pr-2">{n.title}</p>
                            <span className="text-[10px] text-muted-foreground shrink-0">{relative(n.created_at)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{n.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="border-t border-border bg-secondary/30 p-2 text-center">
              <Link to="/dashboard/notifications" className="text-xs font-semibold text-navy-deep hover:underline p-2 inline-block w-full">
                View all notifications
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        <Link to="/dashboard/settings" className="flex items-center gap-2 rounded-full border border-border p-1 pr-3 hover:bg-secondary transition-colors">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-navy-deep text-xs font-semibold text-cream">
            {initials}
          </div>
          <span className="hidden sm:block text-xs font-semibold">{name}</span>
        </Link>
      </div>
    </div>
  );
}
