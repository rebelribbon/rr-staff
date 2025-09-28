// pages/api/refund-order.js (diagnostic build)
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Quick probe so we know THIS build is live
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method Not Allowed",
      probe: "refund-order v2",      // <— this must appear on GET
    });
  }

  try {
    const { order_id } = req.body || {};
    if (!order_id) {
      return res.status(400).json({ ok: false, error: "Missing order_id" });
    }

    // Call Supabase REST for rows in payments for this order
    const url = `${process.env.SUPABASE_URL}/rest/v1/payments?order_id=eq.${order_id}`;
    const resp = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY || "",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ""}`,
        Accept: "application/json",
      },
    });

    const raw = await resp.text();

    let json;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch (e) {
      return res.status(500).json({
        ok: false,
        where: "parse-json",
        error: "Supabase returned non-JSON",
        status: resp.status,
        rawPreview: raw?.slice(0, 300),
      });
    }

    if (!resp.ok) {
      return res.status(resp.status).json({
        ok: false,
        where: "supabase-rest",
        status: resp.status,
        body: json,
      });
    }

    // DIAGNOSTIC: show us exactly what we got back
    if (!Array.isArray(json)) {
      return res.status(500).json({
        ok: false,
        where: "shape-check",
        note: "payments payload is not an array",
        typename: Object.prototype.toString.call(json),
        keys: json && typeof json === "object" ? Object.keys(json) : null,
        sample: json,
      });
    }

    const payments = json;

    // If you want to actually refund now, flip this flag:
    const DO_REFUND = true;

    let attempted = 0;
    const refunded_intents = [];
    const skipped = [];

    for (const p of payments) {
      if (p.provider !== "stripe" || !p.amount_cents || p.amount_cents <= 0) {
        skipped.push({ provider: p.provider, amount_cents: p.amount_cents });
        continue;
      }
      attempted += 1;
      if (DO_REFUND) {
        await stripe.refunds.create({
          payment_intent: p.provider_id,
          amount: p.amount_cents,
        });
        refunded_intents.push(p.provider_id);
      }
    }

    return res.status(200).json({
      ok: true,
      probe: "refund-order v2",
      order_id,
      attempted,
      refunded_intents,
      skipped,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      where: "top-level",
      error: String(err?.message || err),
    });
  }
}
