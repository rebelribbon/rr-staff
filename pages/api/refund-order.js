// pages/api/refund-order.js
import Stripe from "stripe";
import { supabaseServer } from "../../../lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { order_id } = req.body || {};
    if (!order_id) {
      return res.status(400).json({ error: "Missing order_id" });
    }

    const supabase = supabaseServer();

    // Fetch payment rows for this order
    const { data, error } = await supabase
      .from("payments")
      .select("provider, provider_id, amount_cents")
      .eq("order_id", order_id);

    if (error) throw error;

    // Be SUPER defensive about shape
    const rows = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
      ? data.data
      : null;

    if (!rows) {
      return res.status(500).json({
        ok: false,
        error: "Payments query did not return an array.",
        debugShape: Object.keys(data || {}).join(","),
      });
    }

    let attempted = 0;
    const refunded_intents = [];
    const skipped = [];

    for (const p of rows) {
      // Only refund positive Stripe rows
      if (p.provider !== "stripe" || !p.amount_cents || p.amount_cents <= 0) {
        skipped.push(p);
        continue;
      }
      attempted += 1;

      await stripe.refunds.create({
        payment_intent: p.provider_id,
        amount: p.amount_cents, // cents
      });

      refunded_intents.push(p.provider_id);
    }

    return res.status(200).json({
      ok: true,
      order_id,
      attempted,
      refunded_intents,
      skipped: skipped.length,
    });
  } catch (err) {
    console.error("refund-order error", err);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
