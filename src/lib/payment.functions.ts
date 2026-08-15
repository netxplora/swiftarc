/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function fail(err: unknown, msg = "Operation failed."): never {
  console.error("[payment]", err);
  throw new Error(msg);
}

async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

// ==========================================
// 1. Digital Currency Assets
// ==========================================

export const adminGetCryptoAssets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("digital_currency_assets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) fail(error);
    return data ?? [];
  });

export const adminUpsertCryptoAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z.object({
      id: z.string().uuid().optional(),
      asset_name: z.string(),
      symbol: z.string(),
      network: z.string(),
      wallet_address: z.string(),
      qr_code_url: z.string().optional(),
      min_payment_amount: z.number().optional(),
      instructions: z.string().optional(),
      is_active: z.boolean(),
    }).parse(i)
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.id) {
      const { error } = await (supabaseAdmin as any)
        .from("digital_currency_assets")
        .update(data as any)
        .eq("id", data.id);
      if (error) fail(error);
    } else {
      const { error } = await (supabaseAdmin as any).from("digital_currency_assets").insert(data as any);
      if (error) fail(error);
    }

    // Log the action
    await (supabaseAdmin as any).from("payment_audit_logs").insert({
      actor_id: context.userId,
      action: data.id ? "UPDATE_CRYPTO_ASSET" : "CREATE_CRYPTO_ASSET",
      resource_type: "digital_currency_assets",
      new_value: data,
    });

    return { ok: true };
  });

// ==========================================
// 2. Crypto Purchase Providers
// ==========================================

export const adminGetPurchaseProviders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("crypto_purchase_providers")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) fail(error);
    return data ?? [];
  });

export const adminUpsertPurchaseProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z.object({
      id: z.string().uuid().optional(),
      provider_name: z.string(),
      website_url: z.string().url(),
      supported_countries: z.string().optional(),
      supported_assets: z.string().optional(),
      supported_networks: z.string().optional(),
      instructions: z.string().optional(),
      customer_facing_description: z.string().optional(),
      is_active: z.boolean(),
      sort_order: z.number().default(0),
    }).parse(i)
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.id) {
      const { error } = await (supabaseAdmin as any)
        .from("crypto_purchase_providers")
        .update(data as any)
        .eq("id", data.id);
      if (error) fail(error);
    } else {
      const { error } = await (supabaseAdmin as any).from("crypto_purchase_providers").insert(data as any);
      if (error) fail(error);
    }

    await (supabaseAdmin as any).from("payment_audit_logs").insert({
      actor_id: context.userId,
      action: data.id ? "UPDATE_PROVIDER" : "CREATE_PROVIDER",
      resource_type: "crypto_purchase_providers",
      new_value: data,
    });

    return { ok: true };
  });

// ==========================================
// 3. Customer Quote Generation
// ==========================================

