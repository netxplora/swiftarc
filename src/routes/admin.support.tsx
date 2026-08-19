import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useRef } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  X,
  User,
  UserRound,
  CircleDot,
  Archive,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminListConversations,
  adminListMessages,
  adminSendMessage,
  adminCloseConversation,
} from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

export const Route = createFileRoute("/admin/support")({
  component: AdminSupport,
});

type Conversation = {
  id: string;
  user_id: string | null;
  guest_id: string | null;
  subject: string | null;
  status: string;
  last_message_at: string | null;
  created_at: string;
};

type Msg = {
  id: string;
  sender_id: string | null;
  sender_role: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

function AdminSupport() {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const listConvos = useServerFn(adminListConversations);
  const fetchMsgs = useServerFn(adminListMessages);
  const postMsg = useServerFn(adminSendMessage);
  const closeFn = useServerFn(adminCloseConversation);

  const convos = useQuery({
    queryKey: ["admin-chats"],
    queryFn: () => listConvos(),
    refetchInterval: 10_000,
  });

  const msgs = useQuery({
    queryKey: ["admin-chat-msgs", activeId],
    enabled: !!activeId,
    queryFn: () => fetchMsgs({ data: { conversationId: activeId! } }),
  });

  // Realtime: new messages arrive
  useEffect(() => {
    if (!activeId) return;
    const channel = supabase
      .channel(`admin-chat-${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["admin-chat-msgs", activeId] });
          qc.invalidateQueries({ queryKey: ["admin-chats"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId, qc]);

  // Realtime: new conversations appear
  useEffect(() => {
    const channel = supabase
      .channel("admin-chat-convos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_conversations" },
        () => qc.invalidateQueries({ queryKey: ["admin-chats"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (activeId && msgs.data) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [msgs.data, activeId]);

  // Focus input when conversation is selected
  useEffect(() => {
    if (activeId) inputRef.current?.focus();
  }, [activeId]);

  const send = useMutation({
    mutationFn: (body: string) =>
      postMsg({ data: { conversationId: activeId!, body } }),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["admin-chat-msgs", activeId] });
      qc.invalidateQueries({ queryKey: ["admin-chats"] });
    },
  });

  const close = useMutation({
    mutationFn: () => closeFn({ data: { conversationId: activeId! } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-chats"] });
      qc.invalidateQueries({ queryKey: ["admin-chat-msgs", activeId] });
    },
  });

  // Filtered and searched conversations
  const filteredConvos = (convos.data ?? []).filter((c: Conversation) => {
    if (filter === "open" && c.status !== "open") return false;
    if (filter === "closed" && c.status !== "closed") return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (c.subject ?? "").toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeConvo = (convos.data ?? []).find(
    (c: Conversation) => c.id === activeId,
  );

  const openCount = (convos.data ?? []).filter(
    (c: Conversation) => c.status === "open",
  ).length;

  return (
    <div className="grid h-[calc(100vh-theme(spacing.16))] grid-cols-1 md:grid-cols-[340px_1fr] border border-border rounded-xl overflow-hidden bg-card">
      {/* ─── Sidebar ─── */}
      <div className="flex flex-col border-r border-border bg-background">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-amber" /> Support Chat
            </h2>
            {openCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber/15 px-2.5 py-0.5 text-xs font-semibold text-amber-deep">
                <CircleDot className="h-3 w-3" />
                {openCount} open
              </span>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 p-0.5 bg-secondary/30 rounded-lg">
            {(["all", "open", "closed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "flex-1 text-xs font-medium py-1.5 rounded-md transition-all capitalize",
                  filter === f
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConvos.map((c: Conversation) => {
            const isGuest = !!c.guest_id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={cn(
                  "w-full text-left p-4 border-b border-border hover:bg-secondary/50 transition-colors",
                  activeId === c.id && "bg-secondary",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full",
                      isGuest
                        ? "bg-secondary text-muted-foreground"
                        : "bg-amber/15 text-amber-deep",
                    )}
                  >
                    {isGuest ? (
                      <UserRound className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-semibold text-sm truncate max-w-[180px]">
                        {c.subject || "Support Chat"}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {c.last_message_at && (
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(c.last_message_at), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {isGuest ? "Guest" : "User"} •{" "}
                        {c.id.split("-")[0]}
                      </span>
                      {c.status === "open" ? (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {filteredConvos.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {search ? "No matching conversations." : "No conversations yet."}
            </div>
          )}
        </div>
      </div>

      {/* ─── Main Chat Area ─── */}
      <div className="flex flex-col h-full bg-secondary/10">
        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 opacity-20 mb-4" />
            <p className="text-sm">Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border bg-background flex justify-between items-center gap-4">
              <div className="min-w-0">
                <h3 className="font-medium text-sm truncate">
                  {activeConvo?.subject || "Support Chat"}
                </h3>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  {activeConvo?.guest_id ? (
                    <UserRound className="h-3 w-3 inline" />
                  ) : (
                    <User className="h-3 w-3 inline" />
                  )}
                  {activeConvo?.guest_id ? "Guest" : "Registered user"} •{" "}
                  {activeConvo?.status === "open" ? (
                    <span className="text-emerald-600 font-medium">Open</span>
                  ) : (
                    <span className="text-muted-foreground">Closed</span>
                  )}
                </p>
              </div>
              {activeConvo?.status === "open" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => close.mutate()}
                  disabled={close.isPending}
                  className="text-xs gap-1.5 shrink-0"
                >
                  <Archive className="h-3.5 w-3.5" />
                  Close
                </Button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence initial={false}>
                {msgs.data?.map((m: Msg, i: number, arr: Msg[]) => {
                  const isAdmin =
                    m.sender_role === "agent" || m.sender_role === "admin";
                  const isSystem = m.sender_role === "system";
                  const prevMsg = i > 0 ? arr[i - 1] : null;
                  const showLabel =
                    !prevMsg || prevMsg.sender_role !== m.sender_role;

                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex flex-col",
                        isSystem
                          ? "items-center"
                          : isAdmin
                            ? "items-end"
                            : "items-start",
                      )}
                    >
                      {showLabel && !isSystem && (
                        <span className="text-[10px] font-semibold text-muted-foreground mb-1 px-1">
                          {isAdmin ? "You (Admin)" : "Customer"}
                        </span>
                      )}
                      <div
                        className={cn(
                          isSystem &&
                            "max-w-[80%] rounded-xl bg-secondary px-4 py-2 text-xs text-muted-foreground text-center my-2",
                          !isSystem &&
                            isAdmin &&
                            "max-w-[70%] rounded-2xl rounded-br-sm bg-navy-deep px-4 py-2.5 text-sm text-cream",
                          !isSystem &&
                            !isAdmin &&
                            "max-w-[70%] rounded-2xl rounded-bl-sm bg-background border border-border px-4 py-2.5 text-sm text-foreground shadow-sm",
                        )}
                      >
                        {m.body}
                        {!isSystem && (
                          <div
                            className={cn(
                              "text-[10px] mt-1",
                              isAdmin
                                ? "text-cream/50 text-right"
                                : "text-muted-foreground",
                            )}
                          >
                            {format(new Date(m.created_at), "HH:mm")}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={endRef} />
            </div>

            {/* Input */}
            {activeConvo?.status === "open" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (text.trim()) send.mutate(text.trim());
                }}
                className="p-3 border-t border-border bg-background flex gap-2 items-center"
              >
                <input
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your reply…"
                  disabled={send.isPending}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber/40 transition-shadow"
                />
                <Button
                  type="submit"
                  disabled={!text.trim() || send.isPending}
                  size="icon"
                  className="bg-amber text-navy-deep hover:bg-amber-soft h-10 w-10"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <div className="p-3 border-t border-border bg-secondary/30 text-center text-sm text-muted-foreground">
                This conversation is closed.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
