"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Claim = { id: string; facility_id: string; claimant_user_id: string; verification_status: string; evidence_notes: string | null; reviewed_at: string | null };
type Facility = { id: string; canonical_name: string; license_number: string | null; city: string | null };
const card: React.CSSProperties = { border: "1px solid #dbe5eb", borderRadius: 14, background: "#fff", padding: 22, marginTop: 18 };
const button: React.CSSProperties = { border: 0, padding: "11px 16px", borderRadius: 9, color: "#fff", background: "#176b53", cursor: "pointer" };

export default function AdminClaimsPage() {
  const router = useRouter();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [facilities, setFacilities] = useState<Record<string, Facility>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [statusFilter, setStatusFilter] = useState("pending");

  const refresh = useCallback(async () => {
    const { data, error: e } = await supabase.from("owner_claims")
      .select("id,facility_id,claimant_user_id,verification_status,evidence_notes,reviewed_at")
      .order("id", { ascending: false }).limit(100);
    if (e) { setError("Unable to load claims. Check your administrator access and try again."); return; }
    const rows = (data ?? []) as Claim[];
    setClaims(rows);
    setError("");
    const ids = [...new Set(rows.map(c => c.facility_id))];
    if (ids.length) {
      const facilityResult = await supabase.from("wa_dshs_listed_facilities")
        .select("id,canonical_name,license_number,city").in("id", ids);
      if (!facilityResult.error) {
        const mapped: Record<string, Facility> = {};
        for (const f of (facilityResult.data ?? []) as Facility[]) mapped[f.id] = f;
        setFacilities(mapped);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function initialize() {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError || !auth.user) { router.replace("/owner"); return; }
      const { data: membership, error: membershipError } = await supabase.from("app_admins")
        .select("user_id").eq("user_id", auth.user.id).maybeSingle();
      if (!active) return;
      if (membershipError || !membership) { setError("Administrator access required. This account is not authorized to review claims."); setLoading(false); return; }
      setAdminId(auth.user.id);
      await refresh();
      if (active) setLoading(false);
    }
    void initialize();
    return () => { active = false; };
  }, [router, refresh]);

  async function review() {
    if (!confirm || !adminId || reviewing) return;
    const claim = claims.find(c => c.id === confirm.id);
    if (!claim || claim.verification_status !== "pending" || claim.claimant_user_id === adminId) {
      setError("Only another person's pending claim can be reviewed."); setConfirm(null); return;
    }
    setReviewing(confirm.id); setError(""); setNotice("");
    const fn = confirm.action === "approve" ? "admin_approve_owner_claim" : "admin_reject_owner_claim";
    const { data, error: e } = await supabase.rpc(fn, { p_claim_id: confirm.id });
    if (e || data !== true) setError(e?.message ?? "The review was not completed.");
    else { setNotice(`Claim ${confirm.action === "approve" ? "approved" : "rejected"}. This does not grant facility-editing rights.`); await refresh(); }
    setReviewing(null); setConfirm(null);
  }

  const visibleClaims = claims.filter(c => statusFilter === "all" || c.verification_status === statusFilter);

  return <main style={{ minHeight: "100vh", padding: "30px 5% 70px", color: "#123c59", background: "#f4f8fb", fontFamily: "Arial,sans-serif" }}>
    <div style={{ maxWidth: 1050, margin: "auto" }}>
      <Link href="/owner/dashboard" style={{ color: "#176b53" }}>← Owner dashboard</Link>
      <h1 style={{ fontSize: 35, marginBottom: 8 }}>Administrator claim reviews</h1>
    
<div style={{ margin: "18px 0" }}>
  <Link
    href="/admin/listing-edits"
    style={{
      display: "inline-block",
      padding: "12px 18px",
      background: "#176b53",
      color: "#fff",
      borderRadius: 9,
      textDecoration: "none",
      fontWeight: 600
    }}
  >
    Review listing proposals
  </Link>
</div>
  <p>Claims must be independently verified before approval. Approval records a decision only; it does not enable listing edits.</p>
      {loading && <p role="status">Checking administrator access…</p>}
      {error && <p role="alert" style={{ color: "#a32222" }}>{error}</p>}
      {notice && <p role="status" style={{ color: "#176b53", fontWeight: 700 }}>{notice}</p>}
      {adminId && !loading && <>
        <div style={{ ...card, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
          <label htmlFor="claim-filter">Claim status</label>
          <select id="claim-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd8df" }}>
            <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All</option>
          </select>
          <button style={button} type="button" onClick={() => void refresh()}>Refresh</button>
          <span>{visibleClaims.length} matching claims (up to 100 latest records)</span>
        </div>
        {visibleClaims.length === 0 && <section style={card}>No matching claims.</section>}
        {visibleClaims.map(c => <section key={c.id} style={card}>
          <h2 style={{ marginTop: 0, fontSize: 21 }}>{facilities[c.facility_id]?.canonical_name ?? "Facility listing"}</h2>
          <p><strong>License:</strong> {facilities[c.facility_id]?.license_number ?? "Not available"} · <strong>City:</strong> {facilities[c.facility_id]?.city ?? "Not available"}</p>
          <p><strong>Status:</strong> {c.verification_status}</p>
          <p><strong>Claim ID:</strong> <code style={{ overflowWrap: "anywhere" }}>{c.id}</code></p>
          <p><strong>Claimant user ID:</strong> <code style={{ overflowWrap: "anywhere" }}>{c.claimant_user_id}</code></p>
          <p><strong>Statement submitted:</strong></p>
          <div style={{ background: "#f4f8fb", borderRadius: 8, padding: 14, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{c.evidence_notes || "No statement supplied."}</div>
          {c.reviewed_at && <p><strong>Reviewed:</strong> {new Date(c.reviewed_at).toLocaleString()}</p>}
          {c.verification_status === "pending" && (c.claimant_user_id === adminId ?
            <p style={{ color: "#9a5320" }}>Your own claim cannot be reviewed by this administrator account.</p> :
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 15 }}>
              <button type="button" disabled={!!reviewing} style={button} onClick={() => setConfirm({ id: c.id, action: "approve" })}>Approve</button>
              <button type="button" disabled={!!reviewing} style={{ ...button, background: "#9f2626" }} onClick={() => setConfirm({ id: c.id, action: "reject" })}>Reject</button>
            </div>)}
          {confirm?.id === c.id && <div style={{ marginTop: 18, padding: 17, borderRadius: 10, border: "2px solid #d4a152", background: "#fffaf0" }}>
            <strong>Confirm {confirm.action}?</strong>
            <p>Review the owner's identity and authorization independently before proceeding. This change is recorded immediately and cannot be reversed from this page.</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button type="button" disabled={!!reviewing} onClick={() => void review()} style={{ ...button, background: confirm.action === "approve" ? "#176b53" : "#9f2626" }}>{reviewing ? "Processing…" : `Confirm ${confirm.action}`}</button>
              <button type="button" disabled={!!reviewing} onClick={() => setConfirm(null)} style={{ ...button, background: "#536b7c" }}>Cancel</button>
            </div>
          </div>}
        </section>)}
      </>}
    </div>
  </main>;
}
