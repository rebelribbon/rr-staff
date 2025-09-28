// pages/api/refund-order.js
import Stripe from "stripe";

// If you prefer using the Supabase JS server client, we can switch back later.
// For now we call the REST endpoint directly and validate defensively.

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

    // ---- Fetch payments for this order via Supabase REST
    const url = `${process.env.SUPABASE_URL}/rest/v1/payments?order_id=eq.${order_id}`;
    const resp = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY, // any valid key
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, // RLS bypass
        Accept: "application/json",
      },
    });

    const text = await resp.text();
    let json;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      return res.status(500).json({
        ok: false,
        error: "Supabase returned non-JSON",
        debug: { status: resp.status, textSample: text?.slice(0, 300) },
      });
    }

    if (!resp.ok) {
      return res.status(resp.status).json({
        ok: false,
        error: "Supabase REST error",
        debug: json,
      });
    }

    // Supabase REST should return an array here. If it's not, tell us what we got.
    if (!Array.isArray(json)) {
      return res.status(500).json({
        ok: false,
        error: "Payments payload is not an array",
        debugType: Object.prototype.toString.call(json),
        debugKeys: json && typeof json === "object" ? Object.keys(json) : null,
        sample: json,
      });
    }

    const payments = json;

    let attempted = 0;
    const refunded_intents = [];
    const skipped = [];

    for (const p of payments) {
      // only refund positive Stripe rows
      if (p.provider !== "stripe" || !p.amount_cents || p.amount_cents <= 0) {
        skipped.push({ provider: p.provider, amount_cents: p.amount_cents });
        continue;
      }

      attempted += 1;

      await stripe.refunds.create({
        payment_intent: p.provider_id, // the PI id we stored
        amount: p.amount_cents,        // cents (e.g., 7200)
      });

      refunded_intents.push(p.provider_id);
    }

    return res.status(200).json({
      ok: true,
      order_id,
      attempted,
      refunded_intents,
      skipped,
    });
  } catch (err) {
    console.error("refund-order error", err);
    return res
      .status(500)
      .json({ ok: false, error: String(err?.message || err) });
  }
}
