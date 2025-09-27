import supabaseBrowser from "../../lib/supabaseBrowser";
import { useEffect, useState } from "react";

export default function Staff() {
  const supabase = supabaseBrowser();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) {
        location.href = "/signin";
        return;
      }
      const { data, error } = await supabase
        .from("v_orders_basic")
        .select("*")
        .order("scheduled_datetime", { ascending: false });
      if (error) {
        alert(error.message);
      } else {
        setRows(data || []);
      }
    })();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "20px auto" }}>
      <h2>Today’s Orders</h2>
      <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>Event date</th>
            <th>Scheduled</th>
            <th>Total</th>
            <th>Paid</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id}>
              <td>{o.id.slice(0, 8)}…</td>
              <td style={{ textTransform: "capitalize" }}>{o.status}</td>
              <td>{o.event_date}</td>
              <td>{new Date(o.scheduled_datetime).toLocaleString()}</td>
              <td>${Number(o.total_amount ?? 0).toFixed(2)}</td>
              <td>${Number(o.amount_paid ?? 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
