import { createClient } from "@supabase/supabase-js";

let sb;
export default function supabaseBrowser() {
  if (!sb) {
    sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: true, autoRefreshToken: true } }
    );
  }
  return sb;
}
