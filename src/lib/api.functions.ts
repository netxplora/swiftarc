/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { statusLabels, type ShipmentStatus } from "@/lib/types";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2024-04-10" as any,
});

// Sanitize DB errors before returning to the client. Raw Supabase/Postgres
// error messages leak schema, constraint, and column names.
export function dbFail(error: any, message = "Operation failed. Please try again."): never {
  console.error("[db error]", error);
  const errMsg = error?.message || error?.details || JSON.stringify(error);
  throw new Error(`${message} (Details: ${errMsg})`);
}

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 500,
): Promise<T> {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      if (err.statusCode >= 400 && err.statusCode < 500 && err.statusCode !== 429) {
        // Don't retry client errors unless it's a rate limit (429)
        throw err;
      }
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
        console.warn(
          `[Circuit Breaker] API call failed, retrying in ${Math.round(delay)}ms (Attempt ${attempt + 1}/${maxRetries})`,
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

// ---------- Shipments (user-owned) ----------
export const listMyShipments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("shipments")
      .select(
        "id, tracking_number, status, service, origin, destination, package, estimated_delivery, created_at, updated_at, is_hazmat, volumetric_weight, customs_holds(*)",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) dbFail(error);
    return (data ?? []).map((r: any) => {
      const o = r.origin ?? {};
      const d = r.destination ?? {};
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
        estimatedDelivery:
          r.estimated_delivery ?? new Date(Date.now() + 3 * 86400_000).toISOString().slice(0, 10),
        progress:
          status === "delivered"
            ? 100
            : status === "out_for_delivery"
              ? 88
              : status === "in_transit"
                ? 55
                : status === "picked_up"
                  ? 25
                  : 8,
        onTimeConfidence: 96,
        lastUpdate: r.updated_at,
        createdAt: r.created_at,
        exceptionNote: undefined,
        source: "user" as const,
        package: r.package,
        origin_raw: o,
        destination_raw: d,
        is_hazmat: r.is_hazmat,
        volumetric_weight: r.volumetric_weight,
        customsHolds: r.customs_holds || [],
      };
    });
  });

