import supabaseBrowser from "../lib/supabaseBrowser";
import { useState } from "react";

export default function SignIn() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function send(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/staff` },
    });
    if (error) alert(error.message);
    else setSent(true);
  }

  if (sent) return <p>Check your email for the magic link</p>;

  return (
    <form onSubmit={send} style={{ maxWidth: 360, margin: "40px auto" }}>
      <h2>Staff sign in</h2>
      <input
        placeholder="you@email.com"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        style={{ width: "100%" }}
      />
      <button type="submit" style={{ marginTop: 12 }}>Send link</button>
    </form>
  );
}
