import { supabaseServer } from '@/lib/supabase';

export async function GET() {
  try {
    // 1) confirm envs are there
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasService = !!process.env.SUPABASE_SERVICE_ROLE;

    // 2) simple DB ping (orders count)
    const { data, error } = await supabaseServer
      .from('orders')
      .select('id', { count: 'exact', head: true });

    return new Response(JSON.stringify({
      ok: true,
      envs: { url: hasUrl, serviceRole: hasService },
      orders_count: data ? 'ok (head select used)' : null,
      db_error: error ? error.message : null,
    }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), { status: 200 });
  }
}
