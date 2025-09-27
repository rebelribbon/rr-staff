import { useEffect, useState } from "react";
import { getBrowserClient } from "../lib/supabaseBrowser"; // if this path errors, use "../../lib/supabaseBrowser"

export default function Staff() {
  const supabase = getBrowserClient();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      // 1) require login
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes?.user) {
        window.location.href = "/signin";
        return;
      }

      // 2) load orders
      const { data, error } = await supabase
        .from("orders")
        .select("id,status,total_cents,created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) setError(error.message);
      setOrders(data || []);
      setLoading(false);

      // 3) live updates (optional)
      const channel = supabase
        .channel("orders-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          (payload) => {
            setOrders((prev) => {
              if (payload.eventType === "INSERT") {
                return [payload.new, ...prev];
              }
              if (payload.eventType === "UPDATE") {
                return prev.map((o) => (o.id === payload.new.id ? payload.new : o));
              }
              if (payload.eventType === "DELETE") {
                return prev.filter((o) => o.id !== payload.old.id);
              }
              return prev;
            });
          }
        )
        .subscribe();

      unsub = () => supabase.removeChannel(channel);
    })();

    return () => unsub();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/signin";
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Staff Orders</h1>
        <button onClick={signOut}>Sign out</button>
      </header>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

      {!loading && !error && (
        <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Order</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Status</th>
              <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: 8 }}>Total</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td style={{ padding: 8, fontFamily: "ui-monospace" }}>{o.id.slice(0, 8)}</td>
                <td style={{ padding: 8 }}>{o.status}</td>
                <td style={{ padding: 8, textAlign: "right" }}>
                  ${((o.total_cents || 0) / 100).toFixed(2)}
                </td>
                <td style={{ padding: 8 }}>
                  {o.created_at ? new Date(o.created_at).toLocaleString() : "-"}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 12 }}>No orders yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </main>
  );
}
