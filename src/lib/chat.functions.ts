import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function fail(err: unknown, msg = "Chat operation failed."): never {
  // eslint-disable-next-line no-console
  console.error("[chat]", err);
  throw new Error(msg);
}

/** Get or create the caller's open conversation. */
export const getOrCreateConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: existing } = await context.supabase
      .from("chat_conversations")
      .select("id, status, last_message_at, created_at")
      .eq("user_id", context.userId)
      .eq("status", "open")
      .order("last_message_at", { ascending: false })
      .maybeSingle();
    if (existing) return existing;
    const { data, error } = await context.supabase
      .from("chat_conversations")
      .insert({ user_id: context.userId, subject: "Support chat" })
      .select("id, status, last_message_at, created_at")
      .single();
    if (error) fail(error);
    // Seed system welcome message via admin so sender_id can be null
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("chat_messages").insert({
      conversation_id: data!.id,
      sender_role: "system",
      body: "Hi! You're chatting with SwiftArc Support. Send us a message and we'll respond shortly.",
    });
    return data!;
  });

export const listMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ conversationId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("chat_messages")
      .select("id, sender_id, sender_role, body, created_at, read_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) fail(error);
    return rows ?? [];
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    conversationId: z.string().uuid(),
    body: z.string().min(1).max(4000),
  }).parse(i))
  .handler(async ({ data, context }) => {
    // Determine sender role
    const { data: roleRow } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    const senderRole = roleRow ? "agent" : "user";
    const { error } = await context.supabase.from("chat_messages").insert({
      conversation_id: data.conversationId,
      sender_id: context.userId,
      sender_role: senderRole,
      body: data.body,
    });
    if (error) fail(error);
    await context.supabase
      .from("chat_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", data.conversationId);
    return { ok: true };
  });

// Admin listing of all conversations
export const adminListConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleRow } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (!roleRow) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("chat_conversations")
      .select("id, user_id, subject, status, last_message_at, created_at")
      .order("last_message_at", { ascending: false })
      .limit(200);
    if (error) fail(error);
    return data ?? [];
  });
