/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function fail(err: unknown, msg = "Operation failed."): never {
  console.error("[admin]", err);
  throw new Error(msg);
}

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
      supabaseAdmin
        .from("chat_conversations")
        .select("id", { count: "estimated", head: true })
        .eq("status", "open"),
    ]);

    const d = new Date();
    d.setDate(d.getDate() - 7);
    const { data: recentAll } = await supabaseAdmin
      .from("shipments")
      .select("created_at")
      .gte("created_at", d.toISOString());

    const volumeByDay = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split("T")[0];
      const count = (recentAll || []).filter((s: any) => s.created_at.startsWith(dateStr)).length;
      return { date: dateStr, volume: count };
    });

    const { data: recent } = await supabaseAdmin
      .from("shipments")
      .select("id, tracking_number, status, service, created_at")
      .order("created_at", { ascending: false })
      .limit(8);

    const { data: exceptions } = await supabaseAdmin
      .from("shipments")
      .select("id, tracking_number, status, service, created_at")
      .eq("status", "exception")
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: invoiceTotals } = await supabaseAdmin.from("invoices").select("status, total");

    let grossRevenue = 0;
    let outstandingRevenue = 0;
    (invoiceTotals || []).forEach((inv: any) => {
      if (inv.status === "paid") grossRevenue += Number(inv.total);
      else if (inv.status !== "void") outstandingRevenue += Number(inv.total);
    });

    return {
      counts: {
        users: users.count ?? 0,
        shipments: shipments.count ?? 0,
        pickups: pickups.count ?? 0,
        invoices: invoices.count ?? 0,
        openChats: convos.count ?? 0,
      },
      revenue: {
        gross: grossRevenue,
        outstanding: outstandingRevenue,
      },
      volumeByDay,
      recentShipments: recent ?? [],
      criticalExceptions: exceptions ?? [],
      courierPerformance: [
        { name: "Marcus Johnson", deliveries: 142, sla: 98.5, avgTime: "1.2h" },
        { name: "Sarah Chen", deliveries: 118, sla: 99.1, avgTime: "1.1h" },
        { name: "David Kim", deliveries: 95, sla: 96.0, avgTime: "1.5h" },
        { name: "Alex Rivera", deliveries: 84, sla: 97.2, avgTime: "1.3h" },
      ],
    };
  });

// ---------- Analytics ----------

export const adminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Revenue over 30 days
    const thirtyAgo = new Date();
    thirtyAgo.setDate(thirtyAgo.getDate() - 30);

    const [invoiceRes, shipmentRes, userRes] = await Promise.all([
      supabaseAdmin
        .from("invoices")
        .select("status, total, created_at")
        .gte("created_at", thirtyAgo.toISOString()),
      supabaseAdmin
        .from("shipments")
        .select("status, service, origin, destination, created_at")
        .gte("created_at", thirtyAgo.toISOString()),
      supabaseAdmin
        .from("profiles")
        .select("id, created_at")
        .gte("created_at", thirtyAgo.toISOString()),
    ]);

    const invoices = invoiceRes.data ?? [];
    const shipments = shipmentRes.data ?? [];
    const newUsers = userRes.data ?? [];

    // Revenue by day (last 30 days)
    const revenueByDay = Array.from({ length: 30 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateStr = date.toISOString().split("T")[0];
      const dayRevenue = invoices
        .filter((inv: any) => inv.created_at.startsWith(dateStr) && inv.status === "paid")
        .reduce((sum: number, inv: any) => sum + Number(inv.total), 0);
      return { date: dateStr, revenue: dayRevenue };
    });

    // Shipments by service
    const serviceMap: Record<string, number> = {};
    shipments.forEach((s: any) => {
      serviceMap[s.service] = (serviceMap[s.service] || 0) + 1;
    });
    const byService = Object.entries(serviceMap).map(([name, value]) => ({ name, value }));

    // Status breakdown
    const statusMap: Record<string, number> = {};
    shipments.forEach((s: any) => {
      statusMap[s.status] = (statusMap[s.status] || 0) + 1;
    });
    const byStatus = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

    // Top destinations
    const destMap: Record<string, number> = {};
    shipments.forEach((s: any) => {
      const city = s.destination?.city || "Unknown";
      destMap[city] = (destMap[city] || 0) + 1;
    });
    const topDestinations = Object.entries(destMap)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // New users by day (last 14 days)
    const usersByDay = Array.from({ length: 14 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      const dateStr = date.toISOString().split("T")[0];
      const count = newUsers.filter((u: any) => u.created_at.startsWith(dateStr)).length;
      return { date: dateStr, users: count };
    });

    // Summary stats
    const totalRevenue = invoices
      .filter((i: any) => i.status === "paid")
      .reduce((s: number, i: any) => s + Number(i.total), 0);
    const totalShipments = shipments.length;
    const deliveredCount = shipments.filter((s: any) => s.status === "delivered").length;
    const exceptionCount = shipments.filter((s: any) => s.status === "exception").length;
    const deliveryRate =
      totalShipments > 0 ? Math.round((deliveredCount / totalShipments) * 100) : 0;

    return {
      revenueByDay,
      byService,
      byStatus,
      topDestinations,
      usersByDay,
      summary: {
        totalRevenue,
        totalShipments,
        deliveredCount,
        exceptionCount,
        deliveryRate,
        newUserCount: newUsers.length,
      },
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

    const userIds = profiles?.map((p) => p.id) || [];
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

export const listAdminShipments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("shipments")
      .select("id, tracking_number, status, service, origin, destination, created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) fail(error);
    return data ?? [];
  });

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "moderator", "user"]),
        grant: z.boolean(),
      })
      .parse(i),
  )
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
    await writeAuditLog({
      action: data.grant ? "User Role Granted" : "User Role Revoked",
      actor: context.userId,
      actor_id: context.userId,
      target: data.userId,
      details: { role: data.role, grant: data.grant },
      severity: "warning",
    });
    return { ok: true };
  });
export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) fail(error);
    await writeAuditLog({
      action: "User Account Deleted",
      actor: context.userId,
      actor_id: context.userId,
      target: data.id,
      severity: "critical",
    });
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
      .select(
        "id, tracking_number, user_id, status, service, origin, destination, estimated_delivery, created_at, assigned_courier_id, volumetric_weight, is_hazmat, ai_delay_risk, ai_delay_reason",
      )
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) fail(error);
    return data ?? [];
  });

