"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Completing email confirmation…");
  useEffect(() => {
    let active = true;
    async function finish() {
      try {
        const url = new URL(window.location.href);
        const error = url.searchParams.get("error_description") || url.searchParams.get("error");
        if (error) throw new Error(error);
        const code = url.searchParams.get("code");
        const tokenHash = url.searchParams.get("token_hash");
        const type = url.searchParams.get("type");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (tokenHash && (type === "signup" || type === "email" || type === "magiclink" || type === "recovery" || type === "invite")) {
          const { error: otpError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          if (otpError) throw otpError;
        }
        // Also handles the default Supabase URL-fragment confirmation flow.
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError || !data.user) {
          if (active) setMessage("Confirmation could not be completed. Return to the owner portal and try signing in, or request a new confirmation email.");
          return;
        }
        if (active) router.replace("/owner/dashboard");
      } catch (e) {
        if (active) setMessage(e instanceof Error ? e.message : "Could not complete confirmation.");
      }
    }
    void finish();
    return () => { active = false; };
  }, [router]);
  return <main style={{fontFamily:"Arial,sans-serif",background:"#f4f8fb",minHeight:"100vh",padding:"75px 6%",color:"#123c59"}}>
    <section style={{maxWidth:580,margin:"auto",padding:30,background:"white",borderRadius:16}}>
      <h1>Email confirmation</h1><p role="status" style={{lineHeight:1.7}}>{message}</p>
      <Link href="/owner" style={{color:"#176b53"}}>Return to owner portal</Link>
    </section>
  </main>;
}
