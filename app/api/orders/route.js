// app/api/orders/route.js
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // e.g. 'Reviewing'
    const limit = Number(searchParams.get('limit') || 50);

    let q = supabaseAdmin
      .from('orders')
      .select('id, status, substatus, pickup_date, delivery_date, event_date, total_amount, amount_paid')
      .order('pickup_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (status) {
      q = q.eq('status', status);
    }

    q = q.limit(limit);

    const { data, error } = await q;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify(data || []), { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
