import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function fail(err: unknown, msg = "Chat operation failed."): never {
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
  .validator((i) => z.object({ conversationId: z.string().uuid() }).parse(i))
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
  .validator((i) =>
    z
      .object({
        conversationId: z.string().uuid(),
        body: z.string().min(1).max(4000),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    // Determine sender role
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
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
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("chat_conversations")
      .select("id, user_id, subject, status, last_message_at, created_at, guest_id")
      .order("last_message_at", { ascending: false })
      .limit(200);
    if (error) fail(error);
    return data ?? [];
  });

/** GUEST CHAT FUNCTIONS */

export const guestGetOrCreateConversation = createServerFn({ method: "POST" })
  .validator((i) => z.object({ 
    guestId: z.string().uuid(),
    name: z.string().optional(),
    email: z.string().optional()
  }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("chat_conversations")
      .select("id, status, last_message_at, created_at")
      .eq("guest_id", data.guestId)
      .eq("status", "open")
      .order("last_message_at", { ascending: false })
      .maybeSingle();
    
    if (existing) return existing;
    
    const subject = data.name 
      ? `Guest Chat: ${data.name}${data.email ? ` (${data.email})` : ''}` 
      : "Guest Support chat";

    const { data: newConvo, error } = await supabaseAdmin
      .from("chat_conversations")
      .insert({ guest_id: data.guestId, subject })
      .select("id, status, last_message_at, created_at")
      .single();
    
    if (error) fail(error);
    
    await supabaseAdmin.from("chat_messages").insert({
      conversation_id: newConvo!.id,
      sender_role: "system",
      body: "Hi! You're chatting with SwiftArc Support as a guest. Send us a message and we'll respond shortly.",
    });
    
    return newConvo!;
  });

export const guestListMessages = createServerFn({ method: "POST" })
  .validator((i) => z.object({ conversationId: z.string().uuid(), guestId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Verify this conversation belongs to the guest
    const { data: convo } = await supabaseAdmin
      .from("chat_conversations")
      .select("id")
      .eq("id", data.conversationId)
      .eq("guest_id", data.guestId)
      .maybeSingle();
      
    if (!convo) throw new Error("Not found");

    const { data: rows, error } = await supabaseAdmin
      .from("chat_messages")
      .select("id, sender_id, sender_role, body, created_at, read_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true })
      .limit(500);
      
    if (error) fail(error);
    return rows ?? [];
  });

export const guestSendMessage = createServerFn({ method: "POST" })
  .validator((i) =>
    z.object({
      conversationId: z.string().uuid(),
      guestId: z.string().uuid(),
      body: z.string().min(1).max(4000),
    }).parse(i)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Verify this conversation belongs to the guest
    const { data: convo } = await supabaseAdmin
      .from("chat_conversations")
      .select("id")
      .eq("id", data.conversationId)
      .eq("guest_id", data.guestId)
      .maybeSingle();
      
    if (!convo) throw new Error("Not found");

    const { error } = await supabaseAdmin.from("chat_messages").insert({
      conversation_id: data.conversationId,
      sender_role: "user",
      body: data.body,
    });
    
    if (error) fail(error);
    
    await supabaseAdmin
      .from("chat_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", data.conversationId);
      
    return { ok: true };
  });

// ─── Admin message reading & replying (bypasses RLS via supabaseAdmin) ───

/** Admin: fetch messages for ANY conversation (user or guest). */
export const adminListMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ conversationId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    // Verify caller is admin
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("chat_messages")
      .select("id, sender_id, sender_role, body, created_at, read_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) fail(error);
    return rows ?? [];
  });

/** Admin: send a reply to ANY conversation (user or guest). */
export const adminSendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z.object({
      conversationId: z.string().uuid(),
      body: z.string().min(1).max(4000),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    // Verify caller is admin
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("chat_messages").insert({
      conversation_id: data.conversationId,
      sender_id: context.userId,
      sender_role: "agent",
      body: data.body,
    });
    if (error) fail(error);

    await supabaseAdmin
      .from("chat_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", data.conversationId);
    return { ok: true };
  });

/** Admin: close / resolve a conversation. */
export const adminCloseConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ conversationId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("chat_conversations")
      .update({ status: "closed" })
      .eq("id", data.conversationId);
    if (error) fail(error);

    // Insert a system message
    await supabaseAdmin.from("chat_messages").insert({
      conversation_id: data.conversationId,
      sender_role: "system",
      body: "This conversation has been closed by support.",
    });
    return { ok: true };
  });

