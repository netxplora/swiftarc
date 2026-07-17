import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function fail(err: unknown, msg = "Operation failed."): never {
  // eslint-disable-next-line no-console
  console.error("[admin]", err);
  throw new Error(msg);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

// ---------- Overview ----------

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [users, shipments, pickups, invoices, convos] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "estimated", head: true }),
      supabaseAdmin.from("shipments").select("id", { count: "estimated", head: true }),
      supabaseAdmin.from("pickups").select("id", { count: "estimated", head: true }),
      supabaseAdmin.from("invoices").select("id", { count: "estimated", head: true }),
      supabaseAdmin.from("chat_conversations").select("id", { count: "estimated", head: true }).eq("status", "open"),
    ]);
    const { data: recent } = await supabaseAdmin
      .from("shipments")
      .select("id, tracking_number, status, service, created_at")
      .order("created_at", { ascending: false })
      .limit(8);
    return {
      counts: {
        users: users.count ?? 0,
        shipments: shipments.count ?? 0,
        pickups: pickups.count ?? 0,
        invoices: invoices.count ?? 0,
        openChats: convos.count ?? 0,
      },
      recentShipments: recent ?? [],
    };
  });

// ---------- Users ----------

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) fail(error);

    const userIds = profiles?.map(p => p.id) || [];
    let rolesData: any[] = [];
    
    if (userIds.length > 0) {
      const { data: roles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);
      rolesData = roles ?? [];
    }

    const roleMap = new Map<string, string[]>();
    rolesData.forEach((r) => {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    });

    return (profiles ?? []).map((p) => ({
      id: p.id,
      displayName: p.display_name,
      createdAt: p.created_at,
      roles: roleMap.get(p.id) ?? [],
    }));
  });

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    userId: z.string().uuid(),
    role: z.enum(["admin", "moderator", "user"]),
    grant: z.boolean(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
      if (error) fail(error);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) fail(error);
    }
    return { ok: true };
  });
export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) fail(error);
    return { ok: true };
  });
// ---------- Shipments ----------

export const adminListShipments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("shipments")
      .select("id, tracking_number, user_id, status, service, origin, destination, estimated_delivery, created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) fail(error);
    return data ?? [];
  });

export const adminUpdateShipmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    id: z.string().uuid(),
    status: z.string().min(1).max(40),
    note: z.string().max(500).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("shipments")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) fail(error);
    await supabaseAdmin.from("shipment_events").insert({
      shipment_id: data.id,
      status: data.status,
      description: data.note ?? `Status updated to ${data.status}`,
      occurred_at: new Date().toISOString(),
    });
    return { ok: true };
  });

export const adminCreateShipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    tracking_number: z.string(),
    service: z.string(),
    status: z.string(),
    origin: z.any(),
    destination: z.any(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // @ts-ignore
    const { data: inserted, error } = await supabaseAdmin.from("shipments").insert({
      tracking_number: data.tracking_number,
      service: data.service,
      status: "label_created",
      origin: data.origin as any,
      destination: data.destination as any,
      user_id: context.userId,
      package: {},
    }).select().single();
    if (error) fail(error);
    return { ok: true };
  });

export const adminUpdateShipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    id: z.string().uuid(),
    tracking_number: z.string(),
    service: z.string(),
    status: z.string(),
    note: z.string().optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("shipments").update({
      tracking_number: data.tracking_number,
      service: data.service,
      status: data.status,
    }).eq("id", data.id);
    if (error) fail(error);
    
    if (data.note) {
      await supabaseAdmin.from("shipment_events").insert({
        shipment_id: data.id,
        status: data.status,
        description: data.note,
        occurred_at: new Date().toISOString(),
      });
    }
    
    return { ok: true };
  });

export const adminDeleteShipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("shipments").delete().eq("id", data.id);
    if (error) fail(error);
    return { ok: true };
  });

// ---------- Pickups ----------

export const adminListPickups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("pickups")
      .select("id, user_id, pickup_date, slot, status, contact_name, company, address, city, postal_code, reference, package_count, created_at")
      .order("pickup_date", { ascending: false })
      .limit(300);
    if (error) fail(error);
    return data ?? [];
  });

export const adminSetPickupStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid(), status: z.enum(["pending","confirmed","completed","cancelled"]) }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("pickups").update({ status: data.status }).eq("id", data.id);
    if (error) fail(error);
    return { ok: true };
  });

export const adminCreatePickup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    contact_name: z.string(),
    company: z.string().optional(),
    address: z.string(),
    city: z.string(),
    postal_code: z.string(),
    reference: z.string().optional(),
    pickup_date: z.string(),
    slot: z.string(),
    status: z.string(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // @ts-ignore
    const { data: inserted, error } = await supabaseAdmin.from("pickups").insert({
      user_id: context.userId,
      contact_name: data.contact_name,
      company: data.company,
      address: data.address,
      city: data.city,
      postal_code: data.postal_code,
      reference: data.reference ?? "",
      pickup_date: data.pickup_date,
      slot: data.slot,
      status: "requested",
    }).select().single();
    if (error) fail(error);
    return { ok: true };
  });

