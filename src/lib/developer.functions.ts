import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function fail(e: any): never {
  throw new Error(e?.message || "Operation failed");
}

// Simulated data store for development since we can't reliably run migrations here
const MOCK_DB = {
  keys: [] as any[],
  webhooks: [] as any[]
};

export const listApiKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // In a real app, query `api_keys` table where user_id = context.userId
    return MOCK_DB.keys.filter(k => k.user_id === context.userId);
  });

export const createApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ name: z.string().min(1) }).parse(i))
  .handler(async ({ data, context }) => {
    const key = `sk_test_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const newKey = {
      id: crypto.randomUUID(),
      user_id: context.userId,
      name: data.name,
      key_preview: `...${key.slice(-4)}`,
      full_key: key, // Only returned once
      created_at: new Date().toISOString(),
      last_used: null
    };
    MOCK_DB.keys.push(newKey);
    return newKey;
  });

export const deleteApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ id: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    MOCK_DB.keys = MOCK_DB.keys.filter(k => k.id !== data.id || k.user_id !== context.userId);
    return { ok: true };
  });

export const listWebhooks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return MOCK_DB.webhooks.filter(w => w.user_id === context.userId);
  });

export const createWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ url: z.string().url(), events: z.array(z.string()) }).parse(i))
  .handler(async ({ data, context }) => {
    const newWebhook = {
      id: crypto.randomUUID(),
      user_id: context.userId,
      url: data.url,
      events: data.events,
      secret: `whsec_${Math.random().toString(36).substring(2, 15)}`,
      created_at: new Date().toISOString(),
      status: "active"
    };
    MOCK_DB.webhooks.push(newWebhook);
    return newWebhook;
  });

export const deleteWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ id: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    MOCK_DB.webhooks = MOCK_DB.webhooks.filter(w => w.id !== data.id || w.user_id !== context.userId);
    return { ok: true };
  });
