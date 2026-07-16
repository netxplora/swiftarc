import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { shipments as mockShipments, statusLabels, type ShipmentStatus } from "@/lib/mock-shipments";

// Sanitize DB errors before returning to the client. Raw Supabase/Postgres
// error messages leak schema, constraint, and column names.
function dbFail(error: unknown, message = "Operation failed. Please try again."): never {
  // eslint-disable-next-line no-console
  console.error("[db error]", error);
  throw new Error(message);
}


// ---------- Shipments (mock catalog + user-owned) ----------

export const listShipments = createServerFn({ method: "GET" }).handler(async () => {
  const now = Date.now();
  return Object.values(mockShipments).map((s) => {
    const cadenceMs =
      s.status === "out_for_delivery" ? 45_000 :
      s.status === "exception" ? 30_000 :
      s.status === "in_transit" ? 60_000 :
      s.status === "delivered" ? 15 * 60_000 :
      120_000;
    return {
      id: s.id,
      trackingNumber: s.trackingNumber,
      status: s.status as ShipmentStatus,
      statusLabel: statusLabels[s.status],
      service: s.service,
      origin: `${s.origin.city}, ${s.origin.country}`,
      destination: `${s.destination.city}, ${s.destination.country}`,
      recipient: s.recipient,
      estimatedDelivery: s.estimatedDelivery,
      progress: s.progress,
      onTimeConfidence: s.onTimeConfidence,
      lastUpdate: new Date(now - Math.random() * cadenceMs).toISOString(),
      nextUpdateAt: new Date(now + cadenceMs).toISOString(),
      exceptionNote: s.exceptionNote,
      source: "sample" as const,
    };
  });
});

export const listMyShipments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("shipments")
      .select("id, tracking_number, status, service, origin, destination, package, estimated_delivery, created_at, updated_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) dbFail(error);
    return (data ?? []).map((r: any) => {
      const o = r.origin ?? {}; const d = r.destination ?? {};
      const status = (r.status as ShipmentStatus) ?? "label_created";
      return {
        id: r.id,
        trackingNumber: r.tracking_number,
        status,
        statusLabel: statusLabels[status] ?? "Booked",
        service: r.service,
        origin: `${o.city ?? ""}, ${o.country_code ?? o.country ?? ""}`.replace(/^, /, ""),
        destination: `${d.city ?? ""}, ${d.country_code ?? d.country ?? ""}`.replace(/^, /, ""),
        recipient: d.contact_name ?? "",
        estimatedDelivery: r.estimated_delivery ?? new Date(Date.now() + 3 * 86400_000).toISOString().slice(0,10),
        progress: status === "delivered" ? 100 : status === "out_for_delivery" ? 88 : status === "in_transit" ? 55 : status === "picked_up" ? 25 : 8,
        onTimeConfidence: 96,
        lastUpdate: r.updated_at,
        nextUpdateAt: new Date(Date.now() + 90_000).toISOString(),
        exceptionNote: undefined,
        source: "user" as const,
      };
    });
  });

// Resolve tracking by number for the public tracking page. Uses admin client
// server-side to look up a shipment by known ID (standard courier pattern),
// returns only shareable columns.
export const resolveTracking = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ trackingNumber: z.string().min(4).max(64) }).parse(i))
  .handler(async ({ data }) => {
    const mock = mockShipments[data.trackingNumber];
    if (mock) return { kind: "mock" as const, trackingNumber: mock.trackingNumber };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const query = supabaseAdmin
      .from("shipments")
      .select("id, tracking_number, status, service, origin, destination, package, estimated_delivery, declared_value, insurance, signature_required, notes, created_at, proof_of_delivery, telemetry");
    
    const { data: ship } = await (query as any)
      .eq("tracking_number", data.trackingNumber)
      .maybeSingle();
    if (!ship) return { kind: "none" as const };
    const { data: events } = await supabaseAdmin
      .from("shipment_events")
      .select("id, status, description, location, occurred_at")
      .eq("shipment_id", ship.id)
      .order("occurred_at", { ascending: false });
    const evts = events ?? [];
    const trim = (a: any) => a ? { city: a.city, country_code: a.country_code, region: a.region } : null;

    // AI Heuristics Engine (Phase 8 integration)
    const { evaluateShipmentRisk } = await import("./ai-predictions");
    const aiPrediction = await evaluateShipmentRisk({
      ...ship,
      telemetry: ship.telemetry,
      proofOfDelivery: ship.proof_of_delivery
    });

    return {
      kind: "db" as const,
      shipment: {
        id: ship.id,
        trackingNumber: ship.tracking_number,
        status: ship.status,
        service: ship.service,
        origin: trim(ship.origin),
        destination: trim(ship.destination),
        package: ship.package,
        estimatedDelivery: aiPrediction.adjustedEstimatedDelivery,
        declaredValue: Number(ship.declared_value ?? 0),
        insurance: ship.insurance,
        signatureRequired: ship.signature_required,
        createdAt: ship.created_at,
        onTimeConfidence: aiPrediction.onTimeConfidence,
        aiNote: aiPrediction.aiNote,
        proof_of_delivery: ship.proof_of_delivery,
        telemetry: ship.telemetry,
      },
      events: evts,
    };
  });

