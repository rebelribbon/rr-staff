// rr-staff/pages/debug.js
import { useMemo } from "react";
import supabaseBrowser from "../lib/supabaseBrowser"; // default export

export default function Debug() {
  // create the browser client once on the client
  const supabase = useMemo(() => supabaseBrowser(), []);

  async function testDB() {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id")
        .limit(1);
      alert(
        error
          ? `DB error: ${error.message}`
          : `DB OK. Rows: ${data?.length ?? 0}`
      );
    } catch (e) {
      alert("DB fetch failed: " + (e?.message || e));
    }
  }

  async function testAuth() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      alert("Auth settings reachable ✅");
      console.log(json);
    } catch (e) {
      alert("Auth settings fetch FAILED ❌: " + (e?.message || e));
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Debug</h1>
      <pre style={{ background: "#111", color: "#0f0", padding: 12 }}>
        {JSON.stringify(
          {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL,
            anonKeyStartsWith:
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 12),
          },
          null,
          2
        )}
      </pre>
      <button onClick={testDB} style={{ marginRight: 8 }}>
        Test DB
      </button>
      <button onClick={testAuth}>Test Auth</button>
      <p style={{ marginTop: 12 }}>Open the console for details (F12).</p>
    </main>
  );
}

// Force SSR so Next.js doesn't try to prerender this page at build time
export async function getServerSideProps() {
  return { props: {} };
}
