import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Minus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getOrCreateConversation, listMessages, sendMessage } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";

export function LiveChat() {
  const qc = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const getConvo = useServerFn(getOrCreateConversation);
  const listMsgs = useServerFn(listMessages);
  const sendMsg = useServerFn(sendMessage);

  // Auto-fetch convo if chat is opened
  const { data: convo } = useQuery({
    queryKey: ["chat-convo"],
    queryFn: () => getConvo(),
    enabled: isOpen,
  });

  const { data: messages } = useQuery({
    queryKey: ["chat-messages", convo?.id],
    queryFn: () => listMsgs({ data: { conversationId: convo!.id } }),
    enabled: !!convo?.id,
  });

  // Realtime subscription
  useEffect(() => {
    if (!convo?.id) return;
    const channel = supabase.channel(`chat_${convo.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${convo.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["chat-messages", convo.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [convo?.id, qc]);

  // Scroll to bottom
  useEffect(() => {
    if (messages && isOpen && !minimized) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [messages, isOpen, minimized]);

  const mut = useMutation({
    mutationFn: (body: string) => sendMsg({ data: { conversationId: convo!.id, body } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-messages", convo!.id] });
      setInput("");
    },
  });

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-amber text-navy-deep shadow-xl hover:bg-amber-soft z-50"
        aria-label="Open support chat"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={`fixed right-4 z-50 flex w-full max-w-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl ${
          minimized ? "bottom-4 h-[60px]" : "bottom-4 h-[500px] max-h-[80vh]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-navy-deep px-4 py-3 text-cream">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber" />
            <h3 className="font-display font-semibold">SwiftArc Support</h3>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setMinimized(!minimized)} className="rounded-md p-1 hover:bg-white/10" aria-label="Minimize chat">
              <Minus className="h-4 w-4" />
            </button>
            <button onClick={() => setIsOpen(false)} className="rounded-md p-1 hover:bg-white/10" aria-label="Close chat">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        {!minimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/10">
              {messages?.map((msg) => {
                const isUser = msg.sender_role === "user";
                return (
                  <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                        isUser
                          ? "bg-navy-deep text-cream rounded-br-sm"
                          : "bg-secondary text-foreground rounded-bl-sm"
                      }`}
                    >
                      {msg.body}
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim() && convo) mut.mutate(input);
              }}
              className="flex items-center gap-2 border-t border-border bg-background p-3"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                disabled={mut.isPending || !convo}
                className="flex-1"
                autoFocus
              />
              <Button type="submit" size="icon" disabled={!input.trim() || mut.isPending || !convo} className="bg-amber text-navy-deep hover:bg-amber-soft">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
