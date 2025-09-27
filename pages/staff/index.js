import supabaseBrowser from "../../lib/supabaseBrowser";
import { useEffect, useState } from "react";

function Money({ value }) {
  const n = Number(value ?? 0);
  return <>${n.toFixed(2)}</>;
}
function StatusBadge({ status }) {
  const s = String(status ?? "").toLowerCase();
  const styles = {
    reviewing: { bg: "#fff7ed", color: "#9a3412", label: "Reviewing" },
    approved: { bg: "#eff6ff", color: "#1d4ed8", label: "Approved" },
    partially_paid: { bg: "#fef9c3", color: "#854d0e", label: "Partially paid" },
    paid: { bg: "#ecfdf5", color: "#065f46", label: "Paid" },
    fulfilled: { bg: "#eef2ff", color: "#4338ca", label: "Fulfilled" },
    canceled_refunded: { bg: "#fee2e2", color: "#991b1b", label: "Canceled (refunded)" },
    canceled_not_refunded: { bg: "#fee2e2", color: "#991b1b", label: "Canceled" },
    canceled_before_payment: { bg: "#f1f5f9", color: "#334155", label: "Canceled (no payment)" },
  };
  const style = styles[s] || { bg: "#f1f5f9", color: "#334155", label: s || "-" };
  return (
    <span style={{
      background: style.bg, color: style.color, padding: "2px 8px",
      borderRadius: 999, fontSize: 12, fontWeight: 600
    }}>
      {style.label}
    </span>
  );
}

export default function Staff() {
  const supabase = supabaseBrowser();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) { location.href = "/signin"; return; }
      const { data, error } = await supabase
        .from("v_orders_basic")
        .select("*")
        .order("scheduled_datetime", { ascending: false });
      if (error) alert(error.message);
      else setRows(data || []);
    })();
  }, []);

  return (
    <div style={{ maxWidth: 1000, margin: "20px auto" }}>
      <h2>Today’s Orders</h2>
      <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">ID</th>
            <th align="left">Status</th>
            <th align="left">Event date</th>
            <th align="left">Scheduled</th>
            <th align="right">Total</th>
            <th align="right">Paid</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(o => (
            <tr key={o.id} style={{ borderTop: "1px solid #eee" }}>
              <td>{o.id.slice(0,8)}…</td>
              <td><StatusBadge status={o.status} /></td>
              <td>{o.event_date}</td>
              <td>{o.scheduled_datetime ? new Date(o.scheduled_datetime).toLocaleString() : "-"}</td>
              <td align="right"><Money value={o.total_amount} /></td>
              <td align="right"><Money value={o.amount_paid} /></td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={6} align="center" style={{ padding: 30, color: "#64748b" }}>
              No orders today.
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
