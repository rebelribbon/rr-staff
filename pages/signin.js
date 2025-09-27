import { useState } from "react";
import { getBrowserClient } from "@/lib/supabaseBrowser";

export default function SignIn() {
  const supabase = getBrowserClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  async function sendLink(e) {
    e.preventDefault();
    setErr("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: "https://rr-staff.vercel.app/staff", // after clicking email link
        },
      });
      if (error) {
        setErr(error.message);
      } else {
        setSent(true);
      }
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "72px auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>Staff Sign In</h1>

      {sent ? (
        <p>✅ Check your email for a sign-in link.</p>
      ) : (
        <form onSubmit={sendLink}>
          <label>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            style={{ width: "100%", padding: 10, marginTop: 6, marginBottom: 12 }}
          />
          <button type="submit" style={{ padding: "10px 14px" }}>
            Send Link
          </button>
          {err && <p style={{ color: "crimson" }}>{err}</p>}
        </form>
      )}
    </main>
  );
}
