"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { developmentBillingAllowed } from "../../../lib/premium-option-a";
import { captureAndStripAuthCallback, recoveryPending } from "../../../lib/password-recovery";
import { supabase } from "../../../lib/supabase";

captureAndStripAuthCallback();

type FeedbackRow = {
  id: string;
  found: boolean;
  comment: string | null;
  language: string;
  page_path: string;
  created_at: string;
};

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const development = developmentBillingAllowed(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!development) {
        router.replace("/admin/claims");
        return;
      }
      const auth = await supabase.auth.getUser();
      if (!active) return;
      if (recoveryPending()) {
        router.replace("/owner/reset-password");
        return;
      }
      if (!auth.data.user) {
        router.replace("/owner");
        return;
      }
      const member = await supabase.from("app_admins").select("user_id").eq("user_id", auth.data.user.id).maybeSingle();
      if (!active) return;
      if (member.error || !member.data) {
        router.replace("/owner/dashboard");
        return;
      }
      const list = await supabase.rpc("admin_list_visitor_feedback", { p_limit: 50 });
      if (!active) return;
      if (list.error) setError("The feedback list is unavailable.");
      else setRows((list.data ?? []) as FeedbackRow[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [development, router]);

  return (
    <main style={{ minHeight: "100vh", padding: "30px 5% 70px", color: "#123c59", background: "#f4f8fb", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "auto" }}>
        <Link href="/admin/claims" style={{ color: "#176b53" }}>← Claim reviews</Link>
        <h1 style={{ fontSize: 35, marginBottom: 8 }}>Visitor feedback</h1>
        <p>These comments are visible only to an administrator. They are not published on a facility profile.</p>
        {loading && <p role="status">Checking administrator access…</p>}
        {error && <p role="alert" style={{ color: "#a32222" }}>{error}</p>}
        {!loading && !error && rows.length === 0 && <p>No feedback has been sent.</p>}
        {rows.map((row) => (
          <article key={row.id} style={{ border: "1px solid #dbe5eb", borderRadius: 14, background: "white", padding: 22, marginTop: 18 }}>
            <p style={{ margin: 0 }}><strong>{row.found ? "Found" : "Not found"}</strong> · {row.language} · {row.page_path}</p>
            <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{row.comment || "No comment."}</p>
            <p style={{ color: "#536b7c", fontSize: 14 }}>{new Date(row.created_at).toLocaleString()}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
