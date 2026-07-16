import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminListConversations, listMessages, sendMessage } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/support")({
  component: AdminSupport,
});

type Conversation = {
  id: string;
  user_id: string;
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
};

function AdminSupport() {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const listConvos = useServerFn(adminListConversations);
  const fetchMsgs = useServerFn(listMessages);
  const postMsg = useServerFn(sendMessage);

  const convos = useQuery({
    queryKey: ["admin-chats"],
    queryFn: () => listConvos(),
    refetchInterval: 10000,
  });

  const msgs = useQuery({
    queryKey: ["admin-chat-msgs", activeId],
    enabled: !!activeId,
    queryFn: () => fetchMsgs({ data: { conversationId: activeId! } }),
  });

  useEffect(() => {
    if (!activeId) return;
    const channel = supabase
      .channel(`admin-chat-${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${activeId}` },
        () => qc.invalidateQueries({ queryKey: ["admin-chat-msgs", activeId] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeId, qc]);

  useEffect(() => {
    if (activeId && msgs.data) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [msgs.data, activeId]);

  const send = useMutation({
    mutationFn: (body: string) => postMsg({ data: { conversationId: activeId!, body } }),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["admin-chat-msgs", activeId] });
      qc.invalidateQueries({ queryKey: ["admin-chats"] });
    },
  });

  return (
    <div className="grid h-[calc(100vh-theme(spacing.16))] grid-cols-1 md:grid-cols-[300px_1fr] border border-border rounded-xl overflow-hidden bg-card">
      {/* Sidebar */}
      <div className="flex flex-col border-r border-border bg-background">
        <div className="p-4 border-b border-border">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber" /> Live Chat Support
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {convos.data?.map((c: Conversation) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`w-full text-left p-4 border-b border-border hover:bg-secondary/50 transition-colors ${activeId === c.id ? "bg-secondary" : ""}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-sm truncate">{c.subject}</span>
                {c.last_message_at && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {format(new Date(c.last_message_at), "HH:mm")}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono truncate max-w-[150px]">{c.id.split("-")[0]}</span>
                {c.status === "open" ? (
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                ) : (
                  <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            </button>
          ))}
          {convos.data?.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">No active conversations.</div>
          )}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-col h-full bg-secondary/10">
        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 opacity-20 mb-4" />
            <p>Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-border bg-background flex justify-between items-center">
              <div>
                <h3 className="font-medium text-sm">Conversation</h3>
                <p className="text-xs text-muted-foreground font-mono">{activeId}</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {msgs.data?.map((m: Msg) => {
                const isAdmin = m.sender_role === "agent" || m.sender_role === "admin";
                const isSystem = m.sender_role === "system";
                return (
                  <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                    <div
                      className={
                        isSystem
                          ? "max-w-[80%] rounded-xl bg-secondary px-4 py-2 text-xs text-muted-foreground"
                          : isAdmin
                          ? "max-w-[70%] rounded-2xl rounded-br-sm bg-navy-deep px-4 py-2 text-sm text-cream"
                          : "max-w-[70%] rounded-2xl rounded-bl-sm bg-background border border-border px-4 py-2 text-sm text-foreground shadow-sm"
                      }
                    >
                      {m.body}
                      {!isSystem && (
                        <div className={`text-[10px] mt-1 ${isAdmin ? "text-cream/50 text-right" : "text-muted-foreground"}`}>
                          {format(new Date(m.created_at), "HH:mm")}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (text.trim()) send.mutate(text.trim());
              }}
              className="p-3 border-t border-border bg-background flex gap-2 items-center"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your reply..."
                disabled={send.isPending}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-amber"
              />
              <Button type="submit" disabled={!text.trim() || send.isPending} size="icon" className="bg-amber text-navy-deep hover:bg-amber-soft">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
