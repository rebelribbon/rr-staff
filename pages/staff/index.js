import { useEffect, useState } from "react";
import { getBrowserClient } from "../../lib/supabaseBrowser";


export default function StaffHome() {
  const supabase = getBrowserClient();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = "/signin";
      else loadOrders();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) window.location.href = "/signin";
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadOrders() {
    const { data } = await supabase
      .from("orders")
      .select("id,status,total_cents,created_at")
      .order("created_at", { ascending: false })
      .limit(25);
    setOrders(data || []);
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/signin";
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Today’s orders</h1>
        <button onClick={signOut}>Sign out</button>
      </header>
      {loading ? <p>Loading…</p> : (
        <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>ID</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Status</th>
              <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: 8 }}>Total</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td style={{ padding: 8 }}>{o.id.slice(0, 8)}</td>
                <td style={{ padding: 8 }}>{o.status}</td>
                <td style={{ padding: 8, textAlign: "right" }}>${((o.total_cents || 0) / 100).toFixed(2)}</td>
                <td style={{ padding: 8 }}>{new Date(o.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 12 }}>No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </main>
  );
}