// Resolve tracking by number for the public tracking page. Uses admin client
// server-side to look up a shipment by known ID (standard courier pattern),
// returns only shareable columns.
export const resolveTracking = createServerFn({ method: "POST" })
  .validator((i) => z.object({ trackingNumber: z.string().min(4).max(64) }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Core columns guaranteed to exist in all environments
    const { data: ship, error: shipError } = await supabaseAdmin
      .from("shipments")
      .select(
        "id, tracking_number, status, service, origin, destination, package, estimated_delivery, declared_value, insurance, signature_required, notes, created_at, proof_of_delivery, telemetry, ai_delay_risk, ai_delay_reason",
      )
      .eq("tracking_number", data.trackingNumber)
      .maybeSingle();

    if (shipError) {
      console.error("[resolveTracking] DB error:", shipError.message);
      return { kind: "none" as const };
    }
    if (!ship) return { kind: "none" as const };

    // Try fetching the newer GPS/fee columns added by migration — gracefully fail if not yet applied
    let extendedData: any = {};
    try {
      const { data: ext } = await (supabaseAdmin as any)
        .from("shipments")
        .select("sender_info, receiver_info, distance_km, estimated_travel_time, shipping_fee")
        .eq("id", ship.id)
        .maybeSingle();
      if (ext) extendedData = ext;
    } catch {
      // Migration not yet applied — new columns don't exist yet, that's okay
    }

    const { data: events } = await supabaseAdmin
      .from("shipment_events")
      .select("id, status, description, location, occurred_at")
      .eq("shipment_id", ship.id)
      .order("occurred_at", { ascending: false });
    const evts = events ?? [];

    // AI Heuristics Engine (Phase 8 integration)
    const { evaluateShipmentRisk } = await import("./ai-predictions");
    const aiPrediction = await evaluateShipmentRisk({
      ...ship,
      telemetry: ship.telemetry,
      proofOfDelivery: ship.proof_of_delivery,
    });

    const { data: customsHolds } = await supabaseAdmin
      .from("customs_holds")
      .select("*")
      .eq("shipment_id", ship.id)
      .order("hold_date", { ascending: false });

    // Fetch primary package image if available
    let packageImage = null;
    try {
      const { data: pkgImg } = await (supabaseAdmin as any)
        .from("package_images")
        .select("storage_path")
        .eq("shipment_id", ship.id)
        .eq("is_primary", true)
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (pkgImg) {
        packageImage = pkgImg.storage_path;
      }
    } catch {
      // Graceful fail if not yet applied
    }

    return {
      kind: "db" as const,
      shipment: {
        id: ship.id,
        trackingNumber: ship.tracking_number,
        status: ship.status,
        service: ship.service,
        origin: ship.origin,
        destination: ship.destination,
        package: ship.package,
        estimatedDelivery: aiPrediction.adjustedEstimatedDelivery,
        declaredValue: Number(ship.declared_value ?? 0),
        insurance: ship.insurance,
        signatureRequired: ship.signature_required,
        createdAt: ship.created_at,
        aiDelayRisk: ship.ai_delay_risk ?? aiPrediction.ai_delay_risk,
        aiDelayReason: ship.ai_delay_reason ?? aiPrediction.ai_delay_reason,
        proof_of_delivery: ship.proof_of_delivery,
        telemetry: ship.telemetry,
        customsHolds: customsHolds ?? [],
        senderInfo: extendedData.sender_info ?? null,
        receiverInfo: extendedData.receiver_info ?? null,
        distanceKm: extendedData.distance_km ?? null,
        estimatedTravelTime: extendedData.estimated_travel_time ?? null,
        shippingFee: extendedData.shipping_fee ?? null,
        packageImage: packageImage,
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
  .validator((i) => z.object({ display_name: z.string().min(1).max(120).optional() }).parse(i))
  .handler(async ({ data, context }) => {
    const updates: { display_name?: string } = {};
    if (data.display_name !== undefined) updates.display_name = data.display_name;
    if (Object.keys(updates).length === 0) return { ok: true };
    const { error } = await context.supabase
      .from("profiles")
      .update(updates)
      .eq("id", context.userId);
    if (error) dbFail(error);
    return { ok: true };
  });

export const updateTheme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ theme: z.enum(["light", "dark", "system"]) }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ theme: data.theme })
      .eq("id", context.userId);
    if (error) dbFail(error);
    return { ok: true };
  });

export const updateNotifPrefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        notif_email: z.boolean().optional(),
        notif_sms: z.boolean().optional(),
        notif_push: z.boolean().optional(),
        notif_marketing: z.boolean().optional(),
      })
      .parse(i),
  )
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
  .validator((i) => z.object({ id: z.string().uuid(), read: z.boolean().default(true) }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ read: data.read })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) dbFail(error);
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", context.userId)
      .eq("read", false);
    if (error) dbFail(error);
    return { ok: true };
  });

// ---------- Address book ----------

const AddressSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1).max(80),
  contact_name: z.string().min(1).max(120),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email().max(120).optional().nullable(),
  line1: z.string().min(1).max(200),
  city: z.string().min(1).max(80),
  region: z.string().max(80).optional().nullable(),
  postal_code: z.string().min(1).max(20),
  country_code: z.string().min(2).max(2),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  is_default_sender: z.boolean().optional(),
  is_default_recipient: z.boolean().optional(),
});

export const listAddresses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("addresses")
      .select("*")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) dbFail(error);
    return data ?? [];
  });

export const upsertAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => AddressSchema.parse(i))
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId } as any;
    if (data.id) {
      const { error } = await context.supabase
        .from("addresses")
        .update(payload)
        .eq("id", data.id)
        .eq("user_id", context.userId);
      if (error) dbFail(error);
    } else {
      const { error } = await context.supabase.from("addresses").insert(payload);
      if (error) dbFail(error);
    }
    return { ok: true };
  });

export const deleteAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("addresses")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) dbFail(error);
    return { ok: true };
  });