export const customerCreatePaymentQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z.object({
      customs_hold_id: z.string().uuid(),
      asset_id: z.string().uuid(),
    }).parse(i)
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Get the customs hold to find the amount due
    const { data: hold, error: holdErr } = await supabaseAdmin
      .from("customs_holds")
      .select("*")
      .eq("id", data.customs_hold_id)
      .single();
    if (holdErr) fail(holdErr);
    if (!hold) throw new Error("Customs hold not found");

    // Ensure the customer is allowed to pay this
    const { data: shipment, error: shipErr } = await supabaseAdmin
      .from("shipments")
      .select("user_id")
      .eq("id", hold.shipment_id)
      .single();
    if (shipErr) fail(shipErr);
    if (shipment?.user_id !== context.userId) {
      throw new Error("Unauthorized to pay for this shipment");
    }

    // Get the crypto asset details
    const { data: asset, error: assetErr } = await (supabaseAdmin as any)
      .from("digital_currency_assets")
      .select("*")
      .eq("id", data.asset_id)
      .single();
    if (assetErr) fail(assetErr);
    if (!asset || !asset.is_active) throw new Error("Asset not available");

    // Fetch real-time rate from Binance public API
    let exchangeRate = 1; // Default for stablecoins like USDT, USDC

    if (asset.symbol.toUpperCase() !== "USDT" && asset.symbol.toUpperCase() !== "USDC") {
      try {
        const symbolPair = `${asset.symbol.toUpperCase()}USDT`;
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbolPair}`);
        if (res.ok) {
          const json = await res.json();
          // Rate is how many USD for 1 unit of Crypto. e.g. BTC = 60000.
          if (json.price) {
            exchangeRate = parseFloat(json.price);
          }
        }
      } catch (err) {
        console.error("Failed to fetch exchange rate", err);
      }
    }

    const fiatAmount = Number(hold.amount_due);
    const cryptoAmount = fiatAmount / exchangeRate;

    // Quote expires in 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { data: quote, error: quoteErr } = await (supabaseAdmin as any)
      .from("payment_quotes")
      .insert({
        customs_hold_id: hold.id,
        fiat_amount: fiatAmount,
        fiat_currency: hold.currency,
        crypto_amount: cryptoAmount,
        crypto_asset_id: asset.id,
        exchange_rate: exchangeRate,
        user_id: context.userId,
        expires_at: expiresAt,
      })
      .select()
      .single();
    if (quoteErr) fail(quoteErr);

    return { ok: true, quote };
  });

// ==========================================
// 4. Customer Submission
// ==========================================

export const customerSubmitTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z.object({
      quote_id: z.string().uuid(),
      transaction_hash: z.string(),
    }).parse(i)
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Get the quote
    const { data: quote, error: quoteErr } = await (supabaseAdmin as any)
      .from("payment_quotes")
      .select("*, digital_currency_assets(network)")
      .eq("id", data.quote_id)
      .single();
    if (quoteErr) fail(quoteErr);
    if (!quote) throw new Error("Quote not found");
    if (quote.user_id !== context.userId) throw new Error("Unauthorized");

    // Check expiration
    if (new Date(quote.expires_at) < new Date()) {
      throw new Error("Payment quote has expired. Please generate a new quote.");
    }

    // Check duplicate TXID
    const { data: existingTx } = await (supabaseAdmin as any)
      .from("payment_submissions")
      .select("id")
      .eq("transaction_hash", data.transaction_hash)
      .maybeSingle();
    if (existingTx) {
      throw new Error("This transaction hash has already been submitted.");
    }

    // Insert submission
    const { error: subErr } = await (supabaseAdmin as any).from("payment_submissions").insert({
      payment_quote_id: quote.id,
      customs_hold_id: quote.customs_hold_id,
      transaction_hash: data.transaction_hash,
      network: quote.digital_currency_assets.network,
      amount_claimed: quote.crypto_amount,
      crypto_asset_id: quote.crypto_asset_id,
      user_id: context.userId,
      status: "verification_required",
    });
    if (subErr) fail(subErr);

    // Update Hold status
    await (supabaseAdmin as any)
      .from("customs_holds")
      .update({
        status: "payment_verification",
        payment_status: "verification_required",
      })
      .eq("id", quote.customs_hold_id);

    return { ok: true };
  });

// ==========================================
// 5. Admin Verification
// ==========================================

export const adminVerifyPaymentSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z.object({
      submission_id: z.string().uuid(),
      status: z.enum(["verified", "rejected", "underpaid", "overpaid"]),
      notes: z.string().optional(),
    }).parse(i)
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: submission, error: subErr } = await (supabaseAdmin as any)
      .from("payment_submissions")
      .select("*")
      .eq("id", data.submission_id)
      .single();
    if (subErr) fail(subErr);

    const { error: updErr } = await (supabaseAdmin as any)
      .from("payment_submissions")
      .update({
        status: data.status,
        notes: data.notes,
        verified_by: context.userId,
        verified_at: new Date().toISOString(),
      })
      .eq("id", data.submission_id);
    if (updErr) fail(updErr);

    // Update customs hold based on payment decision
    let holdStatus = "payment_verification";
    let paymentStatus = data.status === "verified" ? "paid" : data.status;
    
    if (data.status === "verified") {
      holdStatus = "clearance_processing"; // Move forward!
    } else if (data.status === "rejected") {
      holdStatus = "payment_required"; // Re-open
      paymentStatus = "rejected";
    } else if (data.status === "underpaid") {
      holdStatus = "payment_required";
      paymentStatus = "underpaid";
    } else if (data.status === "overpaid") {
      holdStatus = "clearance_processing";
      paymentStatus = "overpaid";
    }

    await (supabaseAdmin as any)
      .from("customs_holds")
      .update({
        status: holdStatus,
        payment_status: paymentStatus,
      })
      .eq("id", (submission as any).customs_hold_id);

    // Audit log
    await (supabaseAdmin as any).from("payment_audit_logs").insert({
      actor_id: context.userId,
      action: "VERIFY_PAYMENT",
      resource_type: "payment_submissions",
      resource_id: (submission as any).id,
      new_value: { status: data.status, notes: data.notes },
    });

    return { ok: true };
  });