export const adminUpdatePickup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    id: z.string().uuid(),
    contact_name: z.string(),
    company: z.string().optional(),
    pickup_date: z.string(),
    slot: z.string(),
    status: z.string(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("pickups").update({
      contact_name: data.contact_name,
      company: data.company,
      pickup_date: data.pickup_date,
      slot: data.slot,
      status: data.status,
    }).eq("id", data.id);
    if (error) fail(error);
    return { ok: true };
  });

export const adminDeletePickup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("pickups").delete().eq("id", data.id);
    if (error) fail(error);
    return { ok: true };
  });

// ---------- Invoices ----------

export const adminListInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("invoices")
      .select("id, number, user_id, status, total, currency, issue_date, due_date, created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) fail(error);
    return data ?? [];
  });

export const adminSetInvoiceStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid(), status: z.enum(["draft","sent","paid","overdue","void"]) }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("invoices").update({ status: data.status }).eq("id", data.id);
    if (error) fail(error);
    return { ok: true };
  });

export const adminCreateInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    number: z.string(),
    total: z.number(),
    due_date: z.string(),
    status: z.string(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("invoices").insert({
      user_id: context.userId,
      number: data.number,
      total: data.total,
      due_date: data.due_date,
      status: data.status,
      currency: "USD",
      issue_date: new Date().toISOString(),
    });
    if (error) fail(error);
    return { ok: true };
  });

export const adminDeleteInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("invoices").delete().eq("id", data.id);
    if (error) fail(error);
    return { ok: true };
  });

// ---------- Notifications broadcast ----------

export const adminBroadcastNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(2000),
    category: z.string().max(40).default("announcement"),
    tone: z.enum(["default","success","warning","danger"]).default("default"),
    targetUserId: z.string().uuid().optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.targetUserId) {
      const { error } = await supabaseAdmin.from("notifications").insert({
        user_id: data.targetUserId, title: data.title, body: data.body, category: data.category, tone: data.tone,
      });
      if (error) fail(error);
      return { ok: true, sent: 1 };
    }
    const { data: users, error: uerr } = await supabaseAdmin.from("profiles").select("id");
    if (uerr) fail(uerr);
    const rows = (users ?? []).map((u) => ({
      user_id: u.id, title: data.title, body: data.body, category: data.category, tone: data.tone,
    }));
    if (rows.length === 0) return { ok: true, sent: 0 };
    const { error } = await supabaseAdmin.from("notifications").insert(rows);
    if (error) fail(error);
    return { ok: true, sent: rows.length };
  });

// ---------- Payment Management ----------

export const adminListPaymentMethods = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("payment_methods").select("*").order("sort_order");
    if (error) fail(error);
    return data ?? [];
  });

export const adminTogglePaymentMethod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid(), enabled: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("payment_methods").update({ enabled: data.enabled, updated_at: new Date().toISOString() }).eq("id", data.id);
    if (error) fail(error);
    return { ok: true };
  });

export const adminListWallets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("wallets").select("*").order("sort_order");
    if (error) fail(error);
    return data ?? [];
  });

export const adminUpsertWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    id: z.string().uuid().optional(),
    currency: z.string().min(1).max(10),
    network: z.string().min(1).max(60),
    address: z.string().min(10).max(200),
    label: z.string().max(100).optional(),
    instructions: z.string().max(1000).optional(),
    status: z.enum(["active", "inactive", "maintenance"]).default("active"),
    sort_order: z.number().int().default(0),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = { ...data, updated_at: new Date().toISOString() };
    if (data.id) {
      const { error } = await supabaseAdmin.from("wallets").update(payload).eq("id", data.id);
      if (error) fail(error);
    } else {
      const { error } = await supabaseAdmin.from("wallets").insert(payload);
      if (error) fail(error);
    }
    return { ok: true };
  });

export const adminDeleteWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("wallets").delete().eq("id", data.id);
    if (error) fail(error);
    return { ok: true };
  });

export const adminListTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("payment_transactions")
      .select("*, shipments(tracking_number, service)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) fail(error);
    return data ?? [];
  });

export const adminVerifyTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    id: z.string().uuid(),
    action: z.enum(["verify", "reject"]),
    note: z.string().max(500).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const status = data.action === "verify" ? "verified" : "rejected";
    const { error } = await supabaseAdmin
      .from("payment_transactions")
      .update({
        status,
        admin_note: data.note ?? null,
        verified_by: context.userId,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) fail(error);
    return { ok: true, status };
  });
