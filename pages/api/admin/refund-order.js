// pages/api/admin/refund-order.js
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Use the service role so we can read payments server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    // Allow POST with JSON, and (for your convenience) GET ?order_id=... during testing
    const method = req.method;
    if (method !== "POST" && method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const order_id =
      method === "POST" ? req.body?.order_id : req.query?.order_id;

    if (!order_id) {
      return res.status(400).json({ error: "order_id required" });
    }

    // 1) Fetch all payment rows for this order
    const { data: payments, error } = await supabase
      .from("payments")
      .select("provider, provider_id, amount_cents")
      .eq("order_id", order_id);

    if (error) throw error;

    // 2) Group by Stripe PaymentIntent and compute net paid cents per PI
    const byPI = new Map();
    for (const p of payments || []) {
      if (p.provider !== "stripe" || !p.provider_id) continue;
      byPI.set(p.provider_id, (byPI.get(p.provider_id) || 0) + (p.amount_cents || 0));
    }

    // 3) For each PI that still has > 0 net paid, issue a refund for that amount
    const results = [];
    for (const [pi, netCents] of byPI.entries()) {
      if (netCents > 0) {
        // Refund exactly what your DB says was paid on this PI
        const refund = await stripe.refunds.create({
          payment_intent: pi,
          amount: netCents,
        });
        results.push({ payment_intent: pi, refunded_cents: refund.amount });
      }
    }

    return res.status(200).json({ ok: true, order_id, results });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
