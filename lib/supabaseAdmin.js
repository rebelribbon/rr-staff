import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,           // set in Vercel → Project → Settings → Environment Variables
  { auth: { persistSession: false } }
);