// ---------- Profile / preferences ----------

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, display_name, theme, notif_email, notif_sms, notif_push, notif_marketing")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) dbFail(error);
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ display_name: z.string().min(1).max(120) }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").update({ display_name: data.display_name }).eq("id", context.userId);
    if (error) dbFail(error);
    return { ok: true };
  });

export const updateTheme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ theme: z.enum(["light", "dark", "system"]) }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles").update({ theme: data.theme }).eq("id", context.userId);
    if (error) dbFail(error);
    return { ok: true };
  });

export const updateNotifPrefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    notif_email: z.boolean().optional(),
    notif_sms: z.boolean().optional(),
    notif_push: z.boolean().optional(),
    notif_marketing: z.boolean().optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").update(data).eq("id", context.userId);
    if (error) dbFail(error);
    return { ok: true };
  });

// ---------- Notifications ----------

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notifications")
      .select("id, title, body, category, tone, read, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) dbFail(error);
    return data ?? [];
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid(), read: z.boolean().default(true) }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notifications").update({ read: data.read })
      .eq("id", data.id).eq("user_id", context.userId);
    if (error) dbFail(error);
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("notifications").update({ read: true })
      .eq("user_id", context.userId).eq("read", false);
    if (error) dbFail(error);
    return { ok: true };
  });

// ---------- Address book ----------

const AddressSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1).max(80),
  contact_name: z.string().min(1).max(120),
  company: z.string().max(120).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email().max(120).optional().nullable(),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional().nullable(),
  city: z.string().min(1).max(80),
  region: z.string().max(80).optional().nullable(),
  postal_code: z.string().min(1).max(20),
  country_code: z.string().min(2).max(2),
  is_default_sender: z.boolean().optional(),
  is_default_recipient: z.boolean().optional(),
});

export const listAddresses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("addresses").select("*").eq("user_id", context.userId).order("updated_at", { ascending: false });
    if (error) dbFail(error);
    return data ?? [];
  });

export const upsertAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => AddressSchema.parse(i))
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("addresses").update(payload).eq("id", data.id).eq("user_id", context.userId);
      if (error) dbFail(error);
    } else {
      const { error } = await context.supabase.from("addresses").insert(payload);
      if (error) dbFail(error);
    }
    return { ok: true };
  });

export const deleteAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("addresses").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) dbFail(error);
    return { ok: true };
  });

export const setDefaultAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid(), role: z.enum(["sender", "recipient"]) }).parse(i))
  .handler(async ({ data, context }) => {
    if (data.role === "sender") {
      await context.supabase.from("addresses").update({ is_default_sender: false }).eq("user_id", context.userId);
      const { error } = await context.supabase.from("addresses").update({ is_default_sender: true }).eq("id", data.id).eq("user_id", context.userId);
      if (error) dbFail(error);
    } else {
      await context.supabase.from("addresses").update({ is_default_recipient: false }).eq("user_id", context.userId);
      const { error } = await context.supabase.from("addresses").update({ is_default_recipient: true }).eq("id", data.id).eq("user_id", context.userId);
      if (error) dbFail(error);
    }
    return { ok: true };
  });

// ---------- Pickup scheduler ----------

const SLOTS = ["09:00 – 12:00", "12:00 – 15:00", "15:00 – 18:00", "18:00 – 20:00"] as const;