export const adminUpdateShipmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.string().min(1).max(40),
        note: z.string().max(500).optional(),
      })
      .parse(i),
  )
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

    // Dispatch webhook
    const { data: ship } = await supabaseAdmin
      .from("shipments")
      .select("user_id, tracking_number, service")
      .eq("id", data.id)
      .maybeSingle();
    if (ship && ship.user_id) {
      const { dispatchWebhook } = await import("@/lib/webhooks.functions");
      await dispatchWebhook(ship.user_id, "shipment.status_updated", {
        shipment_id: data.id,
        status: data.status,
        note: data.note,
      });

      // Send lifecycle email notification for key status milestones
      const emailStatuses = [
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "exception",
      ];
      if (emailStatuses.includes(data.status)) {
        try {
          const authUser = await supabaseAdmin.auth.admin.getUserById(ship.user_id);
          const email = authUser.data?.user?.email;
          if (email && process.env.RESEND_API_KEY) {
            const { Resend } = await import("resend");
            const resend = new Resend(process.env.RESEND_API_KEY);
            const subjectMap: Record<string, string> = {
              picked_up: "Your shipment has been picked up",
              in_transit: "Your shipment is in transit",
              out_for_delivery: "Your shipment is out for delivery",
              delivered: "Your shipment has been delivered",
              exception: "There is an issue with your shipment",
            };
            const bodyMap: Record<string, string> = {
              picked_up:
                "Your package has been collected and is on its way to the sorting facility.",
              in_transit:
                "Your package is moving through our logistics network and is on schedule.",
              out_for_delivery: "Your package is with a local courier and will be delivered today.",
              delivered:
                "Your package has been successfully delivered. Thank you for shipping with SwiftArc.",
              exception:
                "We encountered an issue with your shipment. Our team is working to resolve it. Please contact support if you need help.",
            };
            resend.emails
              .send({
                from: "SwiftArc Notifications <notifications@swiftarc.net>",
                to: email,
                subject: `${subjectMap[data.status]} — ${ship.tracking_number}`,
                html: `
                <div style="font-family: 'Inter', 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 0;">
                  <div style="background: linear-gradient(135deg, #07162C 0%, #0F2847 100%); padding: 32px 24px; border-radius: 12px 12px 0 0;">
                    <h1 style="color: #F5A623; font-size: 20px; margin: 0;">SwiftArc</h1>
                    <p style="color: #E2E8F0; font-size: 13px; margin: 4px 0 0;">Shipment Update</p>
                  </div>
                  <div style="background: #FFFFFF; padding: 28px 24px; border: 1px solid #E2E8F0; border-top: none;">
                    <h2 style="color: #1E293B; font-size: 18px; margin: 0 0 8px;">${subjectMap[data.status]}</h2>
                    <p style="color: #64748B; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">${bodyMap[data.status]}</p>
                    <div style="background: #F8FAFC; padding: 16px; border-radius: 8px; margin: 0 0 20px;">
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="color: #94A3B8; font-size: 12px; padding: 4px 0;">Tracking Number</td><td style="color: #1E293B; font-size: 14px; font-weight: 600; text-align: right;">${ship.tracking_number}</td></tr>
                        <tr><td style="color: #94A3B8; font-size: 12px; padding: 4px 0;">Service</td><td style="color: #1E293B; font-size: 14px; text-align: right;">${ship.service}</td></tr>
                        <tr><td style="color: #94A3B8; font-size: 12px; padding: 4px 0;">Status</td><td style="color: #1E293B; font-size: 14px; font-weight: 600; text-align: right;">${data.status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</td></tr>
                        ${data.note ? `<tr><td style="color: #94A3B8; font-size: 12px; padding: 4px 0;">Note</td><td style="color: #1E293B; font-size: 14px; text-align: right;">${data.note}</td></tr>` : ""}
                      </table>
                    </div>
                    <a href="https://swiftarc.net/tracking/${ship.tracking_number}" style="display: inline-block; background: #F5A623; color: #07162C; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Track Your Shipment</a>
                  </div>
                  <div style="background: #F8FAFC; padding: 16px 24px; border-radius: 0 0 12px 12px; border: 1px solid #E2E8F0; border-top: none;">
                    <p style="color: #94A3B8; font-size: 11px; margin: 0; text-align: center;">SwiftArc Global Logistics. This is an automated notification.</p>
                  </div>
                </div>
              `,
              })
              .catch((err) => console.error("Status email send error:", err));
          }
        } catch (emailErr) {
          console.error("Email notification error:", emailErr);
        }
      }
    }

    return { ok: true };
  });

