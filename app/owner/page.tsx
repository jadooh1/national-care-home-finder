"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 13, borderRadius: 9, border: "1px solid #cbd5e1", fontSize: 16, marginTop: 6 };
export default function OwnerPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active && data.user) router.replace("/owner/dashboard");
    });
    return () => { active = false; };
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      if (mode === "register") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: "https://nationalcarehomefinder.com/auth/callback" },
        });
        if (authError) throw authError;
        if (data.session) router.replace("/owner/dashboard");
        else setNotice("Check your email for a confirmation message. Follow the link to finish registration. Check spam if necessary.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        router.replace("/owner/dashboard");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in. Please retry.");
    } finally { setBusy(false); }
  }

  return <main style={{ minHeight: "100vh", background: "#f4f8fb", fontFamily: "Arial,sans-serif", color: "#123c59", padding: "32px 5%" }}>
    <div style={{ maxWidth: 530, margin: "auto" }}>
      <Link href="/washington" style={{ color: "#176b53" }}>← Washington directory</Link>
      <h1 style={{ fontSize: 35, marginTop: 34 }}>Care home owner portal</h1>
      <p style={{ lineHeight: 1.7 }}>Create an account or sign in. Registration does not verify facility ownership or grant editing access.</p>
      <section style={{ background: "white", padding: 28, borderRadius: 15, border: "1px solid #dbe5eb" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 25 }}>
          {(["register", "login"] as const).map(choice => <button key={choice} type="button" aria-pressed={mode === choice} onClick={() => { setMode(choice); setError(""); setNotice(""); }} style={{ padding: 12, border: 0, borderRadius: 9, cursor: "pointer", background: mode === choice ? "#176b53" : "#edf2f5", color: mode === choice ? "#fff" : "#123c59" }}>{choice === "register" ? "Create account" : "Sign in"}</button>)}
        </div>
        <form onSubmit={submit}>
          <label htmlFor="owner-email">Email address</label>
          <input id="owner-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} style={field} />
          <label htmlFor="owner-password" style={{ display: "block", marginTop: 20 }}>Password</label>
          <input id="owner-password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={6} required value={password} onChange={e => setPassword(e.target.value)} style={field} />
          {error && <p role="alert" style={{ color: "#af2424" }}>{error}</p>}
          {notice && <p role="status" style={{ color: "#176b53", lineHeight: 1.6 }}>{notice}</p>}
          <button disabled={busy} type="submit" style={{ width: "100%", padding: 14, marginTop: 24, border: 0, borderRadius: 9, background: "#176b53", color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>{busy ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}</button>
        </form>
      </section>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: "#536b7c" }}>This is an initial authentication test. Ownership claims and administrative approval are not yet enabled in the interface.</p>
    </div>
  </main>;
}