export const getPickupSlots = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.rpc("get_pickup_slot_counts", { target_date: data.date });
    const CAP = 8;
    const counts = new Map<string, number>();
    (rows ?? []).forEach((r: { slot: string; cnt: number }) => counts.set(r.slot, Number(r.cnt)));

    const today = new Date().toISOString().slice(0, 10);
    const nowH = new Date().getHours();
    return SLOTS.map((slot) => {
      const used = counts.get(slot) ?? 0;
      const startHour = parseInt(slot.slice(0, 2), 10);
      const isPast = data.date === today && startHour <= nowH + 1;
      return {
        slot, capacity: CAP, remaining: Math.max(0, CAP - used),
        available: !isPast && used < CAP,
        reason: isPast ? "Cutoff passed" : used >= CAP ? "Fully booked" : null,
      };
    });
  });

export const createPickup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    contact_name: z.string().min(1).max(120),
    company: z.string().max(120).optional(),
    address: z.string().min(1).max(200),
    city: z.string().min(1).max(80),
    postal_code: z.string().min(1).max(20),
    instructions: z.string().max(500).optional(),
    pickup_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    slot: z.enum(SLOTS),
    package_count: z.number().int().min(1).max(99),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: counts } = await supabaseAdmin.rpc("get_pickup_slot_counts", { target_date: data.pickup_date });
    const used = (counts ?? []).find((r: { slot: string; cnt: number }) => r.slot === data.slot)?.cnt ?? 0;
    if (Number(used) >= 8) throw new Error("Selected slot is fully booked");

    const ref = `PU-${Math.floor(100000 + Math.random() * 900000)}`;
    const { data: row, error } = await context.supabase
      .from("pickups").insert({ ...data, user_id: context.userId, reference: ref }).select("*").single();
    if (error) dbFail(error);
    await context.supabase.from("notifications").insert({
      user_id: context.userId, title: "Pickup scheduled",
      body: `${ref} · ${data.pickup_date} · ${data.slot} · ${data.package_count} package(s)`,
      category: "pickup", tone: "success",
    });
    return row;
  });

export const listPickups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("pickups").select("*").eq("user_id", context.userId)
      .order("created_at", { ascending: false }).limit(20);
    if (error) dbFail(error);
    return data ?? [];
  });

// ---------- Shipment booking ----------

const AddressSnapshot = z.object({
  contact_name: z.string().min(1).max(120),
  company: z.string().max(120).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().max(120).optional().nullable(),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional().nullable(),
  city: z.string().min(1).max(80),
  region: z.string().max(80).optional().nullable(),
  postal_code: z.string().min(1).max(20),
  country_code: z.string().min(2).max(2),
});

export const bookShipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    service: z.enum(["Priority Overnight", "Express", "Standard Ground", "Freight LTL"]),
    origin: AddressSnapshot,
    destination: AddressSnapshot,
    package: z.object({
      weight_kg: z.number().positive().max(2000),
      length_cm: z.number().positive().max(500).optional(),
      width_cm: z.number().positive().max(500).optional(),
      height_cm: z.number().positive().max(500).optional(),
      pieces: z.number().int().min(1).max(999),
      description: z.string().max(200).optional(),
    }),
    declared_value: z.number().nonnegative().max(1_000_000).default(0),
    insurance: z.boolean().default(false),
    signature_required: z.boolean().default(false),
    notes: z.string().max(500).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    // Generate unique tracking number (server-side retry loop)
    let trackingNumber = "";
    for (let i = 0; i < 8; i++) {
      const n = "SA" + Math.floor(Math.random() * 1e10).toString().padStart(10, "0");
      const { data: exists } = await context.supabase
        .from("shipments").select("id").eq("tracking_number", n).maybeSingle();
      if (!exists) { trackingNumber = n; break; }
    }
    if (!trackingNumber) throw new Error("Could not allocate tracking number");

    const etaDays = data.service === "Priority Overnight" ? 1 : data.service === "Express" ? 2 : data.service === "Standard Ground" ? 4 : 6;
    const eta = new Date(Date.now() + etaDays * 86400_000).toISOString().slice(0, 10);

    const { data: row, error } = await context.supabase.from("shipments").insert({
      user_id: context.userId,
      tracking_number: trackingNumber,
      status: "label_created",
      service: data.service,
      origin: data.origin,
      destination: data.destination,
      package: data.package,
      declared_value: data.declared_value,
      insurance: data.insurance,
      signature_required: data.signature_required,
      notes: data.notes ?? null,
      estimated_delivery: eta,
    }).select("*").single();
    if (error) dbFail(error);

    await context.supabase.from("shipment_events").insert({
      shipment_id: row.id, status: "label_created",
      description: "Label created and shipment booked.",
      location: `${data.origin.city}, ${data.origin.country_code}`,
    });

    await context.supabase.from("notifications").insert({
      user_id: context.userId,
      title: "Shipment booked",
      body: `${trackingNumber} · ${data.service} · ETA ${eta}`,
      category: "shipment", tone: "success",
    });

    return { trackingNumber, id: row.id, estimatedDelivery: eta };
  });

