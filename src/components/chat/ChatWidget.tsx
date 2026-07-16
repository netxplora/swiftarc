import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Send, X, Headphones } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getOrCreateConversation, listMessages, sendMessage } from "@/lib/chat.functions";
import { Button } from "@/components/ui/button";

type Msg = {
  id: string;
  sender_id: string | null;
  sender_role: string;
  body: string;
  created_at: string;
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { signedIn, user } = useAuth();
  const [text, setText] = useState("");
  const qc = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const startConvo = useServerFn(getOrCreateConversation);
  const fetchMsgs = useServerFn(listMessages);
  const postMsg = useServerFn(sendMessage);

  const convo = useQuery({
    queryKey: ["chat", "convo", user?.id],
    enabled: open && !!signedIn,
    queryFn: () => startConvo(),
    staleTime: 60_000,
  });

  const msgs = useQuery({
    queryKey: ["chat", "msgs", convo.data?.id],
    enabled: !!convo.data?.id,
    queryFn: () => fetchMsgs({ data: { conversationId: convo.data!.id } }),
  });

  // Realtime subscription
  useEffect(() => {
    if (!convo.data?.id) return;
    const channel = supabase
      .channel(`chat-${convo.data.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${convo.data.id}` },
        () => qc.invalidateQueries({ queryKey: ["chat", "msgs", convo.data!.id] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [convo.data?.id, qc]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.data, open]);

  const send = useMutation({
    mutationFn: (body: string) => postMsg({ data: { conversationId: convo.data!.id, body } }),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["chat", "msgs", convo.data?.id] });
    },
  });

  return (
    <>
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.4 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open live chat"
        className="fixed bottom-20 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-amber text-navy-deep shadow-2xl ring-4 ring-amber/20 lg:bottom-6"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-36 right-4 z-40 flex h-[70vh] max-h-[560px] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl lg:bottom-24"
            role="dialog"
            aria-label="SwiftArc Support Chat"
          >
            <div className="flex items-center gap-3 border-b border-border bg-navy-deep px-4 py-3 text-cream">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-amber text-navy-deep">
                <Headphones className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">SwiftArc Support</p>
                <p className="flex items-center gap-1.5 text-[11px] text-cream/70">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online • typically replies in minutes
                </p>
              </div>
            </div>

            {!signedIn ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <MessageCircle className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Sign in to chat with the SwiftArc support team.</p>
                <div className="flex gap-2">
                  <Button size="sm" asChild><Link to="/login">Log in</Link></Button>
                  <Button size="sm" variant="outline" asChild><Link to="/register">Sign up</Link></Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-2 overflow-y-auto bg-background p-3">
                  {(msgs.data ?? []).map((m: Msg) => {
                    const mine = m.sender_id && m.sender_id === user?.id;
                    const isSystem = m.sender_role === "system";
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={
                            isSystem
                              ? "max-w-[80%] rounded-xl bg-secondary px-3 py-2 text-xs text-muted-foreground"
                              : mine
                                ? "max-w-[80%] rounded-2xl rounded-br-sm bg-navy-deep px-3 py-2 text-sm text-cream"
                                : "max-w-[80%] rounded-2xl rounded-bl-sm bg-secondary px-3 py-2 text-sm"
                          }
                        >
                          {m.body}
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (text.trim() && convo.data?.id) send.mutate(text.trim());
                  }}
                  className="flex items-center gap-2 border-t border-border bg-card p-2"
                >
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type your message…"
                    className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber/50"
                  />
                  <button
                    type="submit"
                    disabled={!text.trim() || send.isPending}
                    className="grid h-9 w-9 place-items-center rounded-lg bg-amber text-navy-deep disabled:opacity-50"
                    aria-label="Send"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
