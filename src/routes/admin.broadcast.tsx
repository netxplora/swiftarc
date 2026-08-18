/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  adminBroadcastNotification,
  adminListBroadcasts,
  adminListUsers,
} from "@/lib/admin.functions";
import {
  Send,
  Activity,
  Users,
  User,
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/broadcast")({
  head: () => ({ meta: [{ title: "Admin — Broadcast" }, { name: "robots", content: "noindex" }] }),
  component: AdminBroadcast,
});

type Tone = "default" | "success" | "warning" | "danger";

const TONE_CONFIG: Record<Tone, { label: string; icon: React.ReactNode; color: string }> = {
  default: { label: "Info", icon: <Info className="h-3.5 w-3.5" />, color: "bg-blue-100 text-blue-800 border-blue-200" },
  success: { label: "Success", icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  warning: { label: "Warning", icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "bg-amber-100 text-amber-800 border-amber-200" },
  danger: { label: "Danger", icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "bg-red-100 text-red-800 border-red-200" },
};

function ToneBadge({ tone }: { tone: string }) {
  const cfg = TONE_CONFIG[tone as Tone] ?? TONE_CONFIG.default;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function AdminBroadcast() {
  const qc = useQueryClient();
  const broadcastFn = useServerFn(adminBroadcastNotification);
  const listBroadcasts = useServerFn(adminListBroadcasts);
  const listUsers = useServerFn(adminListUsers);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tone, setTone] = useState<Tone>("default");
  const [target, setTarget] = useState<"all" | "user">("all");
  const [targetUserId, setTargetUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const historyQ = useQuery({
    queryKey: ["admin-broadcasts"],
    queryFn: () => listBroadcasts(),
  });

  const usersQ = useQuery({
    queryKey: ["admin-users-broadcast"],
    queryFn: () => listUsers(),
    enabled: target === "user",
  });

  const filteredUsers = (usersQ.data ?? []).filter((u: any) =>
    !userSearch ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const mut = useMutation({
    mutationFn: () =>
      broadcastFn({
        data: {
          title,
          body,
          tone,
          category: "announcement",
          ...(target === "user" && targetUserId ? { targetUserId } : {}),
        },
      }),
    onSuccess: (r) => {
      toast.success(`Sent to ${r.sent} user${r.sent === 1 ? "" : "s"}`);
      setTitle("");
      setBody("");
      setTargetUserId("");
      setUserSearch("");
      qc.invalidateQueries({ queryKey: ["admin-broadcasts"] });
    },
    onError: () => toast.error("Broadcast failed. Please try again."),
  });

  const charCount = body.length;
  const isValid = title.trim().length > 0 && body.trim().length > 0 && (target === "all" || !!targetUserId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Broadcast</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Send in-app notifications to all users or a specific customer.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bell className="h-4 w-4" />
          <span>{historyQ.data?.length ?? 0} broadcasts sent</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Compose Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4" /> Compose Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Targeting */}
            <div className="space-y-2">
              <Label>Send To</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setTarget("all")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    target === "all"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <Users className="h-4 w-4" /> All Users
                </button>
                <button
                  type="button"
                  onClick={() => setTarget("user")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    target === "user"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <User className="h-4 w-4" /> Specific User
                </button>
              </div>
            </div>

            {/* User Selector */}
            {target === "user" && (
              <div className="space-y-2">
                <Label>Select User</Label>
                {usersQ.isLoading ? (
                  <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading users...
                  </div>
                ) : (
                  <>
                    <Input
                      placeholder="Search by name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                    <div className="max-h-40 overflow-y-auto rounded-md border border-border divide-y divide-border">
                      {filteredUsers.slice(0, 20).map((u: any) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => { setTargetUserId(u.id); setUserSearch(u.email || u.display_name || ""); }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-muted/50 ${targetUserId === u.id ? "bg-primary/5 font-medium" : ""}`}
                        >
                          <span className="block">{u.display_name || "No name"}</span>
                          <span className="text-xs text-muted-foreground">{u.email}</span>
                        </button>
                      ))}
                      {filteredUsers.length === 0 && (
                        <p className="px-3 py-4 text-xs text-muted-foreground text-center">No users found.</p>
                      )}
                    </div>
                    {targetUserId && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> User selected
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="broadcast-title">Title *</Label>
              <Input
                id="broadcast-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scheduled maintenance"
                maxLength={200}
              />
            </div>

            {/* Body */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="broadcast-body">Message *</Label>
                <span className="text-xs text-muted-foreground">{charCount}/2000</span>
              </div>
              <Textarea
                id="broadcast-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message here..."
                rows={5}
                maxLength={2000}
              />
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <Label>Tone</Label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(TONE_CONFIG) as Tone[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                      tone === t
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {TONE_CONFIG[t].icon}
                    {TONE_CONFIG[t].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {title && body && (
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Preview</p>
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{body}</p>
                  </div>
                  <ToneBadge tone={tone} />
                </div>
              </div>
            )}

            <Button
              onClick={() => mut.mutate()}
              disabled={!isValid || mut.isPending}
              className="w-full bg-navy-deep text-cream hover:bg-navy"
            >
              {mut.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" />
                  {target === "all" ? "Send to All Users" : "Send to User"}</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Broadcast History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {historyQ.isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (historyQ.data ?? []).length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No broadcasts sent yet.
              </div>
            ) : (
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {(historyQ.data ?? []).map((n: any) => (
                  <div key={n.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold truncate">{n.title}</p>
                      <ToneBadge tone={n.tone} />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(n.created_at), "MMM d, yyyy · HH:mm")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
