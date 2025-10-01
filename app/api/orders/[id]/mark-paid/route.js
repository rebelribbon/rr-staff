// app/api/orders/[id]/mark-paid/route.js
import { supabaseServer } from '@/lib/supabase';



export async function POST(req, { params }) {
  try {
    const orderId = params.id;
    const body = await req.json();

    // expected body:
    // {
    //   amount_cents: 5000,
    //   method: "venmo" | "cash" | "apple_cash" | "cashapp" | "check" | "stripe",
    //   reference: "optional string",
    //   evidence_urls: ["optional", "array", "of", "urls"]
    // }

    const amount_cents = Number(body.amount_cents || 0);
    const method = String(body.method || '').toLowerCase();
    const reference = body.reference ?? null;
    const evidence_urls = Array.isArray(body.evidence_urls) ? body.evidence_urls : [];

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Missing order id param' }), { status: 400 });
    }
    if (!(amount_cents > 0)) {
      return new Response(JSON.stringify({ error: 'amount_cents must be > 0' }), { status: 400 });
    }
    if (!method) {
      return new Response(JSON.stringify({ error: 'method is required' }), { status: 400 });
    }

    // Call your RPC function
    const { data, error } = await supabaseAdmin.rpc('rr_mark_payment_text', {
      p_order_id: orderId,
      p_amount_cents: amount_cents,
      p_method: method,
      p_reference: reference,
      p_evidence_urls: evidence_urls,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ payment_id: data }), { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
