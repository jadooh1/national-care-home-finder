"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Edit = { id: string; facility_id: string; submitted_by_user_id: string | null; field_name: string; proposed_value: unknown; review_status: string; created_at: string; reviewed_at: string | null };
type Facility = { id: string; canonical_name: string; license_number: string | null };
const panel: React.CSSProperties = { border: "1px solid #dbe5eb", borderRadius: 14, background: "white", padding: 22, marginTop: 18 };
const btn: React.CSSProperties = { padding: "11px 17px", color: "white", background: "#176b53", border: 0, borderRadius: 9, cursor: "pointer" };
export default function AdminListingEdits() {
  const router = useRouter();
  const [adminId, setAdminId] = useState("");
  const [edits, setEdits] = useState<Edit[]>([]);
  const [facilities, setFacilities] = useState<Record<string, Facility>>({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [confirm, setConfirm] = useState<{ id: string; decision: "approved" | "rejected" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const refresh = useCallback(async () => {
    const result = await supabase.from("listing_edits").select("id,facility_id,submitted_by_user_id,field_name,proposed_value,review_status,created_at,reviewed_at").order("created_at", { ascending: false }).limit(100);
    if (result.error) { setError("Unable to load proposals. Check administrator access."); return; }
    const rows = (result.data ?? []) as Edit[];
    setEdits(rows); setError("");
    const ids = [...new Set(rows.map(r => r.facility_id))];
    if (ids.length) {
      const homes = await supabase.from("wa_dshs_listed_facilities").select("id,canonical_name,license_number").in("id", ids);
      if (!homes.error) setFacilities(Object.fromEntries(((homes.data ?? []) as Facility[]).map(f => [f.id, f])));
    }
  }, []);
  useEffect(() => {
    let active = true;
    void (async () => {
      const auth = await supabase.auth.getUser();
      if (!active) return;
      if (auth.error || !auth.data.user) { router.replace("/owner"); return; }
      const member = await supabase.from("app_admins").select("user_id").eq("user_id", auth.data.user.id).maybeSingle();
      if (!active) return;
      if (member.error || !member.data) { setError("Administrator access required."); setLoading(false); return; }
      setAdminId(auth.data.user.id); await refresh();
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [router, refresh]);
  async function review() {
    if (!confirm || !adminId || busy) return;
    const item = edits.find(e => e.id === confirm.id);
    if (!item || item.review_status !== "pending" || !item.submitted_by_user_id || item.submitted_by_user_id === adminId) { setError("Cannot review this proposal."); setConfirm(null); return; }
    setBusy(true); setError(""); setNotice("");
    const result = await supabase.rpc("admin_review_listing_edit", { p_edit_id: confirm.id, p_decision: confirm.decision });
    if (result.error || result.data !== true) setError(result.error?.message ?? "Review was not completed.");
    else { setNotice(`Proposal ${confirm.decision}. This records a decision but does NOT publish changes.`); await refresh(); }
    setConfirm(null); setBusy(false);
  }
  const visible = edits.filter(e => status === "all" || e.review_status === status);
  return <main style={{ minHeight: "100vh", background: "#f4f8fb", color: "#123c59", padding: "30px 5%", fontFamily: "Arial,sans-serif" }}><div style={{ maxWidth: 1050, margin: "auto" }}>
    <Link href="/admin/claims" style={{ color: "#176b53" }}>← Administrator claim reviews</Link><h1>Listing proposal reviews</h1>
    <p>Review owner-provided descriptions, services and amenities independently. Approving here records a decision only; it does not publish text or change official DSHS data.</p>
    {loading && <p>Checking administrator access…</p>}{error && <p role="alert" style={{ color: "#9f2626" }}>{error}</p>}{notice && <p role="status" style={{ color: "#176b53" }}>{notice}</p>}
    {adminId && !loading && <><section style={panel}><label htmlFor="status">Review status </label><select id="status" value={status} onChange={e => setStatus(e.target.value)} style={{ padding: 10, margin: 8 }}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All</option></select><button type="button" style={btn} onClick={() => void refresh()}>Refresh</button><p>{visible.length} matching proposals (among 100 latest)</p></section>
      {visible.length === 0 && <section style={panel}>No matching proposals.</section>}
      {visible.map(edit => <article key={edit.id} style={panel}><h2>{facilities[edit.facility_id]?.canonical_name ?? "Facility listing"}</h2><p>License: {facilities[edit.facility_id]?.license_number ?? "Not available"} · Field: <strong>{edit.field_name}</strong> · Status: <strong>{edit.review_status}</strong></p><p>Submitted: {new Date(edit.created_at).toLocaleString()}</p><p>Submitting user: <code style={{ overflowWrap: "anywhere" }}>{edit.submitted_by_user_id ?? "Unknown"}</code></p><div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "#f4f8fb", padding: 15, borderRadius: 8 }}>{typeof edit.proposed_value === "string" ? edit.proposed_value : JSON.stringify(edit.proposed_value)}</div>
      {edit.review_status === "pending" && (edit.submitted_by_user_id === adminId ? <p>Self-review is prohibited.</p> : <div style={{ display: "flex", gap: 12, marginTop: 18 }}><button type="button" style={btn} onClick={() => setConfirm({ id: edit.id, decision: "approved" })}>Approve</button><button type="button" style={{ ...btn, background: "#9f2626" }} onClick={() => setConfirm({ id: edit.id, decision: "rejected" })}>Reject</button></div>)}
      {confirm?.id === edit.id && <div style={{ border: "2px solid #d4a152", borderRadius: 10, marginTop: 18, padding: 16, background: "#fffaf0" }}><strong>Confirm {confirm.decision}?</strong><p>Verify the claim and accuracy independently. Review decisions do not publish listing data.</p><button type="button" disabled={busy} style={btn} onClick={() => void review()}>{busy ? "Processing…" : "Confirm"}</button> <button type="button" disabled={busy} style={{ ...btn, background: "#536b7c" }} onClick={() => setConfirm(null)}>Cancel</button></div>}
      </article>)}
    </>}
  </div></main>;
}