// ---------- Invoices ----------

export const listInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Seed a couple of demo invoices on first visit if none exist (idempotent)
    const { data: existing } = await context.supabase
      .from("invoices").select("id").eq("user_id", context.userId).limit(1);
    if (!existing || existing.length === 0) {
      const today = new Date();
      const seed = [
        {
          number: `INV-${today.getFullYear()}-0071`,
          issue_date: new Date(today.getFullYear(), today.getMonth() - 1, 15).toISOString().slice(0,10),
          due_date: new Date(today.getFullYear(), today.getMonth(), 15).toISOString().slice(0,10),
          status: "sent", currency: "USD",
          subtotal: 1080.00, tax: 108.00, total: 1188.00,
          line_items: [
            { label: "SwiftArc Priority Overnight", qty: 8, unit_price: 90 },
            { label: "SwiftArc Express", qty: 12, unit_price: 30 },
          ],
        },
        {
          number: `INV-${today.getFullYear()}-0062`,
          issue_date: new Date(today.getFullYear(), today.getMonth() - 2, 15).toISOString().slice(0,10),
          due_date: new Date(today.getFullYear(), today.getMonth() - 1, 15).toISOString().slice(0,10),
          status: "paid", currency: "USD",
          subtotal: 870.00, tax: 87.00, total: 957.00,
          line_items: [
            { label: "SwiftArc Standard Ground", qty: 29, unit_price: 30 },
          ],
        },
      ].map((r) => ({ ...r, user_id: context.userId }));
      await context.supabase.from("invoices").insert(seed);
    }
    const { data, error } = await context.supabase
      .from("invoices").select("*").eq("user_id", context.userId)
      .order("issue_date", { ascending: false });
    if (error) dbFail(error);
    return data ?? [];
  });

export const getInvoiceById = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("invoices").select("*").eq("id", data.id).eq("user_id", context.userId).maybeSingle();
    if (error) dbFail(error);
    return row;
  });

// ---------- Customs & duties rates ----------

const DUTY: Record<string, number> = {
  Electronics: 0.05, Apparel: 0.12, "Home goods": 0.08,
  Cosmetics: 0.065, Books: 0.0, Machinery: 0.03, Toys: 0.045, Jewelry: 0.11,
};
const VAT: Record<string, number> = {
  UK: 0.20, DE: 0.19, FR: 0.20, ES: 0.21, US: 0.0, JP: 0.10, CA: 0.05, AU: 0.10, AE: 0.05, IN: 0.18,
};
const DOCS_BASE = ["Commercial invoice", "Packing list", "Air waybill / BOL"];
const DOCS_BY_CATEGORY: Record<string, string[]> = {
  Electronics: ["FCC / CE conformity declaration", "Battery UN 38.3 report (if lithium)"],
  Cosmetics: ["Ingredient list (INCI)", "Product safety certificate"],
  Machinery: ["Machine safety declaration", "HS classification memo"],
  Apparel: ["Country of origin certificate", "Textile fibre composition"],
  Jewelry: ["Kimberley Process cert (for diamonds)", "Assay certificate"],
};

