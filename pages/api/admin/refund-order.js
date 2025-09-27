import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { order_id } = req.body;
  if (!order_id) {
    return res.status(400).json({ error: "Missing order_id" });
  }

  try {
    // Ask Supabase for total paid + payment intents
    const resp = await fetch(`${process.env.SUPABASE_URL}/rest/v1/payments?order_id=eq.${order_id}`, {
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    const payments = await resp.json();

    // Refund each Stripe payment
    for (const p of payments) {
      if (p.provider === "stripe" && p.amount_cents > 0) {
        await stripe.refunds.create({
          payment_intent: p.provider_id,
          amount: p.amount_cents,
        });
      }
    }

    res.json({ success: true, order_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