export const adminCreateShipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        sender_id: z.string().uuid().optional(),
        sender_info: z.any().optional(),
        receiver_info: z.any().optional(),
        service: z.string(),
        origin: z.any(),
        destination: z.any(),
        package: z.any(),
        declared_value: z.number().default(0),
        insurance: z.boolean().default(false),
        is_hazmat: z.boolean().default(false),
        signature_required: z.boolean().default(false),
        verification_status: z
          .enum(["pending", "verified", "requires_review", "rejected"])
          .default("pending"),
        verification_notes: z.string().optional(),
        route_stops: z.array(z.any()).optional(),
        origin_source: z
          .enum(["gps", "branch", "manual", "map_adjustment"])
          .default("manual"),
        origin_branch_id: z.string().uuid().optional(),
        origin_accuracy_m: z.number().optional(),
        distance_km: z.number().optional().nullable(),
        estimated_travel_time: z.string().optional().nullable(),
        shipping_fee: z.number().optional().nullable(),
        package_image_path: z.string().optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // --- Server-side validation ---
    const origin = data.origin as any;
    const dest = data.destination as any;
    const pkg = data.package as any;
    if (!origin?.city) throw new Error("Origin city is required.");
    if (!dest?.city) throw new Error("Destination city is required.");
    if (!pkg?.weight_kg || pkg.weight_kg <= 0) throw new Error("Package weight is required.");
    if (!data.service) throw new Error("Service level is required.");

    // --- Generate tracking number server-side (collision-resistant) ---
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let tracking_number = "";
    for (let attempt = 0; attempt < 10; attempt++) {
      let code = "SWF-";
      const { randomBytes } = await import("node:crypto");
      const bytes = randomBytes(12);
      for (let i = 0; i < 12; i++) {
        code += chars[bytes[i] % chars.length];
      }
      // Check uniqueness
      const { data: existing } = await supabaseAdmin
        .from("shipments")
        .select("id")
        .eq("tracking_number", code)
        .maybeSingle();
      if (!existing) {
        tracking_number = code;
        break;
      }
    }
    if (!tracking_number) throw new Error("Failed to generate unique tracking number.");

    // --- Calculate distance if coordinates available ---
    let distance_km = data.distance_km ?? null;
    let estimated_travel_time = data.estimated_travel_time ?? null;
    if (
      !distance_km &&
      origin?.lat && origin?.lng && dest?.lat && dest?.lng
    ) {
      try {
        const routeRes = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=false`,
        );
        if (routeRes.ok) {
          const routeData = await routeRes.json();
          if (routeData.routes?.[0]) {
            distance_km = Math.round((routeData.routes[0].distance / 1000) * 100) / 100;
            const secs = routeData.routes[0].duration;
            const h = Math.floor(secs / 3600);
            const m = Math.floor((secs % 3600) / 60);
            estimated_travel_time = h > 0 ? `${h}h ${m}m` : `${m}m`;
          }
        }
      } catch {
        // Fallback: Haversine
        const R = 6371;
        const dLat = ((dest.lat - origin.lat) * Math.PI) / 180;
        const dLng = ((dest.lng - origin.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((origin.lat * Math.PI) / 180) *
            Math.cos((dest.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        const straight = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance_km = Math.round(straight * 1.3 * 100) / 100; // 1.3x correction
        const estHours = distance_km / 60;
        const h = Math.floor(estHours);
        const m = Math.round((estHours - h) * 60);
        estimated_travel_time = h > 0 ? `${h}h ${m}m` : `${m}m`;
      }
    }

    // --- Calculate shipping fee from pricing rules ---
    let shipping_fee = data.shipping_fee ?? 0;
    if (!data.shipping_fee && distance_km) {
      try {
        const { data: rules } = await supabaseAdmin
          .from("pricing_rules")
          .select("*")
          .eq("id", "00000000-0000-0000-0000-000000000001")
          .single();
        if (rules) {
          const baseFee = Number(rules.base_fee) || 0;
          const perKm = Number(rules.per_km_rate) || 0;
          const perKg = Number(rules.per_kg_rate) || 0;
          const taxRate = Number(rules.tax_rate) || 0;
          const insuranceRate = Number(rules.insurance_rate) || 0;
          const hazmatSurcharge = Number(rules.hazmat_surcharge) || 0;
          const signatureFee = Number(rules.signature_fee) || 0;

          let subtotal = baseFee + distance_km * perKm + (pkg.weight_kg || 0) * perKg;
          if (data.insurance) subtotal += (data.declared_value * insuranceRate) / 100;
          if (data.is_hazmat) subtotal += hazmatSurcharge;
          if (data.signature_required) subtotal += signatureFee;
          shipping_fee = Math.round((subtotal + subtotal * (taxRate / 100)) * 100) / 100;
        }
      } catch { /* pricing rules may not exist yet */ }
    }

    // --- Calculate estimated delivery ---
    let estimated_delivery: string | null = null;
    try {
      const { data: svc } = await (supabaseAdmin as any)
        .from("shipment_services")
        .select("estimated_days_min, estimated_days_max")
        .eq("name", data.service)
        .maybeSingle();
      if (svc) {
        const avgDays = Math.ceil(((svc.estimated_days_min || 3) + (svc.estimated_days_max || 7)) / 2);
        const d = new Date();
        d.setDate(d.getDate() + avgDays);
        estimated_delivery = d.toISOString();
      }
    } catch { /* service table may not exist */ }

    // --- Insert shipment ---
    const { data: inserted, error } = await supabaseAdmin
      .from("shipments")
      .insert({
        tracking_number,
        service: data.service,
        status: "label_created",
        origin: data.origin as any,
        destination: data.destination as any,
        user_id: data.sender_id || context.userId,
        receiver_info: data.receiver_info,
        package: data.package,
        declared_value: data.declared_value,
        insurance: data.insurance,
        is_hazmat: data.is_hazmat,
        signature_required: data.signature_required,
        verification_status: data.verification_status,
        verification_notes: data.verification_notes,
        verified_by: data.verification_status === "verified" ? context.userId : null,
        verified_at: data.verification_status === "verified" ? new Date().toISOString() : null,
        created_by: context.userId,
        route_stops: data.route_stops || [],
        estimated_delivery,
        origin_source: data.origin_source,
        origin_branch_id: data.origin_branch_id || null,
        origin_accuracy_m: data.origin_accuracy_m || null,
        distance_km,
        estimated_travel_time,
        shipping_fee,
      } as any)
      .select()
      .single();
    if (error) fail(error);

    // --- Create initial tracking event ---
    const originLabel =
      origin.contact_name
        ? `${origin.contact_name}, ${origin.city || ""}`
        : origin.city || "Origin Office";
    await supabaseAdmin.from("shipment_events").insert({
      shipment_id: inserted!.id,
      status: "label_created",
      description: "Shipment Registered — Package accepted at " + originLabel,
      location: origin.city ? `${origin.city}, ${origin.country_code || origin.region || ""}`.trim() : "Office",
      occurred_at: new Date().toISOString(),
    });

    // --- Create package image if provided ---
    if (data.package_image_path) {
      await (supabaseAdmin as any).from("package_images").insert({
        shipment_id: inserted!.id,
        storage_path: data.package_image_path,
        is_primary: true,
        uploaded_by: context.userId,
      });
    }

    return { ok: true, shipment: inserted };
  });

// ---------- Branch / Location Helpers ----------

export const adminListBranches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("locations")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (error) fail(error);
    return data ?? [];
  });

export const adminCalculateRoute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        origin_lat: z.number(),
        origin_lng: z.number(),
        dest_lat: z.number(),
        dest_lng: z.number(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${data.origin_lng},${data.origin_lat};${data.dest_lng},${data.dest_lat}?overview=false`,
      );
      if (res.ok) {
        const json = await res.json();
        if (json.routes?.[0]) {
          const dist = Math.round((json.routes[0].distance / 1000) * 100) / 100;
          const secs = json.routes[0].duration;
          const h = Math.floor(secs / 3600);
          const m = Math.floor((secs % 3600) / 60);
          return {
            distance_km: dist,
            duration_text: h > 0 ? `${h}h ${m}m` : `${m}m`,
            source: "osrm" as const,
          };
        }
      }
    } catch { /* fall through to haversine */ }

    // Haversine fallback
    const R = 6371;
    const dLat = ((data.dest_lat - data.origin_lat) * Math.PI) / 180;
    const dLng = ((data.dest_lng - data.origin_lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((data.origin_lat * Math.PI) / 180) *
        Math.cos((data.dest_lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const straight = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = Math.round(straight * 1.3 * 100) / 100;
    const estH = Math.floor(dist / 60);
    const estM = Math.round((dist / 60 - estH) * 60);
    return {
      distance_km: dist,
      duration_text: estH > 0 ? `${estH}h ${estM}m` : `${estM}m`,
      source: "haversine" as const,
    };
  });

export const adminCalculatePrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        distance_km: z.number(),
        weight_kg: z.number(),
        declared_value: z.number().default(0),
        insurance: z.boolean().default(false),
        is_hazmat: z.boolean().default(false),
        signature_required: z.boolean().default(false),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rules, error } = await supabaseAdmin
      .from("pricing_rules")
      .select("*")
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .single();
    if (error || !rules) return { breakdown: null, total: 0, error: "Pricing rules not configured." };

    const baseFee = Number(rules.base_fee) || 0;
    const distCharge = data.distance_km * (Number(rules.per_km_rate) || 0);
    const weightCharge = data.weight_kg * (Number(rules.per_kg_rate) || 0);
    const insuranceCharge = data.insurance
      ? (data.declared_value * (Number(rules.insurance_rate) || 0)) / 100
      : 0;
    const hazmatCharge = data.is_hazmat ? Number(rules.hazmat_surcharge) || 0 : 0;
    const signatureCharge = data.signature_required ? Number(rules.signature_fee) || 0 : 0;
    const subtotal = baseFee + distCharge + weightCharge + insuranceCharge + hazmatCharge + signatureCharge;
    const taxRate = Number(rules.tax_rate) || 0;
    const tax = subtotal * (taxRate / 100);
    const total = Math.round((subtotal + tax) * 100) / 100;

    return {
      breakdown: {
        base_fee: Math.round(baseFee * 100) / 100,
        distance_charge: Math.round(distCharge * 100) / 100,
        weight_charge: Math.round(weightCharge * 100) / 100,
        insurance_charge: Math.round(insuranceCharge * 100) / 100,
        hazmat_charge: Math.round(hazmatCharge * 100) / 100,
        signature_charge: Math.round(signatureCharge * 100) / 100,
        subtotal: Math.round(subtotal * 100) / 100,
        tax_rate: taxRate,
        tax: Math.round(tax * 100) / 100,
      },
      total,
    };
  });

