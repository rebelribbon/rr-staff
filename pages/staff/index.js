<tbody>
  {orders.map((o) => (
    <tr key={o.id}>
      <td style={{ padding: 8, fontFamily: "ui-monospace" }}>{o.id.slice(0, 8)}</td>
      <td style={{ padding: 8 }}>
        <select
          value={o.status || "Reviewing"}
          onChange={async (e) => {
            const newStatus = e.target.value;
            // optimistic update
            setOrders((prev) =>
              prev.map((ord) =>
                ord.id === o.id ? { ...ord, status: newStatus } : ord
              )
            );
            // update in supabase
            const { error } = await supabase
              .from("orders")
              .update({ status: newStatus })
              .eq("id", o.id);
            if (error) {
              alert("Failed to update: " + error.message);
            }
          }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
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
