import { supabaseServer } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('orders')
      .select('id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify(data || []), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500 });
  }
}
