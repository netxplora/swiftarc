// @ts-ignore - Module might not be properly typed in this version
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const APIRoute = createAPIFileRoute("/api/webhooks/stripe")({
  POST: async ({ request }: { request: Request }) => {
    try {
      // In a real application, we would use stripe.webhooks.constructEvent
      // with the raw body and the STRIPE_WEBHOOK_SECRET to verify the signature.
      const signature = request.headers.get("stripe-signature");
      if (!signature) {
        return new Response("Missing signature", { status: 400 });
      }
      
      const payload = await request.json();
      
      // Simulate Stripe Event
      if (payload.type === "payment_intent.succeeded") {
        const reference = payload.data?.object?.metadata?.reference;
        
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