export const adminUpdateShipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        id: z.string().uuid(),
        tracking_number: z.string().optional(),
        service: z.string().optional(),
        status: z.string().optional(),
        assigned_courier_id: z.string().uuid().nullable().optional(),
        note: z.string().optional(),
        origin: z.any().optional(),
        destination: z.any().optional(),
        package: z.any().optional(),
        estimated_delivery: z.string().nullable().optional(),
        declared_value: z.number().optional(),
        insurance: z.boolean().optional(),
        is_hazmat: z.boolean().optional(),
        signature_required: z.boolean().optional(),
        notes: z.string().nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Build update payload, only including provided fields
    const update: Record<string, any> = {};
    if (data.tracking_number !== undefined) update.tracking_number = data.tracking_number;
    if (data.service !== undefined) update.service = data.service;
    if (data.status !== undefined) update.status = data.status;
    if (data.assigned_courier_id !== undefined)
      update.assigned_courier_id = data.assigned_courier_id;
    if (data.origin !== undefined) update.origin = data.origin;
    if (data.destination !== undefined) update.destination = data.destination;
    if (data.package !== undefined) update.package = data.package;
    if (data.estimated_delivery !== undefined) update.estimated_delivery = data.estimated_delivery;
    if (data.declared_value !== undefined) update.declared_value = data.declared_value;
    if (data.insurance !== undefined) update.insurance = data.insurance;
    if (data.is_hazmat !== undefined) update.is_hazmat = data.is_hazmat;
    if (data.signature_required !== undefined) update.signature_required = data.signature_required;
    if (data.notes !== undefined) update.notes = data.notes;

    if (Object.keys(update).length > 0) {
      const { error } = await supabaseAdmin
        .from("shipments")
        .update(update as any)
        .eq("id", data.id);
      if (error) fail(error);
    }

    if (data.note) {
      await supabaseAdmin.from("shipment_events").insert({
        shipment_id: data.id,
        status: data.status ?? "updated",
        description: data.note,
        occurred_at: new Date().toISOString(),
      });
    }
    return { ok: true };
  });

// ---------- Shipment Events CRUD ----------

export const adminGetShipmentDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: shipment, error } = await supabaseAdmin
      .from("shipments")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) fail(error);
    if (!shipment) throw new Error("Shipment not found");

    const { data: events } = await supabaseAdmin
      .from("shipment_events")
      .select("*")
      .eq("shipment_id", data.id)
      .order("occurred_at", { ascending: false });

    return { shipment, events: events ?? [] };
  });

export const adminCreateShipmentEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        shipment_id: z.string().uuid(),
        status: z.string().min(1),
        description: z.string().min(1),
        location: z.string().nullable().optional(),
        occurred_at: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("shipment_events").insert({
      shipment_id: data.shipment_id,
      status: data.status,
      description: data.description,
      location: data.location ?? null,
      occurred_at: data.occurred_at ?? new Date().toISOString(),
    });
    if (error) fail(error);
    return { ok: true };
  });

export const adminUpdateShipmentLocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        shipment_id: z.string().uuid(),
        city: z.string().min(1),
        country: z.string().min(1),
        lat: z.number(),
        lng: z.number(),
        status_label: z.string().min(1),
        new_status: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Insert a tracking event for the new location
    const locationStr = `${data.city}, ${data.country}`;
    const { error: evErr } = await supabaseAdmin.from("shipment_events").insert({
      shipment_id: data.shipment_id,
      status: data.status_label,
      description: `Package arrived at ${locationStr}`,
      location: locationStr,
      occurred_at: new Date().toISOString(),
    });
    if (evErr) fail(evErr);

    // Optionally update the shipment status
    if (data.new_status) {
      const { error: sErr } = await supabaseAdmin
        .from("shipments")
        .update({ status: data.new_status })
        .eq("id", data.shipment_id);
      if (sErr) fail(sErr);
    }

    return { ok: true };
  });

export const adminUpdateShipmentEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.string().optional(),
        description: z.string().optional(),
        location: z.string().nullable().optional(),
        occurred_at: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const update: Record<string, any> = {};
    if (data.status !== undefined) update.status = data.status;
    if (data.description !== undefined) update.description = data.description;
    if (data.location !== undefined) update.location = data.location;
    if (data.occurred_at !== undefined) update.occurred_at = data.occurred_at;

    const { error } = await supabaseAdmin
      .from("shipment_events")
      .update(update as any)
      .eq("id", data.id);
    if (error) fail(error);
    return { ok: true };
  });

