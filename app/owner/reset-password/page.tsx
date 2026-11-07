"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import {
  captureAndStripAuthCallback,
  clearRecoveryPending,
  markRecoveryPending,
  passwordProblem,
  recoveryPending,
} from "../../../lib/password-recovery";

captureAndStripAuthCallback();

const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 13, borderRadius: 9, border: "1px solid #cbd5e1", fontSize: 16, marginTop: 6 };

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY") markRecoveryPending();
      if (event === "PASSWORD_RECOVERY" || (session && recoveryPending())) setAllowed(true);
    });
    async function load() {
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      if (data.user && recoveryPending()) setAllowed(true);
      else if (!error && !data.user) {
        const session = await supabase.auth.getSession();
        if (!session.data.session) clearRecoveryPending();
      }
      setReady(true);
    }
    void load();
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const problem = passwordProblem(password, confirmation);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError || !data.user) {
      if (!authError && !data.user) {
        const session = await supabase.auth.getSession();
        if (!session.data.session) clearRecoveryPending();
      }
      setAllowed(false);
      setError("This reset link is invalid or has expired. Request a new password reset from the owner portal.");
      setBusy(false);
      setPassword("");
      setConfirmation("");
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPassword("");
    setConfirmation("");
    setBusy(false);
    if (updateError) {
      setError("The password was not changed. Request a new reset link and try again.");
      return;
    }
    clearRecoveryPending();
    setNotice("Your password has been updated.");
    router.replace("/owner/dashboard");
  }

  async function signOut() {
    setPassword("");
    setConfirmation("");
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError("Sign out did not finish. The reset is still required.");
      return;
    }
    clearRecoveryPending();
    router.replace("/owner");
  }

  return <main style={{ minHeight: "100vh", background: "#f4f8fb", fontFamily: "Arial,sans-serif", color: "#123c59", padding: "32px 5%" }}>
    <div style={{ maxWidth: 530, margin: "auto" }}>
      <Link href="/owner" style={{ color: "#176b53" }}>← Owner portal</Link>
      <h1 style={{ fontSize: 35, marginTop: 34 }}>Choose a new password</h1>
      {!ready ? <p role="status">Checking your reset link…</p> : allowed ? <section style={{ background: "white", padding: 28, borderRadius: 15, border: "1px solid #dbe5eb" }}>
        <p style={{ lineHeight: 1.7 }}>Use 12 to 72 characters, with at least one letter and one number. This replaces the password for the signed-in account.</p>
        <form onSubmit={submit}>
          <label htmlFor="new-password">New password</label>
          <input id="new-password" type="password" autoComplete="new-password" required minLength={12} maxLength={72} value={password} onChange={event => setPassword(event.target.value)} style={field} />
          <label htmlFor="confirm-password" style={{ display: "block", marginTop: 20 }}>Confirm new password</label>
          <input id="confirm-password" type="password" autoComplete="new-password" required minLength={12} maxLength={72} value={confirmation} onChange={event => setConfirmation(event.target.value)} style={field} />
          {error && <p role="alert" style={{ color: "#af2424" }}>{error}</p>}
          {notice && <p role="status" style={{ color: "#176b53" }}>{notice}</p>}
          <button disabled={busy} type="submit" style={{ width: "100%", padding: 14, marginTop: 24, border: 0, borderRadius: 9, background: "#176b53", color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>{busy ? "Please wait…" : "Update password"}</button>
        </form>
        <button type="button" onClick={() => void signOut()} style={{ marginTop: 18, border: 0, background: "transparent", color: "#176b53", cursor: "pointer", padding: 0 }}>Sign out</button>
      </section> : <section style={{ background: "white", padding: 28, borderRadius: 15, border: "1px solid #dbe5eb" }}>
        <p role="alert" style={{ lineHeight: 1.7 }}>This reset link is invalid or has expired. Request a new password reset from the owner portal.</p>
        <Link href="/owner" style={{ color: "#176b53" }}>Return to owner portal</Link>
      </section>}
    </div>
  </main>;
}
