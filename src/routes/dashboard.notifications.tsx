import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, CheckCheck, Package, AlertTriangle, Truck, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  listNotifications, markNotificationRead, markAllNotificationsRead,
  getMyProfile, updateNotifPrefs,
} from "@/lib/api.functions";

export const Route = createFileRoute("/dashboard/notifications")({
  component: Notifications,
});

const filters = ["all", "unread", "read"] as const;
type F = (typeof filters)[number];

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

function relative(iso: string) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function Notifications() {
  const qc = useQueryClient();
  const fetchNotifs = useServerFn(listNotifications);
  const fetchProfile = useServerFn(getMyProfile);
  const markOne = useServerFn(markNotificationRead);
  const markAll = useServerFn(markAllNotificationsRead);
  const setPrefs = useServerFn(updateNotifPrefs);

  const [filter, setFilter] = useState<F>("all");

  const notifs = useQuery({ queryKey: ["notifications"], queryFn: () => fetchNotifs(), staleTime: Infinity });
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile(), staleTime: Infinity });

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes-notifs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => qc.invalidateQueries({ queryKey: ["notifications"] }))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const items = useMemo(() => {
    const list = notifs.data ?? [];
    if (filter === "unread") return list.filter((n) => !n.read);
    if (filter === "read") return list.filter((n) => n.read);
    return list;
  }, [notifs.data, filter]);

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

  const savePrefs = useMutation({
    mutationFn: (v: Partial<{ notif_email: boolean; notif_sms: boolean; notif_push: boolean; notif_marketing: boolean }>) => setPrefs({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Preferences saved");
    },
  });

  const prefs = profile.data ?? { notif_email: true, notif_sms: false, notif_push: true, notif_marketing: false };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {notifs.isLoading ? "Loading…" : `${unreadCount} unread of ${notifs.data?.length ?? 0}`}
          </p>
        </div>
        <button
          onClick={() => markAllMut.mutate()}
          disabled={unreadCount === 0 || markAllMut.isPending}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm hover:bg-secondary disabled:opacity-50"
        >
          <CheckCheck className="h-4 w-4" /> Mark all as read
        </button>
      </header>

      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === f ? "border-navy-deep bg-navy-deep text-cream" : "border-border bg-card hover:bg-secondary"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ul className="space-y-2">
          {notifs.isLoading && (
            <li className="grid place-items-center rounded-2xl border border-border bg-card py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </li>
          )}
          {!notifs.isLoading && items.length === 0 && (
            <li className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              <Bell className="mx-auto mb-2 h-6 w-6 opacity-50" />
              You're all caught up.
            </li>
          )}
          {items.map((n) => {
            const Icon = iconFor(n.category);
            return (
              <li key={n.id} className={`flex gap-4 rounded-2xl border p-4 ${n.read ? "border-border bg-card" : "border-amber/40 bg-amber/5"}`}>
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${toneClass(n.tone)}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-semibold">{n.title}</p>
                    <span className="text-xs text-muted-foreground">{relative(n.created_at)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                  <div className="mt-2">
                    <button
                      onClick={() => toggleRead.mutate({ id: n.id, read: !n.read })}
                      className="text-xs font-medium text-navy-deep hover:underline"
                    >
                      {n.read ? "Mark as unread" : "Mark as read"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg">Delivery preferences</h2>
          <p className="text-xs text-muted-foreground">Choose how we reach you. Synced across devices.</p>
          <div className="mt-4 space-y-3">
            {([
              ["notif_email", "Email"],
              ["notif_sms", "SMS"],
              ["notif_push", "Push"],
              ["notif_marketing", "Marketing"],
            ] as const).map(([k, label]) => (
              <label key={k} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-sm">{label}</span>
                <Switch
                  checked={!!prefs[k]}
                  onCheckedChange={(v) => savePrefs.mutate({ [k]: v })}
                />
              </label>
            ))}
          </div>
          {savePrefs.isPending && <p className="mt-2 text-xs text-muted-foreground">Saving…</p>}
        </aside>
      </div>
    </div>
  );
}