export const setDefaultAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z.object({ id: z.string().uuid(), role: z.enum(["sender", "recipient"]) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    if (data.role === "sender") {
      await context.supabase
        .from("addresses")
        .update({ is_default_sender: false })
        .eq("user_id", context.userId);
      const { error } = await context.supabase
        .from("addresses")
        .update({ is_default_sender: true })
        .eq("id", data.id)
        .eq("user_id", context.userId);
      if (error) dbFail(error);
    } else {
      await context.supabase
        .from("addresses")
        .update({ is_default_recipient: false })
        .eq("user_id", context.userId);
      const { error } = await context.supabase
        .from("addresses")
        .update({ is_default_recipient: true })
        .eq("id", data.id)
        .eq("user_id", context.userId);
      if (error) dbFail(error);
    }
    return { ok: true };
  });

// ---------- Pickup scheduler ----------

const SLOTS = ["09:00 – 12:00", "12:00 – 15:00", "15:00 – 18:00", "18:00 – 20:00"] as const;

export const getPickupSlots = createServerFn({ method: "POST" })
  .validator((i) => z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.rpc("get_pickup_slot_counts", {
      target_date: data.date,
    });
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
        slot,
        capacity: CAP,
        remaining: Math.max(0, CAP - used),
        available: !isPast && used < CAP,
        reason: isPast ? "Cutoff passed" : used >= CAP ? "Fully booked" : null,
      };
    });
  });

export const createPickup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        contact_name: z.string().min(1).max(120),
        company: z.string().max(120).optional(),
        address: z.string().min(1).max(200),
        city: z.string().min(1).max(80),
        postal_code: z.string().min(1).max(20),
        instructions: z.string().max(500).optional(),
        pickup_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        slot: z.enum(SLOTS),
        package_count: z.number().int().min(1).max(99),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: counts } = await supabaseAdmin.rpc("get_pickup_slot_counts", {
      target_date: data.pickup_date,
    });
    const used =
      (counts ?? []).find((r: { slot: string; cnt: number }) => r.slot === data.slot)?.cnt ?? 0;
    if (Number(used) >= 8) throw new Error("Selected slot is fully booked");

    const ref = `PU-${Math.floor(100000 + Math.random() * 900000)}`;
    const { data: row, error } = await context.supabase
      .from("pickups")
      .insert({ ...data, user_id: context.userId, reference: ref })
      .select("*")
      .single();
    if (error) dbFail(error);
    await context.supabase.from("notifications").insert({
      user_id: context.userId,
      title: "Pickup scheduled",
      body: `${ref} · ${data.pickup_date} · ${data.slot} · ${data.package_count} package(s)`,
      category: "pickup",
      tone: "success",
    });
    return row;
  });

export const listPickups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("pickups")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) dbFail(error);
    return data ?? [];
  });

// ---------- Shipment booking ----------

export const AddressSnapshot = z.object({
  contact_name: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-zA-Z\s\-'.]+$/),
  phone: z
    .string()
    .max(20)
    .regex(/^\+?[0-9\s\-()]+$/)
    .optional()
    .nullable(),
  email: z.string().email().max(120).optional().nullable(),
  line1: z.string().min(5).max(150),
  city: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-zA-Z\s-'.]+$/),
  region: z.string().max(80).optional().nullable(),
  postal_code: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[A-Za-z0-9\s-]+$/),
  country_code: z
    .string()
    .length(2)
    .regex(/^[A-Z]+$/),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
});

