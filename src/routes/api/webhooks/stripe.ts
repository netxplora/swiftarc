// @ts-ignore - Module might not be properly typed in this version
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2024-04-10" as any,
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const APIRoute = createAPIFileRoute("/api/webhooks/stripe")({
  POST: async ({ request }: { request: Request }) => {
    try {
      const signature = request.headers.get("stripe-signature");
      if (!signature) {
        return new Response("Missing signature", { status: 400 });
      }
      
      const body = await request.text();
      let event;
      
      try {
        if (endpointSecret) {
          event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
        } else {
          // Fallback if no webhook secret is configured (e.g. local dev)
          event = JSON.parse(body);
        }
      } catch (err: any) {
        return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
      }
      
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object as any;
        const reference = paymentIntent.metadata?.reference;
        
        if (reference) {
          // Find transaction
          const { data: txn, error: getErr } = await supabaseAdmin
            .from("payment_transactions")
            .select("id, status")
            .eq("reference", reference)
            .maybeSingle();
            
          if (getErr || !txn) {
            return new Response("Transaction not found", { status: 404 });
          }
          
          if (txn.status !== "verified") {
            const { error: updErr } = await supabaseAdmin
              .from("payment_transactions")
              .update({ 
                status: "verified", 
                verified_at: new Date().toISOString(),
                verified_by: "system"
              })
              .eq("id", txn.id);
              
            if (updErr) {
              console.error("Webhook DB Update Error:", updErr);
              return new Response("Database error", { status: 500 });
            }
            
            // Also update the shipment status and send email
            const { data: shipmentRel } = await supabaseAdmin
              .from("shipments")
              .select("id, tracking_number, service, user_id, payment_transactions(amount, currency, reference)")
              .eq("payment_transaction_id", txn.id)
              .maybeSingle();
              
            if (shipmentRel) {
              await supabaseAdmin
                .from("shipments")
                .update({ status: "label_created" } as any)
                .eq("id", shipmentRel.id);
                
              const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("email")
                .eq("id", shipmentRel.user_id)
                .maybeSingle();
                
              if (profile?.email && process.env.RESEND_API_KEY) {
                const { Resend } = await import("resend");
                const resend = new Resend(process.env.RESEND_API_KEY);
                const t = Array.isArray(shipmentRel.payment_transactions) ? shipmentRel.payment_transactions[0] : shipmentRel.payment_transactions;
                
                resend.emails.send({
                  from: 'SwiftArc Payments <receipts@swiftarc.net>',
                  to: profile.email,
                  subject: `Receipt for Shipment ${shipmentRel.tracking_number}`,
                  html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                      <h2 style="color: #1E293B;">Payment Receipt</h2>
                      <p>Thank you for booking with SwiftArc. Your card payment was successful and your shipping label is ready.</p>
                      <div style="background: #F1F5F9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Tracking Number:</strong> ${shipmentRel.tracking_number}</p>
                        <p><strong>Service:</strong> ${shipmentRel.service}</p>
                        <p><strong>Amount:</strong> ${t?.amount} ${t?.currency}</p>
                        <p><strong>Reference:</strong> ${t?.reference}</p>
                      </div>
                      <p style="color: #64748B; font-size: 12px;">This is an automated receipt. If you have questions, please contact support.</p>
                    </div>
                  `
                }).catch(err => console.error("Webhook Resend Error:", err));
              }
            }
          }
        }
      }

      return new Response(JSON.stringify({ received: true }), { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      });
    } catch (err: any) {
      console.error("Webhook Error:", err);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
  },
});
