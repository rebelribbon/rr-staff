// /pages/api/admin/refund-order.js
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ error: 'order_id required' });

    // Group payments by PaymentIntent and compute net cents per PI
    const { data: payments, error } = await supabase
      .from('payments')
      .select('provider_id, amount_cents')
      .eq('order_id', order_id);

    if (error) throw error;

    const byPI = new Map();
    for (const p of payments || []) {
      if (!p.provider_id) continue; // skip non-Stripe rows
      byPI.set(p.provider_id, (byPI.get(p.provider_id) || 0) + (p.amount_cents || 0));
    }

    const results = [];
    for (const [pi, netCents] of byPI.entries()) {
      // Only refund if money remains (>0)
      if (netCents > 0) {
        // You can either refund remaining balance…
        // const r = await stripe.refunds.create({ payment_intent: pi });

        // …or refund exactly the net cents recorded in your DB:
        const r = await stripe.refunds.create({ payment_intent: pi, amount: netCents });
        results.push({ payment_intent: pi, refunded: r.amount });
      }
    }

    return res.status(200).json({ ok: true, results });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