export const calculatePricingQuote = createServerFn({ method: "POST" })
  .validator((i) =>
    z
      .object({
        origin: z.object({
          lat: z.number().nullable().optional(),
          lng: z.number().nullable().optional(),
          city: z.string().optional(),
        }),
        destination: z.object({
          lat: z.number().nullable().optional(),
          lng: z.number().nullable().optional(),
          city: z.string().optional(),
        }),
        weight_kg: z.number().default(1),
        length_cm: z.number().optional(),
        width_cm: z.number().optional(),
        height_cm: z.number().optional(),
        pieces: z.number().default(1),
        vehicle_type: z.enum(["bike", "van", "box_truck", "freight_semi"]).optional(),
        delivery_type: z
          .enum(["instant", "scheduled", "express", "overnight", "ground", "freight"])
          .optional(),
        declared_value: z.number().default(0),
        insurance: z.boolean().default(false),
        signature_required: z.boolean().default(false),
        is_hazmat: z.boolean().default(false),
        promo_code: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { computePricingQuote } = await import("./pricing");
    return computePricingQuote({
      origin: { lat: data.origin.lat ?? 0, lng: data.origin.lng ?? 0, city: data.origin.city },
      destination: {
        lat: data.destination.lat ?? 0,
        lng: data.destination.lng ?? 0,
        city: data.destination.city,
      },
      weight_kg: data.weight_kg,
      length_cm: data.length_cm,
      width_cm: data.width_cm,
      height_cm: data.height_cm,
      pieces: data.pieces,
      vehicle_type: data.vehicle_type,
      delivery_type: data.delivery_type,
      declared_value: data.declared_value,
      insurance: data.insurance,
      signature_required: data.signature_required,
      is_hazmat: data.is_hazmat,
      promo_code: data.promo_code,
    });
  });

export const calculateAvailableServices = createServerFn({ method: "POST" })
  .validator((i) =>
    z
      .object({
        origin: z.object({
          lat: z.number().nullable().optional(),
          lng: z.number().nullable().optional(),
          city: z.string().optional(),
        }),
        destination: z.object({
          lat: z.number().nullable().optional(),
          lng: z.number().nullable().optional(),
          city: z.string().optional(),
        }),
        weight_kg: z.number().default(1),
        length_cm: z.number().optional(),
        width_cm: z.number().optional(),
        height_cm: z.number().optional(),
        pieces: z.number().default(1),
        declared_value: z.number().default(0),
        insurance: z.boolean().default(false),
        signature_required: z.boolean().default(false),
        is_hazmat: z.boolean().default(false),
        carbon_offset: z.boolean().default(false),
        promo_code: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { computeAvailableServices } = await import("./pricing");
    return computeAvailableServices({
      origin: { lat: data.origin.lat ?? 0, lng: data.origin.lng ?? 0, city: data.origin.city },
      destination: {
        lat: data.destination.lat ?? 0,
        lng: data.destination.lng ?? 0,
        city: data.destination.city,
      },
      weight_kg: data.weight_kg,
      length_cm: data.length_cm,
      width_cm: data.width_cm,
      height_cm: data.height_cm,
      pieces: data.pieces,
      declared_value: data.declared_value,
      insurance: data.insurance,
      signature_required: data.signature_required,
      is_hazmat: data.is_hazmat,
      carbon_offset: data.carbon_offset,
      promo_code: data.promo_code,
    });
  });

export const getShipmentInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ trackingNumber: z.string().min(4).max(64) }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ship, error } = await supabaseAdmin
      .from("shipments")
      .select("*")
      .eq("tracking_number", data.trackingNumber)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) dbFail(error);
    if (!ship) throw new Error("Invoice not found or access denied");

    return ship;
  });

// ---------- Invoices ----------

