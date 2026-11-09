"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageSelector, useLanguage, usePageTitle } from "../../components/language";
import { copy, localizedAuthServerMessage } from "../../lib/copy/account";
import { localizedPasswordProblem } from "../../lib/locale";
import { captureAndStripAuthCallback, clearRecoveryPending, recoveryPending, recoveryRedirectUrl } from "../../lib/password-recovery";
import { supabase } from "../../lib/supabase";

captureAndStripAuthCallback();

const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 13, borderRadius: 9, border: "1px solid #cbd5e1", fontSize: 16, marginTop: 6 };
const languageStyle = `
.wa-lang { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 0 0 16px; }
.wa-lang button { min-height: 44px; padding: 8px 12px; border-radius: 999px; font-weight: 800; border: 1px solid #dbe5eb; background: #ffffff; color: #123c59; cursor: pointer; font-family: inherit; }
.wa-lang button[aria-pressed="true"] { background: #123c59; color: #ffffff; border-color: #123c59; }
`;

type OwnerErrorId = "" | "server" | keyof typeof copy.en.owner.errors;
type OwnerNoticeId = "" | keyof typeof copy.en.owner.notices;

export default function OwnerPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const text = copy[locale].owner;
  usePageTitle(text.title);
  const [mode, setMode] = useState<"register" | "login" | "recover">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [noticeId, setNoticeId] = useState<OwnerNoticeId>("");
  const [errorId, setErrorId] = useState<OwnerErrorId>("");
  const [serverMessage, setServerMessage] = useState("");
  const [passwordProblem, setPasswordProblem] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active || !data.user) return;
      router.replace(recoveryPending() ? "/owner/reset-password" : "/owner/dashboard");
    });
    return () => { active = false; };
  }, [router]);

  function clearMessages() {
    setErrorId("");
    setNoticeId("");
    setServerMessage("");
    setPasswordProblem(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); clearMessages();
    try {
      if (mode === "register") {
        const problem = localizedPasswordProblem(locale, password, password);
        if (problem) {
          setPasswordProblem(problem);
          return;
        }
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { 
emailRedirectTo: `${window.location.origin}/auth/callback`
 },
        });
        if (authError) throw authError;
        if (data.session) {
          clearRecoveryPending();
          router.replace("/owner/dashboard");
        }
        else setNoticeId("confirmEmail");
      } else if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        clearRecoveryPending();
        router.replace("/owner/dashboard");
      } else {
        const redirectTo = recoveryRedirectUrl();
        if (!redirectTo) throw new Error(copy.en.owner.errors.resetUnavailable);
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
        if (resetError) throw new Error(copy.en.owner.errors.resetFailed);
        setPassword("");
        setNoticeId("resetSent");
      }
    } catch (e) {
      if (mode === "recover") setPassword("");
      const unavailable = e instanceof Error && e.message === copy.en.owner.errors.resetUnavailable;
      if (unavailable) setErrorId("resetUnavailable");
      else if (mode === "recover") setErrorId("resetFailed");
      else if (e instanceof Error) {
        setErrorId("server");
        setServerMessage(e.message);
      } else setErrorId("signInFailed");
    } finally { setBusy(false); }
  }

  const errorText = passwordProblem ?? (errorId === "server" ? localizedAuthServerMessage(locale, serverMessage) : errorId ? text.errors[errorId] : "");
  const noticeText = noticeId ? text.notices[noticeId] : "";

  return <main style={{ minHeight: "100vh", background: "#f4f8fb", fontFamily: "Arial,sans-serif", color: "#123c59", padding: "32px 5%" }}>
    <style>{languageStyle}</style>
    <div style={{ maxWidth: 530, margin: "auto" }}>
      <LanguageSelector />
      <Link href="/washington" style={{ color: "#176b53" }}>{text.back}</Link>
      <h1 style={{ fontSize: 35, marginTop: 34 }}>{text.title}</h1>
      <p style={{ lineHeight: 1.7 }}>{text.intro}</p>
      <section style={{ background: "white", padding: 28, borderRadius: 15, border: "1px solid #dbe5eb" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 25 }}>
          {(["register", "login"] as const).map(choice => <button key={choice} type="button" aria-pressed={mode === choice} onClick={() => { setMode(choice); setPassword(""); clearMessages(); }} style={{ padding: 12, border: 0, borderRadius: 9, cursor: "pointer", background: mode === choice ? "#176b53" : "#edf2f5", color: mode === choice ? "#fff" : "#123c59" }}>{choice === "register" ? text.createAccount : text.signIn}</button>)}
        </div>
        <form onSubmit={submit}>
          <label htmlFor="owner-email">{text.email}</label>
          <input id="owner-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} style={field} />
          {mode !== "recover" && <>
            <label htmlFor="owner-password" style={{ display: "block", marginTop: 20 }}>{text.password}</label>
            <input id="owner-password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={mode === "register" ? 12 : 6} maxLength={mode === "register" ? 72 : undefined} required value={password} onChange={e => setPassword(e.target.value)} style={field} />
            {mode === "register" && <p style={{ margin: "8px 0 0", color: "#536b7c", lineHeight: 1.5 }}>{text.passwordHelp}</p>}
          </>}
          {mode === "login" && <button type="button" onClick={() => { setMode("recover"); setPassword(""); clearMessages(); }} style={{ marginTop: 14, border: 0, background: "transparent", color: "#176b53", cursor: "pointer", padding: 0 }}>{text.forgot}</button>}
          {mode === "recover" && <p style={{ lineHeight: 1.6 }}>{text.recoverHelp}</p>}
          {errorText && <p role="alert" style={{ color: "#af2424" }}>{errorText}</p>}
          {noticeText && <p role="status" style={{ color: "#176b53", lineHeight: 1.6 }}>{noticeText}</p>}
          <button disabled={busy} type="submit" style={{ width: "100%", padding: 14, marginTop: 24, border: 0, borderRadius: 9, background: "#176b53", color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>{busy ? text.pleaseWait : mode === "register" ? text.createAccount : mode === "recover" ? text.sendResetLink : text.signIn}</button>
        </form>
      </section>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: "#536b7c" }}>{text.footnote}</p>
    </div>
  </main>;
}
