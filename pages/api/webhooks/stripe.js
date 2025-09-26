import Stripe from "stripe";
// ⬇ change alias to relative
import { supabaseAdmin } from "../../../lib/supabase";

export const config = { api: { bodyParser: false } };

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  const sig = req.headers["stripe-signature"];
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    await supabaseAdmin.from("webhook_events").insert({
      provider: "stripe",
      event_type: "verify_failed",
      payload: { error: err.message }
    });
    return res.status(400).send("Invalid signature");
  }

  await supabaseAdmin.from("webhook_events").insert({
    provider: "stripe",
    event_type: event.type,
    payload: event
  });

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;
    await supabaseAdmin.from("payments").insert({
      order_id: pi.metadata?.order_id || null,
      provider: "stripe",
      provider_id: pi.id,
      amount_cents: pi.amount_received,
      status: "succeeded",
      raw: pi
    });
  }

  return res.json({ received: true });
}
