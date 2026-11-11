"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageSelector, useLanguage, usePageTitle } from "../../../components/language";
import { copy } from "../../../lib/copy/account";
import { browserClaimStorage, ownerClaimHref, readClaimLicense } from "../../../lib/owner-claim";
import { supabase } from "../../../lib/supabase";
import {
  captureAndStripAuthCallback,
  clearRecoveryPending,
  markRecoveryPending,
  recoveryPending,
  type CapturedAuthCallback,
} from "../../../lib/password-recovery";

const captured: CapturedAuthCallback = captureAndStripAuthCallback();
const languageStyle = `
.wa-lang { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 0 0 16px; }
.wa-lang button { min-height: 44px; padding: 8px 12px; border-radius: 999px; font-weight: 800; border: 1px solid #dbe5eb; background: #ffffff; color: #123c59; cursor: pointer; font-family: inherit; }
.wa-lang button[aria-pressed="true"] { background: #123c59; color: #ffffff; border-color: #123c59; }
`;

type CallbackPhase = keyof typeof copy.en.callback.phases;

export default function AuthCallbackPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const text = copy[locale].callback;
  usePageTitle(text.title);
  const [phase, setPhase] = useState<CallbackPhase>("completing");

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") markRecoveryPending();
    });
    let recovery = captured.recovery;
    async function finish() {
      try {
        const code = captured.code;
        captured.code = null;
        const tokenHash = captured.tokenHash;
        captured.tokenHash = null;
        if (code) {
          const exchanged = await supabase.auth.exchangeCodeForSession(code);
          const redirectType = (exchanged.data as { redirectType?: string | null }).redirectType;
          if (redirectType === "recovery") {
            recovery = true;
            markRecoveryPending();
          }
          if (exchanged.error) {
            const { data } = await supabase.auth.getSession();
            if (!data.session) throw new Error("expired");
          }
        } else if (tokenHash && captured.otpType) {
          const verified = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: captured.otpType,
          });
          if (captured.otpType === "recovery") {
            recovery = true;
            markRecoveryPending();
          }
          if (verified.error) throw new Error("expired");
        }
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) throw new Error("expired");
        if (!active) return;
        if (recovery) {
          setPhase("confirming");
          router.replace("/owner/reset-password");
          return;
        }
        const storage = browserClaimStorage();
        router.replace(ownerClaimHref(storage ? readClaimLicense(storage) : null));
      } catch {
        const session = await supabase.auth.getSession();
        if (!session.data.session) clearRecoveryPending();
        else if (active && (recovery || recoveryPending())) {
          router.replace("/owner/reset-password");
          return;
        }
        if (active) setPhase(captured.hadAuthParams ? "expired" : "incomplete");
      } finally {
        captured.code = null;
        captured.tokenHash = null;
      }
    }
    void finish();
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  return <main style={{ fontFamily: "Arial,sans-serif", background: "#f4f8fb", minHeight: "100vh", padding: "75px 6%", color: "#123c59" }}>
    <style>{languageStyle}</style>
    <section style={{ maxWidth: 580, margin: "auto", padding: 30, background: "white", borderRadius: 16 }}>
      <LanguageSelector />
      <h1>{text.title}</h1>
      <p role="status" style={{ lineHeight: 1.7 }}>{text.phases[phase]}</p>
      <Link href="/owner" style={{ color: "#176b53" }}>{text.returnLink}</Link>
    </section>
  </main>;
}
