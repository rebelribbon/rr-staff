import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed", probe: "refund-order v3" });
  }

  try {
    const { order_id } = req.body || {};
    if (!order_id) {
      return res.status(400).json({ ok: false, error: "Missing order_id" });
    }

    // Pull all payment rows for this order from Supabase REST
    const url = `${process.env.SUPABASE_URL}/rest/v1/payments?order_id=eq.${order_id}&select=provider,provider_id,amount_cents`;
    const resp = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    const payments = await resp.json();

    if (!Array.isArray(payments)) {
      return res.status(500).json({ ok: false, error: "payments fetch not array", body: payments });
    }

    const results = [];
    for (const p of payments) {
      // only Stripe, positive amounts, and **real** payment_intent ids
      const isStripe = p.provider === "stripe";
      const isPositive = Number(p.amount_cents) > 0;
      const isRealPI = typeof p.provider_id === "string" && p.provider_id.startsWith("pi_");

      if (!(isStripe && isPositive && isRealPI)) {
        results.push({ skipped: true, reason: "not refundable", ...p });
        continue;
      }

      try {
        const refund = await stripe.refunds.create({
          payment_intent: p.provider_id,
          amount: p.amount_cents, // cents
        });
        results.push({ skipped: false, status: refund.status, refund_id: refund.id, payment_intent: p.provider_id, amount_cents: p.amount_cents });
      } catch (err) {
        results.push({ skipped: false, error: String(err?.message || err), payment_intent: p.provider_id, amount_cents: p.amount_cents });
      }
    }

    return res.status(200).json({ ok: true, order_id, results });
  } catch (err) {
    return res.status(500).json({ ok: false, where: "top-level", error: String(err?.message || err) });
  }
}
