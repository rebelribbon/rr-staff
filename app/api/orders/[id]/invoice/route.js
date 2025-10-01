import { supabaseServer } from '@/lib/supabase';

export async function GET(_req, { params }) {
  try {
    const orderId = params.id;

    const { data: order, error: orderErr } = await supabaseServer
      .from('orders')
      .select(`
        id, status, substatus, total_amount, amount_paid, tax_amount,
        discount_cents, subtotal_cents, delivery_fee, rush_fee,
        event_date, pickup_date, delivery_date, pickup_or_delivery,
        referral_code, customer_id
      `)
      .eq('id', orderId)
      .single();

    if (orderErr) {
      return new Response(JSON.stringify({ step: 'select order', error: orderErr.message }), { status: 400 });
    }
    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
    }

    const { data: cust, error: custErr } = await supabaseServer
      .from('customers')
      .select('id, name, email, phone')
      .eq('id', order.customer_id)
      .maybeSingle();

    return new Response(JSON.stringify({
      order,
      customer: cust || null,
      customer_fetch_error: custErr?.message || null,
      balance_due: Number(order.total_amount ?? 0) - Number(order.amount_paid ?? 0),
    }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 });
  }
}
