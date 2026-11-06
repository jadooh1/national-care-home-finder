"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import {
  captureAndStripAuthCallback,
  clearRecoveryPending,
  markRecoveryPending,
  recoveryPending,
  type CapturedAuthCallback,
} from "../../../lib/password-recovery";

const captured: CapturedAuthCallback = captureAndStripAuthCallback();
const EXPIRED = "This link is invalid or has expired. Request a new message from the owner portal.";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Completing email confirmation…");

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
          setMessage("Confirming your password reset…");
          router.replace("/owner/reset-password");
          return;
        }
        router.replace("/owner/dashboard");
      } catch {
        const session = await supabase.auth.getSession();
        if (!session.data.session) clearRecoveryPending();
        else if (active && (recovery || recoveryPending())) {
          router.replace("/owner/reset-password");
          return;
        }
        if (active) setMessage(captured.hadAuthParams ? EXPIRED : "Confirmation could not be completed. Return to the owner portal and try signing in, or request a new confirmation email.");
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
    <section style={{ maxWidth: 580, margin: "auto", padding: 30, background: "white", borderRadius: 16 }}>
      <h1>Email confirmation</h1>
      <p role="status" style={{ lineHeight: 1.7 }}>{message}</p>
      <Link href="/owner" style={{ color: "#176b53" }}>Return to owner portal</Link>
    </section>
  </main>;
}
