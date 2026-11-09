"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageSelector, useLanguage, usePageTitle } from "../../../components/language";
import { copy } from "../../../lib/copy/account";
import { localizedPasswordProblem } from "../../../lib/locale";
import { supabase } from "../../../lib/supabase";
import {
  captureAndStripAuthCallback,
  clearRecoveryPending,
  markRecoveryPending,
  recoveryPending,
} from "../../../lib/password-recovery";

captureAndStripAuthCallback();

const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 13, borderRadius: 9, border: "1px solid #cbd5e1", fontSize: 16, marginTop: 6 };
const languageStyle = `
.wa-lang { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 0 0 16px; }
.wa-lang button { min-height: 44px; padding: 8px 12px; border-radius: 999px; font-weight: 800; border: 1px solid #dbe5eb; background: #ffffff; color: #123c59; cursor: pointer; font-family: inherit; }
.wa-lang button[aria-pressed="true"] { background: #123c59; color: #ffffff; border-color: #123c59; }
`;

type ResetError = "" | keyof typeof copy.en.reset.errors;
type ResetNotice = "" | keyof typeof copy.en.reset.notices;

export default function ResetPasswordPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const text = copy[locale].reset;
  usePageTitle(text.title);
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorId, setErrorId] = useState<ResetError>("");
  const [noticeId, setNoticeId] = useState<ResetNotice>("");
  const [checked, setChecked] = useState<{ password: string; confirmation: string } | null>(null);

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
    setErrorId("");
    setNoticeId("");
    setChecked(null);
    const problem = localizedPasswordProblem(locale, password, confirmation);
    if (problem) {
      setChecked({ password, confirmation });
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
      setErrorId("expired");
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
      setErrorId("unchanged");
      return;
    }
    clearRecoveryPending();
    setNoticeId("updated");
    router.replace("/owner/dashboard");
  }

  async function signOut() {
    setPassword("");
    setConfirmation("");
    setChecked(null);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setErrorId("signOut");
      return;
    }
    clearRecoveryPending();
    router.replace("/owner");
  }

  const passwordError = checked ? localizedPasswordProblem(locale, checked.password, checked.confirmation) : null;
  const errorText = passwordError ?? (errorId ? text.errors[errorId] : "");
  const noticeText = noticeId ? text.notices[noticeId] : "";

  return <main style={{ minHeight: "100vh", background: "#f4f8fb", fontFamily: "Arial,sans-serif", color: "#123c59", padding: "32px 5%" }}>
    <style>{languageStyle}</style>
    <div style={{ maxWidth: 530, margin: "auto" }}>
      <LanguageSelector />
      <Link href="/owner" style={{ color: "#176b53" }}>{text.back}</Link>
      <h1 style={{ fontSize: 35, marginTop: 34 }}>{text.title}</h1>
      {!ready ? <p role="status">{text.checking}</p> : allowed ? <section style={{ background: "white", padding: 28, borderRadius: 15, border: "1px solid #dbe5eb" }}>
        <p style={{ lineHeight: 1.7 }}>{text.help}</p>
        <form onSubmit={submit}>
          <label htmlFor="new-password">{text.newPassword}</label>
          <input id="new-password" type="password" autoComplete="new-password" required minLength={12} maxLength={72} value={password} onChange={event => setPassword(event.target.value)} style={field} />
          <label htmlFor="confirm-password" style={{ display: "block", marginTop: 20 }}>{text.confirmPassword}</label>
          <input id="confirm-password" type="password" autoComplete="new-password" required minLength={12} maxLength={72} value={confirmation} onChange={event => setConfirmation(event.target.value)} style={field} />
          {errorText && <p role="alert" style={{ color: "#af2424" }}>{errorText}</p>}
          {noticeText && <p role="status" style={{ color: "#176b53" }}>{noticeText}</p>}
          <button disabled={busy} type="submit" style={{ width: "100%", padding: 14, marginTop: 24, border: 0, borderRadius: 9, background: "#176b53", color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>{busy ? text.pleaseWait : text.update}</button>
        </form>
        <button type="button" onClick={() => void signOut()} style={{ marginTop: 18, border: 0, background: "transparent", color: "#176b53", cursor: "pointer", padding: 0 }}>{text.signOut}</button>
      </section> : <section style={{ background: "white", padding: 28, borderRadius: 15, border: "1px solid #dbe5eb" }}>
        <p role="alert" style={{ lineHeight: 1.7 }}>{text.errors.expired}</p>
        <Link href="/owner" style={{ color: "#176b53" }}>{text.returnLink}</Link>
      </section>}
    </div>
  </main>;
}