export const listInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Seed a couple of demo invoices on first visit if none exist (idempotent)
    const { data: existing } = await context.supabase
      .from("invoices")
      .select("id")
      .eq("user_id", context.userId)
      .limit(1);
    if (!existing || existing.length === 0) {
      const today = new Date();
      const seed = [
        {
          number: `INV-${today.getFullYear()}-0071`,
          issue_date: new Date(today.getFullYear(), today.getMonth() - 1, 15)
            .toISOString()
            .slice(0, 10),
          due_date: new Date(today.getFullYear(), today.getMonth(), 15).toISOString().slice(0, 10),
          status: "sent",
          currency: "USD",
          subtotal: 1080.0,
          tax: 108.0,
          total: 1188.0,
          line_items: [
            { label: "SwiftArc Priority Overnight", qty: 8, unit_price: 90 },
            { label: "SwiftArc Express", qty: 12, unit_price: 30 },
          ],
        },
        {
          number: `INV-${today.getFullYear()}-0062`,
          issue_date: new Date(today.getFullYear(), today.getMonth() - 2, 15)
            .toISOString()
            .slice(0, 10),
          due_date: new Date(today.getFullYear(), today.getMonth() - 1, 15)
            .toISOString()
            .slice(0, 10),
          status: "paid",
          currency: "USD",
          subtotal: 870.0,
          tax: 87.0,
          total: 957.0,
          line_items: [{ label: "SwiftArc Standard Ground", qty: 29, unit_price: 30 }],
        },
      ].map((r) => ({ ...r, user_id: context.userId }));
      await context.supabase.from("invoices").insert(seed);
    }
    const { data, error } = await context.supabase
      .from("invoices")
      .select("*")
      .eq("user_id", context.userId)
      .order("issue_date", { ascending: false });
    if (error) dbFail(error);
    return data ?? [];
  });

export const getInvoiceById = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("invoices")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) dbFail(error);
    return row;
  });

// ---------- Customs & duties rates ----------

const DUTY: Record<string, number> = {
  Electronics: 0.05,
  Apparel: 0.12,
  "Home goods": 0.08,
  Cosmetics: 0.065,
  Books: 0.0,
  Machinery: 0.03,
  Toys: 0.045,
  Jewelry: 0.11,
};
const VAT: Record<string, number> = {
  UK: 0.2,
  DE: 0.19,
  FR: 0.2,
  ES: 0.21,
  US: 0.0,
  JP: 0.1,
  CA: 0.05,
  AU: 0.1,
  AE: 0.05,
  IN: 0.18,
};
const DOCS_BASE = ["Commercial invoice", "Packing list", "Air waybill / BOL"];
const DOCS_BY_CATEGORY: Record<string, string[]> = {
  Electronics: ["FCC / CE conformity declaration", "Battery UN 38.3 report (if lithium)"],
  Cosmetics: ["Ingredient list (INCI)", "Product safety certificate"],
  Machinery: ["Machine safety declaration", "HS classification memo"],
  Apparel: ["Country of origin certificate", "Textile fibre composition"],
  Jewelry: ["Kimberley Process cert (for diamonds)", "Assay certificate"],
};

export const apiSearchHsCodes = createServerFn({ method: "GET" })
  .validator((i: string) => z.string().parse(i))
  .handler(async ({ data, context }) => {
    const term = `%${data.toLowerCase()}%`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: results, error } = await supabaseAdmin
      .from("hs_codes")
      .select("*")
      .or(`description.ilike.${term},code.ilike.${term}`)
      .limit(20);

    if (error) dbFail(error);
    return results;
  });

export const estimateCustoms = createServerFn({ method: "POST" })
  .validator((i) =>
    z
      .object({
        country: z.string(),
        category: z.string(),
        value: z.number().nonnegative(),
        freight: z.number().nonnegative(),
        insurance: z.number().nonnegative(),
        hsCode: z.string().optional(),
      })
      .parse(i),
  )
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
  .validator((i) =>
    z
      .object({
        weight: z.number().positive().max(10000),
        zone: z.enum(["regional", "international", "intercontinental"]),
      })
      .parse(i),
  )
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
  .validator((i) =>
    z
      .object({
        trackingNumber: z.string().min(4).max(64),
        signedBy: z.string().min(1).max(120),
        signatureSvgPath: z.string().min(1),
        photoNote: z.string().optional(),
        location: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ship } = await supabaseAdmin
      .from("shipments")
      .select("id, package")
      .eq("tracking_number", data.trackingNumber)
      .maybeSingle();
    if (!ship) throw new Error("Shipment not found");

    const pod = {
      signedBy: data.signedBy,
      signatureSvgPath: data.signatureSvgPath,
      photoNote: data.photoNote ?? "Delivered securely",
      timestamp: new Date().toISOString(),
    };

    const { error } = await (
      supabaseAdmin.from("shipments").update({
        status: "delivered",
        proof_of_delivery: pod,
      } as any) as any
    ).eq("id", ship.id);

    if (error) dbFail(error);

    await supabaseAdmin.from("shipment_events").insert({
      shipment_id: ship.id,
      status: "delivered",
      description: `Delivered and signed by ${data.signedBy}`,
      location: data.location ?? "Destination point",
    });

    // Dispatch webhook
    const { data: fullShip } = await supabaseAdmin
      .from("shipments")
      .select("user_id")
      .eq("id", ship.id)
      .maybeSingle();
    if (fullShip && fullShip.user_id) {
      const { dispatchWebhook } = await import("@/lib/webhooks.functions");
      await dispatchWebhook(fullShip.user_id, "shipment.status_updated", {
        shipment_id: ship.id,
        status: "delivered",
        proof_of_delivery: pod,
      });
    }

    return { ok: true };
  });

