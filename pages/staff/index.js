import { useEffect, useState } from "react";
import { getBrowserClient } from "../../lib/supabaseBrowser"; // <-- two dots is correct

const STATUSES = [
  "Reviewing",
  "Approved",
  "Paid",
  "Pending Survey",
  "Fulfilled",
  "Canceled (refunded)",
  "Canceled (not refunded)",
  "Canceled (before payment)",
];

export default function Staff() {
  const supabase = getBrowserClient();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) {
        window.location.href = "/signin";
        return;
      }
      await loadOrders();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadOrders() {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("orders")
      .select("id,status,total_cents,created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) setError(error.message);
    setOrders(data || []);
    setLoading(false);
  }

  async function updateStatus(id, newStatus) {
    const prev = orders;
    setOrders((cur) => cur.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));

    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    if (error) {
      alert("Update failed: " + error.message);
      setOrders(prev); // rollback
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/signin";
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 960, margin: "0 auto" }}>
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
                <td style={{ padding: 8 }}>
                  <select
                    value={o.status || "Reviewing"}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
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
