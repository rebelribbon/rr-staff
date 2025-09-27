import Stripe from "stripe";
import getRawBody from "raw-body";
import { supabaseServer } from "../../../lib/supabase";

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"];
  const buf = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Bad signature", err?.message);
    return res.status(400).send("Bad signature");
  }

  const supabase = supabaseServer();
  const extId = event.id;

  // idempotency: store once
  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id,attempts")
    .eq("external_id", extId)
    .maybeSingle();

  if (!existing) {
    await supabase.from("webhook_events").insert([{
      provider: "stripe",
      event_type: event.type,
      external_id: extId,
      payload: event,
    }]);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const orderId = pi.metadata?.order_id;
        if (orderId) {
          await supabase.rpc("rr_upsert_payment_from_stripe", {
            p_order_id: orderId,
            p_amount: Math.round(pi.amount_received) / 100.0,
            p_payment_intent_id: pi.id,
          });
        }
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object;
        await supabase.rpc("rr_mark_refunded_by_intent", {
          p_payment_intent_id: charge.payment_intent,
        });
        break;
      }
      default:
        break;
    }

    await supabase
      .from("webhook_events")
      .update({ processed_at: new Date(), attempts: (existing?.attempts || 0) + 1 })
      .eq("external_id", extId);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook error", err);
    await supabase
      .from("webhook_events")
      .update({
        attempts: (existing?.attempts || 0) + 1,
        last_error: String(err?.message || err),
      })
      .eq("external_id", extId);
    return res.status(500).json({ ok: false });
  }
}