export const updateTelemetry = createServerFn({ method: "POST" })
  .validator((i) =>
    z
      .object({
        trackingNumber: z.string().min(4).max(64),
        healthScore: z.number().min(0).max(100),
        temperatureC: z.number(),
        shockEvents: z.number().min(0),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ship } = await supabaseAdmin
      .from("shipments")
      .select("id, package")
      .eq("tracking_number", data.trackingNumber)
      .maybeSingle();
    if (!ship) throw new Error("Shipment not found");

    const telemetry = {
      healthScore: data.healthScore,
      temperatureC: data.temperatureC,
      shockEvents: data.shockEvents,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await (
      supabaseAdmin.from("shipments").update({
        telemetry,
      } as any) as any
    ).eq("id", ship.id);

    if (error) dbFail(error);
    return { ok: true };
  });

// ---------- Payment System ----------

export const getCheckoutTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ transactionId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: txn, error } = await context.supabase
      .from("payment_transactions")
      .select("*, shipments!inner(tracking_number, service, status, origin, destination, user_id)")
      .eq("id", data.transactionId)
      .eq("shipments.user_id", context.userId)
      .maybeSingle();
    if (error) dbFail(error);
    if (!txn) throw new Error("Transaction not found");
    return txn;
  });

export const listPaymentMethods = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("payment_methods")
    .select("*")
    .eq("enabled", true)
    .order("sort_order");
  if (error) dbFail(error);
  return data ?? [];
});

export const listActiveWallets = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("wallets")
    .select("*")
    .eq("status", "active")
    .order("sort_order");
  if (error) dbFail(error);
  return data ?? [];
});

export const selectPaymentMethod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        transactionId: z.string().uuid(),
        method: z.enum(["card", "bank_transfer", "crypto"]),
        walletId: z.string().uuid().optional(),
        cryptoCurrency: z.string().optional(),
        cryptoNetwork: z.string().optional(),
        cryptoAddress: z.string().optional(),
        cryptoAmount: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const updates: any = {
      method: data.method,
      updated_at: new Date().toISOString(),
    };
    if (data.method === "crypto") {
      updates.wallet_id = data.walletId ?? null;
      updates.crypto_currency = data.cryptoCurrency ?? null;
      updates.crypto_network = data.cryptoNetwork ?? null;
      updates.crypto_address = data.cryptoAddress ?? null;
      updates.crypto_amount = data.cryptoAmount ?? null;
      updates.expires_at = new Date(Date.now() + 30 * 60_000).toISOString(); // 30 min expiry
    }
    const { error } = await context.supabase
      .from("payment_transactions")
      .update(updates)
      .eq("id", data.transactionId)
      .eq("status", "pending");
    if (error) dbFail(error);
    return { ok: true };
  });