export const adminDeleteShipmentEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("shipment_events").delete().eq("id", data.id);
    if (error) fail(error);
    return { ok: true };
  });

export const adminDeleteShipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ id: z.string().uuid() }).parse(i))
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
      .select(
        "id, user_id, pickup_date, slot, status, contact_name, company, address, city, postal_code, reference, package_count, created_at",
      )
      .order("pickup_date", { ascending: false })
      .limit(300);
    if (error) fail(error);
    return data ?? [];
  });

export const adminSetPickupStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("pickups")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) fail(error);
    return { ok: true };
  });

export const adminCreatePickup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        contact_name: z.string(),
        company: z.string().optional(),
        address: z.string(),
        city: z.string(),
        postal_code: z.string(),
        reference: z.string().optional(),
        pickup_date: z.string(),
        slot: z.string(),
        status: z.string(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Auto-generate reference if not provided
    const ref = data.reference && data.reference.trim()
      ? data.reference.trim()
      : `PKP-${Date.now().toString(36).toUpperCase()}`;

    const { data: inserted, error } = await supabaseAdmin
      .from("pickups")
      .insert({
        user_id: context.userId,
        contact_name: data.contact_name,
        company: data.company,
        address: data.address,
        city: data.city,
        postal_code: data.postal_code,
        reference: ref,
        pickup_date: data.pickup_date,
        slot: data.slot,
        status: data.status ?? "pending",
      })
      .select()
      .single();
    if (error) fail(error);
    return { ok: true };
  });

export const adminUpdatePickup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        id: z.string().uuid(),
        contact_name: z.string(),
        company: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        postal_code: z.string().optional(),
        reference: z.string().optional(),
        pickup_date: z.string(),
        slot: z.string(),
        status: z.string(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("pickups")
      .update({
        contact_name: data.contact_name,
        company: data.company,
        ...(data.address ? { address: data.address } : {}),
        ...(data.city ? { city: data.city } : {}),
        ...(data.postal_code ? { postal_code: data.postal_code } : {}),
        ...(data.reference ? { reference: data.reference } : {}),
        pickup_date: data.pickup_date,
        slot: data.slot,
        status: data.status,
      })
      .eq("id", data.id);
    if (error) fail(error);
    return { ok: true };
  });

export const adminDeletePickup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ id: z.string().uuid() }).parse(i))
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
  .validator((i) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["draft", "sent", "paid", "overdue", "void"]),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("invoices")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) fail(error);
    return { ok: true };
  });

export const adminCreateInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        number: z.string(),
        total: z.number(),
        due_date: z.string(),
        status: z.string(),
      })
      .parse(i),
  )
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
  .validator((i) => z.object({ id: z.string().uuid() }).parse(i))
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
  .validator((i) =>
    z
      .object({
        title: z.string().min(1).max(200),
        body: z.string().min(1).max(2000),
        category: z.string().max(40).default("announcement"),
        tone: z.enum(["default", "success", "warning", "danger"]).default("default"),
        targetUserId: z.string().uuid().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.targetUserId) {
      const { error } = await supabaseAdmin.from("notifications").insert({
        user_id: data.targetUserId,
        title: data.title,
        body: data.body,
        category: data.category,
        tone: data.tone,
      });
      if (error) fail(error);
      return { ok: true, sent: 1 };
    }
    const { data: users, error: uerr } = await supabaseAdmin.from("profiles").select("id");
    if (uerr) fail(uerr);
    const rows = (users ?? []).map((u) => ({
      user_id: u.id,
      title: data.title,
      body: data.body,
      category: data.category,
      tone: data.tone,
    }));
    if (rows.length === 0) return { ok: true, sent: 0 };
    const { error } = await supabaseAdmin.from("notifications").insert(rows);
    if (error) fail(error);
    return { ok: true, sent: rows.length };
  });

