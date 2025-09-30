import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // optional filter

    let query = supabaseAdmin
      .from('orders')
      .select(
        'id, customer_id, status, substatus, delivery_date, pickup_date, event_date, total_amount, amount_paid, created_at'
      )
      // “closest to today at the top” using your three date fields, then newest:
      .order('delivery_date', { ascending: true, nullsFirst: false })
      .order('pickup_date',   { ascending: true, nullsFirst: false })
      .order('event_date',    { ascending: true, nullsFirst: false })
      .order('created_at',    { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query.limit(50);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json(data ?? []);
  } catch (err) {
    return Response.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