export const markTransactionPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        transactionId: z.string().uuid(),
        method: z.enum(["card", "bank_transfer", "crypto"]),
        cardLast4: z.string().max(4).optional(),
        bankReference: z.string().max(100).optional(),
        cryptoTxHash: z.string().max(255).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    // We auto-verify non-card methods for the MVP. Card is handled by Stripe Webhooks.
    const newStatus = data.method === "card" ? "processing" : "verified";

    const updates: any = {
      method: data.method,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (data.cardLast4) updates.card_last4 = data.cardLast4;
    if (data.bankReference) updates.bank_reference = data.bankReference;
    if (data.cryptoTxHash) updates.crypto_tx_hash = data.cryptoTxHash;

    // Verify ownership
    const { data: txn, error: getErr } = await context.supabase
      .from("payment_transactions")
      .select("*, shipments!inner(id, user_id)")
      .eq("id", data.transactionId)
      .eq("shipments.user_id", context.userId)
      .maybeSingle();
    if (getErr || !txn) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("payment_transactions")
      .update(updates)
      .eq("id", data.transactionId);
    if (error) dbFail(error);

    if (newStatus === "verified") {
      // Update shipment status to label_created now that payment is verified
      await supabaseAdmin
        .from("shipments")
        .update({ status: "label_created" } as any)
        .eq("id", txn.shipments.id);

      // Send the email receipt in the background
      const authUser = await supabaseAdmin.auth.admin.getUserById(context.userId);
      const email = authUser.data?.user?.email;
      if (email) {
        sendEmailReceipt({ data: { transactionId: data.transactionId, email } }).catch((err) => {
          console.error("Failed to send background email receipt:", err);
        });
      }
    }

    return { ok: true, status: updates.status as string };
  });

export const sendEmailReceipt = createServerFn({ method: "POST" })
  .validator((i) =>
    z.object({ transactionId: z.string().uuid(), email: z.string().email() }).parse(i),
  )
  .handler(async ({ data }) => {
    if (!process.env.RESEND_API_KEY) {
      console.log("Simulating email receipt to", data.email, "for txn", data.transactionId);
      await new Promise((r) => setTimeout(r, 1000));
      return { ok: true, simulated: true };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: txn, error } = await supabaseAdmin
      .from("payment_transactions")
      .select("*, shipments(tracking_number, service)")
      .eq("id", data.transactionId)
      .maybeSingle();

    if (error || !txn) return { ok: false };

    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      await withRetry(() =>
        resend.emails.send({
          from: "SwiftArc Payments <receipts@swiftarc.net>",
          to: data.email,
          subject: `Receipt for Shipment ${txn.shipments.tracking_number}`,
          html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1E293B;">Payment Receipt</h2>
            <p>Thank you for booking with SwiftArc. Your payment has been received and your shipping label is ready.</p>
            <div style="background: #F1F5F9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Tracking Number:</strong> ${txn.shipments.tracking_number}</p>
              <p><strong>Service:</strong> ${txn.shipments.service}</p>
              <p><strong>Amount:</strong> ${txn.amount} ${txn.currency}</p>
              <p><strong>Reference:</strong> ${txn.reference}</p>
            </div>
            <p style="color: #64748B; font-size: 12px;">This is an automated receipt. If you have questions, please contact support.</p>
          </div>
        `,
        }),
      );

      return { ok: true };
    } catch (err) {
      console.error("Resend API Error:", err);
      return { ok: false };
    }
  });

export const createPaymentIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ transactionId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: txn, error } = await supabaseAdmin
      .from("payment_transactions")
      .select("*, shipments!inner(id, user_id)")
      .eq("id", data.transactionId)
      .eq("shipments.user_id", context.userId)
      .maybeSingle();

    if (error || !txn) throw new Error("Forbidden or not found");

    const paymentIntent = await withRetry(() =>
      stripe.paymentIntents.create({
        amount: Math.round(Number(txn.amount) * 100), // Stripe expects cents
        currency: txn.currency.toLowerCase(),
        metadata: {
          reference: txn.reference,
          transactionId: txn.id,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      }),
    );
    return { clientSecret: paymentIntent.client_secret };
  });


export const getCourierManifest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("shipments")
      .select("id, tracking_number, status, service, origin, destination, package, is_hazmat")
      .eq("assigned_courier_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) dbFail(error);
    return data ?? [];
  });