export const estimateCustoms = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({
    country: z.string(),
    category: z.string(),
    value: z.number().nonnegative(),
    freight: z.number().nonnegative(),
    insurance: z.number().nonnegative(),
    hsCode: z.string().optional(),
  }).parse(i))
  .handler(async ({ data }) => {
    const dutyRate = DUTY[data.category] ?? 0.05;
    const vatRate = VAT[data.country] ?? 0.15;
    const cif = data.value + data.freight + data.insurance;
    const duty = cif * dutyRate;
    const vat = (cif + duty) * vatRate;
    const clearance = 22.5;
    const handling = Math.max(4, cif * 0.005);
    const total = cif + duty + vat + clearance + handling;
    return {
      inputs: data,
      rates: { dutyRate, vatRate },
      breakdown: [
        { label: "Goods value (FOB)", amount: data.value },
        { label: "Freight", amount: data.freight },
        { label: "Insurance", amount: data.insurance },
        { label: "CIF value", amount: cif, emphasis: true },
        { label: `Import duty · ${(dutyRate * 100).toFixed(1)}%`, amount: duty },
        { label: `VAT · ${(vatRate * 100).toFixed(0)}%`, amount: vat },
        { label: "Clearance fee", amount: clearance },
        { label: "Handling", amount: handling },
        { label: "Estimated landed cost", amount: total, emphasis: true },
      ] as Array<{ label: string; amount: number; emphasis?: boolean }>,
      documents: [...DOCS_BASE, ...(DOCS_BY_CATEGORY[data.category] ?? [])],
      total,
      generatedAt: new Date().toISOString(),
    };
  });

// ---------- Rating Engine ----------

export const calculateRates = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({
    weight: z.number().positive().max(10000),
    zone: z.enum(["regional", "international", "intercontinental"])
  }).parse(i))
  .handler(async ({ data }) => {
    // In a real scenario, this would query carrier APIs or a complex pricing matrix in DB.
    const services = [
      { id: "priority", name: "Priority Overnight", days: 1, base: 62, perKg: 4.2 },
      { id: "express", name: "Express", days: 2, base: 38, perKg: 2.6 },
      { id: "ground", name: "Standard Ground", days: 4, base: 18, perKg: 1.1 },
      { id: "freight", name: "Freight LTL", days: 6, base: 90, perKg: 0.7 },
    ];
    
    const zoneMult = data.zone === "regional" ? 0.7 : data.zone === "international" ? 1 : 1.6;
    
    return services.map((s) => ({
      id: s.id,
      name: s.name,
      days: s.days,
      price: (s.base + s.perKg * data.weight) * zoneMult,
    }));
  });

// ---------- Fleet & Courier ----------

export const submitProofOfDelivery = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({
    trackingNumber: z.string().min(4).max(64),
    signedBy: z.string().min(1).max(120),
    signatureSvgPath: z.string().min(1),
    photoNote: z.string().optional(),
    location: z.string().optional(),
  }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ship } = await supabaseAdmin.from("shipments").select("id, package").eq("tracking_number", data.trackingNumber).maybeSingle();
    if (!ship) throw new Error("Shipment not found");

    const pod = {
      signedBy: data.signedBy,
      signatureSvgPath: data.signatureSvgPath,
      photoNote: data.photoNote ?? "Delivered securely",
      timestamp: new Date().toISOString(),
    };

    const { error } = await (supabaseAdmin.from("shipments").update({
      status: "delivered",
      proof_of_delivery: pod
    } as any) as any).eq("id", ship.id);

    if (error) dbFail(error);

    await supabaseAdmin.from("shipment_events").insert({
      shipment_id: ship.id,
      status: "delivered",
      description: `Delivered and signed by ${data.signedBy}`,
      location: data.location ?? "Destination point",
    });

    return { ok: true };
  });

export const updateTelemetry = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({
    trackingNumber: z.string().min(4).max(64),
    healthScore: z.number().min(0).max(100),
    temperatureC: z.number(),
    shockEvents: z.number().min(0),
  }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ship } = await supabaseAdmin.from("shipments").select("id, package").eq("tracking_number", data.trackingNumber).maybeSingle();
    if (!ship) throw new Error("Shipment not found");

    const telemetry = {
      healthScore: data.healthScore,
      temperatureC: data.temperatureC,
      shockEvents: data.shockEvents,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await (supabaseAdmin.from("shipments").update({
      telemetry
    } as any) as any).eq("id", ship.id);

    if (error) dbFail(error);
    return { ok: true };
  });