export const adminListBroadcasts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Fetch distinct broadcasts by title+body+created_at, grouped by announcement category
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("id, title, body, tone, category, created_at")
      .eq("category", "announcement")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) fail(error);
    // Deduplicate: group by title+body+created_at minute bucket
    const seen = new Set<string>();
    const unique: typeof data = [];
    for (const n of data ?? []) {
      const key = `${n.title}||${n.body}||${n.created_at?.slice(0, 16)}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(n);
      }
    }
    return unique;
  });

// ---------- Payment Management ----------

export const adminListPaymentMethods = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("payment_methods")
      .select("*")
      .order("sort_order");
    if (error) fail(error);
    return data ?? [];
  });

export const adminTogglePaymentMethod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ id: z.string().uuid(), enabled: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("payment_methods")
      .update({ enabled: data.enabled, updated_at: new Date().toISOString() })
      .eq("id", data.id);
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
  .validator((i) =>
    z
      .object({
        id: z.string().uuid().optional(),
        currency: z.string().min(1).max(10),
        network: z.string().min(1).max(60),
        address: z.string().min(10).max(200),
        label: z.string().max(100).optional(),
        instructions: z.string().max(1000).optional(),
        status: z.enum(["active", "inactive", "maintenance"]).default("active"),
        sort_order: z.number().int().default(0),
      })
      .parse(i),
  )
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
  .validator((i) => z.object({ id: z.string().uuid() }).parse(i))
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
  .validator((i) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["verify", "reject"]),
        note: z.string().max(500).optional(),
      })
      .parse(i),
  )
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

export const adminListAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("audit_logs")
      .select("id, action, actor, actor_id, target, details, ip, severity, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) fail(error);
    // Map to the shape the frontend expects
    return (data ?? []).map((l) => ({
      id: l.id,
      action: l.action,
      actor: l.actor,
      target: l.target ?? "",
      timestamp: l.created_at,
      ip: l.ip ?? "",
      severity: l.severity,
    }));
  });

/** Helper: write an audit log entry */
export async function writeAuditLog(opts: {
  action: string;
  actor: string;
  actor_id?: string;
  target?: string;
  details?: Record<string, unknown>;
  ip?: string;
  severity?: "info" | "warning" | "critical";
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("audit_logs").insert({
      action: opts.action,
      actor: opts.actor,
      actor_id: opts.actor_id ?? null,
      target: opts.target ?? null,
      details: (opts.details ?? null) as any,
      ip: opts.ip ?? null,
      severity: opts.severity ?? "info",
    });
  } catch (e) {
    console.error("[audit-log] Failed to write:", e);
  }
}

// ---------- Pricing Rules ----------

export const adminGetPricingRules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("pricing_rules")
      .select("*")
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .single();
    if (error) fail(error);
    return data;
  });

export const adminUpdatePricingRules = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        base_fee: z.number().min(0),
        per_km_rate: z.number().min(0),
        per_kg_rate: z.number().min(0),
        surge_multiplier: z.number().min(1),
        insurance_rate: z.number().min(0),
        hazmat_surcharge: z.number().min(0),
        tax_rate: z.number().min(0),
        signature_fee: z.number().min(0).optional(),
        carbon_offset_per_km_kg: z.number().min(0).optional(),
        vehicle_rates: z.any().optional(),
        zone_multipliers: z.any().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("pricing_rules")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
        updated_by: context.userId,
      })
      .eq("id", "00000000-0000-0000-0000-000000000001");
    if (error) fail(error);
    await writeAuditLog({
      action: "Pricing Engine Rules Updated",
      actor: context.userId,
      actor_id: context.userId,
      target: "pricing_rules",
      details: data as Record<string, unknown>,
      severity: "info",
    });
    return { ok: true };
  });

// ---------- System Settings ----------

export const adminGetSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("system_settings")
      .select("key, value, description");
    if (error) fail(error);
    // Return as a key-value object for convenience
    const result: Record<string, string> = {};
    (data ?? []).forEach((row) => {
      result[row.key] = row.value;
    });
    return result;
  });

export const adminUpdateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.record(z.string()).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const entries = Object.entries(data);
    for (const [key, value] of entries) {
      const { error } = await supabaseAdmin.from("system_settings").upsert(
        {
          key,
          value: String(value),
          updated_at: new Date().toISOString(),
          updated_by: context.userId,
        },
        { onConflict: "key" },
      );
      if (error) fail(error);
    }
    await writeAuditLog({
      action: "System Settings Updated",
      actor: context.userId,
      actor_id: context.userId,
      target: "system_settings",
      details: data,
      severity: "warning",
    });
    return { ok: true };
  });

export const adminUpdatePlatformSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        visual_assets: z.any().optional(),
        design_system: z.any().optional(),
        contact_info: z.any().optional(),
        compliance_legal: z.any().optional(),
        global_seo: z.any().optional(),
        notifications_alerts: z.any().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Only update the fields provided in `data`
    const payload = {
      ...data,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    };

    const { error } = await (supabaseAdmin as any)
      .from("platform_settings")
      .update(payload)
      .eq("is_singleton", true);

    if (error) fail(error);

    await writeAuditLog({
      action: "Platform Settings Updated",
      actor: context.userId,
      actor_id: context.userId,
      target: "platform_settings",
      details: data,
      severity: "warning",
    });

    return { ok: true };
  });

// ---------- CMS Pages ----------

export const adminListCmsPages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("cms_pages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) fail(error);
    return data ?? [];
  });

export const adminUpsertCmsPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().min(1),
        slug: z.string().min(1),
        content: z.string(),
        status: z.string(),
        author: z.string(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      title: data.title,
      slug: data.slug,
      content: data.content,
      status: data.status,
      author: data.author,
      updated_at: new Date().toISOString(),
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("cms_pages").update(payload).eq("id", data.id);
      if (error) fail(error);
      await writeAuditLog({ action: "CMS Page Updated", actor: context.userId, target: data.slug });
    } else {
      const { error } = await supabaseAdmin.from("cms_pages").insert(payload);
      if (error) fail(error);
      await writeAuditLog({ action: "CMS Page Created", actor: context.userId, target: data.slug });
    }
    return { ok: true };
  });

export const adminDeleteCmsPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("cms_pages").delete().eq("id", data.id);
    if (error) fail(error);
    await writeAuditLog({
      action: "CMS Page Deleted",
      actor: context.userId,
      target: data.id,
      severity: "warning",
    });
    return { ok: true };
  });

// ---------- Drivers ----------

export const adminListDrivers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Also fetch the driver's vehicle if available
    const { data, error } = await supabaseAdmin
      .from("drivers")
      .select("*, fleet_vehicles(id, model)")
      .order("name", { ascending: true });
    if (error) fail(error);
    return data ?? [];
  });

export const adminUpsertDriver = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        id: z.string().uuid().optional(),
        user_id: z.string().uuid().optional().nullable(),
        name: z.string().min(1),
        email: z.string().email(),
        rating: z.number().min(0).max(5).optional(),
        deliveries: z.number().min(0).optional(),
        status: z.string(),
        zone: z.string(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      name: data.name,
      email: data.email,
      status: data.status,
      zone: data.zone,
      updated_at: new Date().toISOString(),
    };
    if (data.rating !== undefined) Object.assign(payload, { rating: data.rating });
    if (data.deliveries !== undefined) Object.assign(payload, { deliveries: data.deliveries });
    if (data.user_id !== undefined) Object.assign(payload, { user_id: data.user_id });

    if (data.id) {
      const { error } = await supabaseAdmin.from("drivers").update(payload).eq("id", data.id);
      if (error) fail(error);
    } else {
      const { error } = await supabaseAdmin.from("drivers").insert(payload);
      if (error) fail(error);
    }
    return { ok: true };
  });

export const adminDeleteDriver = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("drivers").delete().eq("id", data.id);
    if (error) fail(error);
    await writeAuditLog({
      action: "Driver Deleted",
      actor: context.userId,
      target: data.id,
      severity: "critical",
    });
    return { ok: true };
  });

// ---------- Fleet Vehicles ----------

export const adminListFleet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("fleet_vehicles")
      .select("*, drivers(id, name)")
      .order("created_at", { ascending: false });
    if (error) fail(error);
    return data ?? [];
  });

export const adminUpsertFleetVehicle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        id: z.string().uuid().optional(),
        model: z.string().min(1),
        type: z.string().min(1),
        status: z.string(),
        driver_id: z.string().uuid().nullable().optional(),
        fuel_level: z.number().min(0).max(100),
        location: z.string(),
        mileage: z.number().min(0),
        next_service_date: z.string().optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      model: data.model,
      type: data.type,
      status: data.status,
      driver_id: data.driver_id ?? null,
      fuel_level: data.fuel_level,
      location: data.location,
      mileage: data.mileage,
      next_service_date: data.next_service_date ?? null,
      updated_at: new Date().toISOString(),
    };
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("fleet_vehicles")
        .update(payload)
        .eq("id", data.id);
      if (error) fail(error);
    } else {
      const { error } = await supabaseAdmin.from("fleet_vehicles").insert(payload);
      if (error) fail(error);
    }
    return { ok: true };
  });

export const adminDeleteFleetVehicle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("fleet_vehicles").delete().eq("id", data.id);
    if (error) fail(error);
    await writeAuditLog({
      action: "Fleet Vehicle Deleted",
      actor: context.userId,
      target: data.id,
      severity: "warning",
    });
    return { ok: true };
  });

// ---------- Reports ----------

export const adminListReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: reports, error } = await supabaseAdmin
      .from("reports" as any)
      .select("id, name, category, period, status, size_bytes, created_at, created_by")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) fail(error);
    return reports ?? [];
  });

export const adminGenerateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        name: z.string().min(1).max(200),
        category: z.enum(["Financial", "Operations", "Fleet", "Analytics"]),
        period: z.string().min(1).max(60),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let fileData: any = {};
    const now = new Date();

    if (data.category === "Financial") {
      // Aggregate invoice data
      const { data: invoices } = await supabaseAdmin
        .from("invoices")
        .select("number, status, total, currency, issue_date, due_date, created_at");
      const rows = (invoices ?? []).map((inv: any) => ({
        invoice_number: inv.number,
        status: inv.status,
        total: inv.total,
        currency: inv.currency,
        issue_date: inv.issue_date,
        due_date: inv.due_date,
      }));
      const totalRevenue = rows
        .filter((r: any) => r.status === "paid")
        .reduce((s: number, r: any) => s + Number(r.total), 0);
      const outstanding = rows
        .filter((r: any) => r.status !== "paid" && r.status !== "void")
        .reduce((s: number, r: any) => s + Number(r.total), 0);
      fileData = {
        headers: ["Invoice #", "Status", "Total", "Currency", "Issue Date", "Due Date"],
        rows,
        summary: { totalRevenue, outstanding, invoiceCount: rows.length },
      };
    } else if (data.category === "Operations") {
      // Aggregate shipment data
      const { data: shipments } = await supabaseAdmin
        .from("shipments")
        .select("tracking_number, status, service, origin, destination, created_at");
      const rows = (shipments ?? []).map((s: any) => ({
        tracking_number: s.tracking_number,
        status: s.status,
        service: s.service,
        origin_city: s.origin?.city ?? "",
        destination_city: s.destination?.city ?? "",
        created_at: s.created_at,
      }));
      const delivered = rows.filter((r: any) => r.status === "delivered").length;
      const exception = rows.filter((r: any) => r.status === "exception").length;
      const deliveryRate = rows.length > 0 ? Math.round((delivered / rows.length) * 100) : 0;
      fileData = {
        headers: ["Tracking #", "Status", "Service", "Origin City", "Destination City", "Created"],
        rows,
        summary: { totalShipments: rows.length, delivered, exception, deliveryRate },
      };
    } else if (data.category === "Fleet") {
      // Aggregate fleet data
      const { data: vehicles } = await supabaseAdmin
        .from("fleet_vehicles")
        .select(
          "model, type, status, fuel_level, mileage, location, next_service_date, drivers(name)",
        );
      const rows = (vehicles ?? []).map((v: any) => ({
        model: v.model,
        type: v.type,
        status: v.status,
        fuel_level: v.fuel_level,
        mileage: v.mileage,
        location: v.location,
        driver: v.drivers?.name ?? "Unassigned",
        next_service: v.next_service_date ?? "",
      }));
      const active = rows.filter((r: any) => r.status === "Active").length;
      const maintenance = rows.filter((r: any) => r.status === "Maintenance").length;
      const avgFuel =
        rows.length > 0
          ? Math.round(rows.reduce((s: number, r: any) => s + (r.fuel_level ?? 0), 0) / rows.length)
          : 0;
      fileData = {
        headers: [
          "Model",
          "Type",
          "Status",
          "Fuel %",
          "Mileage",
          "Location",
          "Driver",
          "Next Service",
        ],
        rows,
        summary: { totalVehicles: rows.length, active, maintenance, avgFuel },
      };
    } else if (data.category === "Analytics") {
      // User analytics
      const [profilesRes, shipmentsRes] = await Promise.all([
        supabaseAdmin.from("profiles").select("id, display_name, created_at"),
        supabaseAdmin.from("shipments").select("user_id, status, created_at"),
      ]);
      const profiles = profilesRes.data ?? [];
      const shipments = shipmentsRes.data ?? [];
      const userMap = new Map<string, number>();
      shipments.forEach((s: any) => {
        userMap.set(s.user_id, (userMap.get(s.user_id) || 0) + 1);
      });
      const rows = profiles.map((p: any) => ({
        user_id: p.id,
        name: p.display_name ?? "Unknown",
        joined: p.created_at,
        total_shipments: userMap.get(p.id) ?? 0,
      }));
      fileData = {
        headers: ["User ID", "Name", "Joined", "Total Shipments"],
        rows,
        summary: { totalUsers: rows.length, totalShipments: shipments.length },
      };
    }

    const jsonStr = JSON.stringify(fileData);
    const sizeBytes = new TextEncoder().encode(jsonStr).length;

    const { data: inserted, error } = (await supabaseAdmin
      .from("reports" as any)
      .insert({
        name: data.name,
        category: data.category,
        period: data.period,
        status: "ready",
        size_bytes: sizeBytes,
        file_data: fileData,
        created_by: context.userId,
      } as any)
      .select()
      .single()) as any;
    if (error) fail(error);

    await writeAuditLog({
      action: "Report Generated",
      actor: context.userId,
      actor_id: context.userId,
      target: inserted?.id,
      details: { name: data.name, category: data.category, period: data.period },
      severity: "info",
    });

    return { ok: true, report: inserted };
  });

export const adminDeleteReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("reports" as any)
      .delete()
      .eq("id", data.id);
    if (error) fail(error);
    await writeAuditLog({
      action: "Report Deleted",
      actor: context.userId,
      target: data.id,
      severity: "warning",
    });
    return { ok: true };
  });

export const adminGetReportData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: report, error } = await supabaseAdmin
      .from("reports" as any)
      .select("id, name, category, file_data")
      .eq("id", data.id)
      .single();
    if (error) fail(error);
    return report;
  });

// ---------- Locations & Customs ----------

export const adminListLocations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("locations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) fail(error);
    return data ?? [];
  });

export const adminCreateLocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        name: z.string(),
        type: z.string(),
        country: z.string(),
        city: z.string(),
        address: z.string().optional(),
        is_customs_facility: z.boolean().default(false),
        is_distribution_hub: z.boolean().default(false),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: inserted, error } = await supabaseAdmin
      .from("locations")
      .insert(data)
      .select()
      .single();
    if (error) fail(error);
    return { ok: true, location: inserted };
  });

export const adminCreateCustomsHold = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        shipment_id: z.string().uuid(),
        customs_authority: z.string(),
        customs_location_id: z.string().uuid().optional(),
        hold_reason: z.string(),
        required_action: z.string().optional(),
        amount_due: z.number().optional(),
        currency: z.string().default("USD"),
        charge_category: z.string().optional(),
        payment_responsibility: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Get shipment
    const { data: shipment, error: sErr } = await supabaseAdmin
      .from("shipments")
      .select("tracking_number")
      .eq("id", data.shipment_id)
      .single();
    if (sErr || !shipment) fail(sErr || new Error("Shipment not found"));

    const { data: inserted, error } = await supabaseAdmin
      .from("customs_holds")
      .insert({
        shipment_id: data.shipment_id,
        tracking_number: shipment.tracking_number,
        customs_authority: data.customs_authority,
        customs_location_id: data.customs_location_id,
        hold_reason: data.hold_reason,
        required_action: data.required_action,
        amount_due: data.amount_due,
        currency: data.currency,
        charge_category: data.charge_category,
        payment_responsibility: data.payment_responsibility || "pending",
        created_by: context.userId,
      })
      .select()
      .single();
    if (error) fail(error);

    // Update shipment status
    await supabaseAdmin
      .from("shipments")
      .update({ status: "exception" })
      .eq("id", data.shipment_id);

    return { ok: true, hold: inserted };
  });

export const adminAssignCustomsCharge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        hold_id: z.string().uuid(),
        payment_responsibility: z.enum(["sender", "receiver", "third_party", "swiftarc"]),
        payer_name: z.string().optional(),
        payer_user_id: z.string().uuid().optional(),
        deadline: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: hold, error: hErr } = await supabaseAdmin
      .from("customs_holds")
      .select("*")
      .eq("id", data.hold_id)
      .single();
    if (hErr || !hold) fail(hErr || new Error("Hold not found"));

    if (!hold.amount_due || hold.amount_due <= 0) {
      throw new Error("No amount due on this hold");
    }

    // Generate Payment Request
    const reference = "PAY-CUST-" + Math.floor(100000 + Math.random() * 900000);

    const { data: txn, error: tErr } = await supabaseAdmin
      .from("payment_transactions")
      .insert({
        shipment_id: hold.shipment_id,
        user_id: data.payer_user_id || hold.created_by || context.userId, // Fallback if unregistered receiver
        amount: hold.amount_due,
        currency: hold.currency,
        reference,
        status: "pending",
        method: "card", // Default
        charge_type: hold.charge_category || "customs_duty",
        payment_responsibility: data.payment_responsibility,
        payer_name: data.payer_name,
        customs_hold_id: hold.id,
        payment_deadline: data.deadline,
        created_by: context.userId,
      })
      .select()
      .single();

    if (tErr) fail(tErr);

    // Update hold with txn ID and status
    const { error: updErr } = await supabaseAdmin
      .from("customs_holds")
      .update({
        payment_responsibility: data.payment_responsibility,
        payer_user_id: data.payer_user_id,
        payment_transaction_id: txn.id,
        status: "payment_required",
      })
      .eq("id", hold.id);

    if (updErr) fail(updErr);

    return { ok: true, transaction: txn };
  });

// --- AI Predictions ---
export const adminRunAIPredictions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { evaluateShipmentRisk } = await import("./ai-predictions");

    // Fetch active shipments that might be delayed
    const { data: shipments, error } = await supabaseAdmin
      .from("shipments")
      .select(
        "id, tracking_number, status, service, origin, destination, telemetry, estimated_delivery",
      )
      .in("status", ["picked_up", "in_transit", "near_destination"]);

    if (error) fail(error);
    if (!shipments || shipments.length === 0) return { ok: true, processed: 0 };

    let processed = 0;
    for (const ship of shipments) {
      const risk = await evaluateShipmentRisk(ship);

      // Update the shipment with the new AI Risk score
      const { error: updErr } = await supabaseAdmin
        .from("shipments")
        .update({
          ai_delay_risk: risk.ai_delay_risk,
          ai_delay_reason: risk.ai_delay_reason,
        })
        .eq("id", ship.id);

      if (!updErr) processed++;
    }

    return { ok: true, processed };
  });

// ---------- Live Location / Telemetry ----------

export const adminUpdateShipmentTelemetry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        shipment_id: z.string().uuid(),
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        speed: z.number().optional(),
        heading: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const telemetry = {
      lat: data.lat,
      lng: data.lng,
      speed: data.speed ?? null,
      heading: data.heading ?? null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin
      .from("shipments")
      .update({ telemetry })
      .eq("id", data.shipment_id);
    if (error) fail(error, "Failed to update telemetry.");
    return { ok: true, telemetry };
  });

// ---------- Customs Holds ----------

export const adminGetCustomsHolds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        shipment_id: z.string().uuid(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: holds, error } = await supabaseAdmin
      .from("customs_holds")
      .select("*")
      .eq("shipment_id", data.shipment_id)
      .order("created_at", { ascending: false });

    if (error) fail(error, "Failed to get customs holds.");
    return holds;
  });

export const adminReleaseCustomsHold = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        hold_id: z.string().uuid(),
        shipment_id: z.string().uuid(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Release the hold
    const { error: holdErr } = await supabaseAdmin
      .from("customs_holds")
      .update({
        status: "released",
        updated_by: context.userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.hold_id);

    if (holdErr) fail(holdErr, "Failed to release customs hold.");

    // Update shipment status back to in_transit (or something generic)
    const { error: shipErr } = await supabaseAdmin
      .from("shipments")
      .update({ status: "in_transit" })
      .eq("id", data.shipment_id);

    if (shipErr) fail(shipErr, "Failed to update shipment status.");

    return { ok: true };
  });

// -------------------------------------------------------
// Clearance dashboard helpers
// -------------------------------------------------------

export const adminListCustomsCases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("customs_holds")
      .select("*, shipments(tracking_number, status, origin, destination)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) fail(error);
    return data ?? [];
  });

export const adminGetPaymentSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("payment_submissions")
      .select(
        "*, customs_holds(amount_due, currency, status, shipments(tracking_number)), digital_currency_assets(symbol, wallet_address)"
      )
      .order("submitted_at", { ascending: false })
      .limit(300);
    if (error) fail(error);
    return data ?? [];
  });
