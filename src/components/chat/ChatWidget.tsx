import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Send, X, Headphones } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { 
  getOrCreateConversation, 
  listMessages, 
  sendMessage,
  guestGetOrCreateConversation,
  guestListMessages,
  guestSendMessage
} from "@/lib/chat.functions";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Msg = {
  id: string;
  sender_id: string | null;
  sender_role: string;
  body: string;
  created_at: string;
};

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { signedIn, user } = useAuth();
  const [text, setText] = useState("");
  const qc = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const [guestId, setGuestId] = useState<string | null>(null);
  const [guestSetupComplete, setGuestSetupComplete] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  useEffect(() => {
    if (!signedIn) {
      let storedId = localStorage.getItem("swiftarc_guest_id");
      if (!storedId) {
        storedId = generateUUID();
        localStorage.setItem("swiftarc_guest_id", storedId);
      }
      setGuestId(storedId);
      setGuestSetupComplete(localStorage.getItem("swiftarc_guest_setup") === "true");
    }
  }, [signedIn]);

  const authStartConvo = useServerFn(getOrCreateConversation);
  const authFetchMsgs = useServerFn(listMessages);
  const authPostMsg = useServerFn(sendMessage);

  const guestStartConvo = useServerFn(guestGetOrCreateConversation);
  const guestFetchMsgs = useServerFn(guestListMessages);
  const guestPostMsg = useServerFn(guestSendMessage);

  const convo = useQuery({
    queryKey: ["chat", "convo", signedIn ? user?.id : guestId],
    enabled: open && (signedIn ? !!user?.id : !!guestId && guestSetupComplete),
    queryFn: () => signedIn 
      ? authStartConvo() 
      : guestStartConvo({ data: { guestId: guestId!, name: guestName, email: guestEmail } }),
    staleTime: 60_000,
  });

  const msgs = useQuery({
    queryKey: ["chat", "msgs", convo.data?.id],
    enabled: !!convo.data?.id,
    queryFn: () => signedIn
      ? authFetchMsgs({ data: { conversationId: convo.data!.id } })
      : guestFetchMsgs({ data: { conversationId: convo.data!.id, guestId: guestId! } }),
  });

  // Realtime subscription
  useEffect(() => {
    if (!convo.data?.id) return;
    const channel = supabase
      .channel(`chat-${convo.data.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${convo.data.id}`,
        },
        () => qc.invalidateQueries({ queryKey: ["chat", "msgs", convo.data!.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [convo.data, qc]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.data, open]);

  const send = useMutation({
    mutationFn: (body: string) => signedIn
      ? authPostMsg({ data: { conversationId: convo.data!.id, body } })
      : guestPostMsg({ data: { conversationId: convo.data!.id, guestId: guestId!, body } }),
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

            {!signedIn && !guestSetupComplete ? (
              <div className="flex flex-1 flex-col justify-center p-6 bg-background">
                <div className="text-center mb-6">
                  <MessageCircle className="h-12 w-12 text-amber mx-auto mb-3" />
                  <h3 className="font-bold text-lg">Welcome to Live Chat</h3>
                  <p className="text-sm text-muted-foreground mt-1">Please introduce yourself to start chatting with our support team.</p>
                </div>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (guestName.trim()) {
                      localStorage.setItem("swiftarc_guest_setup", "true");
                      setGuestSetupComplete(true);
                    }
                  }}
                  className="space-y-3"
                >
                  <Input 
                    placeholder="Your Name (required)" 
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    className="h-11 rounded-xl"
                  />
                  <Input 
                    placeholder="Email Address (optional)" 
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                  <Button type="submit" className="w-full h-11 font-bold bg-amber text-navy-deep hover:bg-amber/90 rounded-xl mt-2">
                    Start Chat
                  </Button>
                </form>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-2 overflow-y-auto bg-background p-3">
                  {(msgs.data ?? []).map((m: Msg, i: number, arr: Msg[]) => {
                const mine = m.sender_role === "user";
                const isSystem = m.sender_role === "system";
                const prevMsg = i > 0 ? arr[i - 1] : null;
                const showLabel = !prevMsg || prevMsg.sender_role !== m.sender_role;

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
                  >
                    {showLabel && !isSystem && (
                      <span className="text-[10px] font-semibold text-muted-foreground mb-1 px-1">
                        {mine ? "You" : "Support"}
                      </span>
                    )}
                    <div
                      className={
                        isSystem
                          ? "max-w-[80%] rounded-xl bg-secondary px-3 py-2 text-xs text-muted-foreground self-center mt-2 mb-2 text-center"
                          : mine
                            ? "max-w-[80%] rounded-2xl rounded-br-sm bg-navy-deep px-3 py-2 text-sm text-cream"
                            : "max-w-[80%] rounded-2xl rounded-bl-sm bg-secondary px-3 py-2 text-sm"
                      }
                    >
                      {m.body}
                      {!isSystem && (
                        <div
                          className={`text-[9px] mt-1 ${mine ? "text-cream/50 text-right" : "text-muted-foreground"}`}
                        >
                          {format(new Date(m.created_at), "HH:mm")}
                        </div>
                      )}
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
