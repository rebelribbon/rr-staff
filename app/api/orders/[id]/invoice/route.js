// app/api/orders/[id]/invoice/route.js
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(_req, { params }) {
  try {
    const orderId = params.id;

    // Grab core order fields
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        status,
        substatus,
        total_amount,
        amount_paid,
        tax_amount,
        discount_cents,
        subtotal_cents,
        delivery_fee,
        rush_fee,
        event_date,
        pickup_date,
        delivery_date,
        pickup_or_delivery,
        referral_code,
        customer_id
      `)
      .eq('id', orderId)
      .single();

    if (orderErr) {
      return new Response(JSON.stringify({ error: orderErr.message }), { status: 400 });
    }
    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
    }

    // (Optional) fetch customer basics if you want them on invoice
    const { data: cust, error: custErr } = await supabaseAdmin
      .from('customers')
      .select('id, name, email, phone')
      .eq('id', order.customer_id)
      .maybeSingle();

    if (custErr) {
      // don’t fail invoice just because customer fetch failed
      console.warn('customer fetch error:', custErr.message);
    }

    // Basic invoice shape (UI can render however you want)
    const invoice = {
      order: {
        id: order.id,
        status: order.status,
        substatus: order.substatus,
        total_amount: order.total_amount,
        amount_paid: order.amount_paid,
        tax_amount: order.tax_amount,
        subtotal_cents: order.subtotal_cents,
        discount_cents: order.discount_cents,
        delivery_fee: order.delivery_fee,
        rush_fee: order.rush_fee,
        event_date: order.event_date,
        pickup_date: order.pickup_date,
        delivery_date: order.delivery_date,
        method: order.pickup_or_delivery,
        referral_code: order.referral_code,
      },
      customer: cust || null,
      balance_due: Number(order.total_amount ?? 0) - Number(order.amount_paid ?? 0),
    };

    return new Response(JSON.stringify(invoice), { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
