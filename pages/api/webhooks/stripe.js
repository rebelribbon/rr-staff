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

  let event;
  let buf;
  try {
    buf = await getRawBody(req);
    const sig = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature/body error:", err?.message);
    return res.status(400).send("Bad signature");
  }

  const supabase = supabaseServer();
  const extId = event.id;

  // ---- Idempotency: ensure a single row per Stripe event id
  // !!! Make sure webhook_events has UNIQUE(external_id) and the columns used below.
  const { error: upsertErr } = await supabase
    .from("webhook_events")
    .upsert(
      [
        {
          provider: "stripe",
          event_type: event.type,
          external_id: extId,
          payload: event, // jsonb
          // attempts will default to 0 if you set default in schema
        },
      ],
      { onConflict: "external_id" }
    );

  if (upsertErr) {
    // If the unique constraint isn't present yet, you can temporarily fall back to insert + ignore
    console.error("webhook_events upsert error:", upsertErr.message);
    // Still continue; we’ll process anyway but you may get dupes without the unique index.
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const orderId = pi?.metadata?.order_id;
        if (orderId) {
          // p_amount is dollars in your RPC; PI gives cents
          const dollars = pi.amount_received / 100;
          await supabase.rpc("rr_upsert_payment_from_stripe", {
            p_order_id: orderId,
            p_amount: dollars,
            p_payment_intent_id: pi.id,
          });
        }
        break;
      }

      case "charge.refunded":
      case "payment_intent.partially_refunded": {
        // Your DB logic tracks refunds by PaymentIntent id
        const obj = event.data.object;
        const paymentIntentId =
          obj.object === "charge" ? obj.payment_intent : obj.id;
        if (paymentIntentId) {
          await supabase.rpc("rr_mark_refunded_by_intent", {
            p_payment_intent_id: paymentIntentId,
          });
        }
        break;
      }

      // Add more handlers if/when you need:
      // case "invoice.payment_failed": ...
      default:
        break;
    }

    // Mark processed + bump attempts
    await supabase
      .from("webhook_events")
      .update({
        processed_at: new Date().toISOString(),
        // if attempts has default 0, increment safely:
        attempts: supabase.rpc
          ? undefined // if you don’t have a tiny SQL to increment in place, just set a fixed +1:
          : undefined,
      })
      .eq("external_id", extId);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    await supabase
      .from("webhook_events")
      .update({
        attempts: 1, // or increment via a DB function if you add one
        last_error: String(err?.message || err),
      })
      .eq("external_id", extId);

    return res.status(500).json({ ok: false });
  }
}
