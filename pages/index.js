import { useEffect, useState } from "react";
import supabaseBrowser from "../lib/supabaseBrowser";

export default function Home() {
  const [session, setSession] = useState(null);
  const [orders, setOrders] = useState([]);
  const supabase = supabaseBrowser();

  // Check auth session
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // no session → send to signin
        window.location.replace("/signin");
      } else {
        setSession(session);
      }
    };

    checkSession();
  }, []);

  // Fetch today's orders once logged in
  useEffect(() => {
    if (!session) return;

    const fetchOrders = async () => {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, event_date, scheduled_at, total, paid")
        .eq("event_date", today);

      if (error) {
        console.error("Error loading orders", error);
      } else {
        setOrders(data || []);
      }
    };

    fetchOrders();
  }, [session]);

  // Refund handler
  async function handleRefund(orderId) {
    try {
      const res = await fetch("/api/refund-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
      const json = await res.json();
      console.log("Refund result:", json);

      alert(
        json.ok
          ? `Refund requested for order ${orderId}`
          : `Refund failed: ${json.error}`
      );
    } catch (e) {
      console.error(e);
      alert("Refund request failed");
    }
  }

  if (!session) return null; // wait for session check

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Today’s Orders</h1>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>Event date</th>
            <th>Scheduled</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.status}</td>
              <td>{o.event_date}</td>
              <td>{o.scheduled_at}</td>
              <td>${o.total?.toFixed(2)}</td>
              <td>${o.paid?.toFixed(2)}</td>
              <td>
                <button onClick={() => handleRefund(o.id)}>Refund</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
