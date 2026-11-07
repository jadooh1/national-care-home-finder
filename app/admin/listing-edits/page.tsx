"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { captureAndStripAuthCallback, recoveryPending } from "../../../lib/password-recovery";

captureAndStripAuthCallback();

type Edit = { id: string; facility_id: string; submitted_by_user_id: string | null; field_name: string; proposed_value: unknown; review_status: string; created_at: string; reviewed_at: string | null; field_published: boolean; current_publication: boolean; current_published_at: string | null };
type PublicationEvent = { id: string; facility_id: string; field_name: string; event_type: string; previous_value: string | null; published_value: string; created_at: string; actor_user_id: string };
type Facility = { id: string; canonical_name: string; license_number: string | null };
type Cursor = { before: string; beforeId: string };
const panel: React.CSSProperties = { border: "1px solid #dbe5eb", borderRadius: 14, background: "white", padding: 22, marginTop: 18 };
const btn: React.CSSProperties = { padding: "11px 17px", color: "white", background: "#176b53", border: 0, borderRadius: 9, cursor: "pointer" };
const pageSize = 20;
export default function AdminListingEdits() {
  const router = useRouter();
  const editCursor = useRef<Cursor | null>(null);
  const historyCursor = useRef<Cursor | null>(null);
  const [adminId, setAdminId] = useState("");
  const [edits, setEdits] = useState<Edit[]>([]);
  const [history, setHistory] = useState<PublicationEvent[]>([]);
  const [facilities, setFacilities] = useState<Record<string, Facility>>({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [confirm, setConfirm] = useState<{ id: string; decision: "approved" | "rejected" } | null>(null);
  const [publishId, setPublishId] = useState<string | null>(null);
  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const refresh = useCallback(async () => {
    const result = await supabase.rpc("admin_list_listing_edits", {
      p_limit: pageSize,
      p_before: editCursor.current?.before ?? null,
      p_before_id: editCursor.current?.beforeId ?? null,
    });
    if (result.error) { setError("Unable to load proposals. Check administrator access."); return; }
    const rows = (result.data ?? []) as Edit[];
    const events = await supabase.rpc("admin_list_owner_publication_events", {
      p_limit: pageSize,
      p_before: historyCursor.current?.before ?? null,
      p_before_id: historyCursor.current?.beforeId ?? null,
    });
    if (events.error) { setError("Unable to load publication history. Check administrator access."); return; }
    const eventRows = (events.data ?? []) as PublicationEvent[];
    setEdits(rows);
    setHistory(eventRows);
    setError("");
    const ids = [...new Set([...rows.map(r => r.facility_id), ...eventRows.map(r => r.facility_id)])];
    if (ids.length) {
      const homes = await supabase.from("wa_dshs_listed_facilities").select("id,canonical_name,license_number").in("id", ids);
      if (!homes.error) setFacilities(Object.fromEntries(((homes.data ?? []) as Facility[]).map(f => [f.id, f])));
    } else setFacilities({});
  }, []);
  useEffect(() => {
    let active = true;
    void (async () => {
      const auth = await supabase.auth.getUser();
      if (!active) return;
      if (recoveryPending()) { router.replace("/owner/reset-password"); return; }
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
  async function publish() {
    if (!publishId || !adminId || busy) return;
    const item = edits.find(e => e.id === publishId);
    if (!item || item.review_status !== "approved" || !item.submitted_by_user_id || item.submitted_by_user_id === adminId || item.current_publication) { setError("Cannot publish this proposal."); setPublishId(null); return; }
    setBusy(true); setError(""); setNotice("");
    const result = await supabase.rpc("admin_publish_listing_edit", { p_edit_id: publishId });
    if (result.error || result.data !== true) setError(result.error?.message ?? "Publication was not completed.");
    else { setNotice("Owner text was published separately. Official DSHS name, address, license, and capacity were not changed."); await refresh(); }
    setPublishId(null); setBusy(false);
  }
  async function withdraw() {
    if (!withdrawId || !adminId || busy) return;
    const item = edits.find(e => e.id === withdrawId);
    if (!item || !item.current_publication || item.submitted_by_user_id === adminId) { setError("Cannot withdraw this owner text."); setWithdrawId(null); return; }
    setBusy(true); setError(""); setNotice("");
    const result = await supabase.rpc("admin_withdraw_published_owner_listing", { p_facility_id: item.facility_id, p_field_name: item.field_name });
    if (result.error || result.data !== true) setError(result.error?.message ?? "Withdrawal was not completed.");
    else { setNotice("Owner text was removed from the public profile. The audit history remains. Official DSHS name, address, license, and capacity were not changed."); await refresh(); }
    setWithdrawId(null); setBusy(false);
  }
  const visible = edits.filter(e => status === "all" || e.review_status === status);
  return <main style={{ minHeight: "100vh", background: "#f4f8fb", color: "#123c59", padding: "30px 5%", fontFamily: "Arial,sans-serif" }}><div style={{ maxWidth: 1050, margin: "auto" }}>
    <Link href="/admin/claims" style={{ color: "#176b53" }}>← Administrator claim reviews</Link><h1>Listing proposal reviews</h1>
    <p>Review owner-provided descriptions, services, and amenities independently. Approving records a decision only. A separate publication action stores the approved text apart from official DSHS name, address, license, and capacity.</p>
    {loading && <p>Checking administrator access…</p>}{error && <p role="alert" style={{ color: "#9f2626" }}>{error}</p>}{notice && <p role="status" style={{ color: "#176b53" }}>{notice}</p>}
    {adminId && !loading && <><section style={panel}><label htmlFor="status">Review status </label><select id="status" value={status} onChange={e => setStatus(e.target.value)} style={{ padding: 10, margin: 8 }}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All</option></select><button type="button" style={btn} onClick={() => void refresh()}>Refresh</button> <button type="button" style={{ ...btn, background: "#536b7c" }} onClick={() => { editCursor.current = null; void refresh(); }}>First page</button>{edits.length === pageSize && <> <button type="button" style={{ ...btn, background: "#536b7c" }} onClick={() => { const last = edits[edits.length - 1]; editCursor.current = { before: last.created_at, beforeId: last.id }; void refresh(); }}>Older records</button></>}<p>{visible.length} matching proposals (20 records per page)</p></section>
      {visible.length === 0 && <section style={panel}>No matching proposals.</section>}
      {visible.map(edit => {
        const isCurrent = edit.current_publication;
        return <article key={edit.id} style={panel}><h2>{facilities[edit.facility_id]?.canonical_name ?? "Facility listing"}</h2><p>License: {facilities[edit.facility_id]?.license_number ?? "Not available"} · Field: <strong>{edit.field_name}</strong> · Status: <strong>{edit.review_status}</strong></p><p>Submitted: {new Date(edit.created_at).toLocaleString()}</p><p>Submitting user: <code style={{ overflowWrap: "anywhere" }}>{edit.submitted_by_user_id ?? "Unknown"}</code></p><div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "#f4f8fb", padding: 15, borderRadius: 8 }}>{typeof edit.proposed_value === "string" ? edit.proposed_value : JSON.stringify(edit.proposed_value)}</div>
        {isCurrent && <p>Currently published owner content as of {edit.current_published_at ? new Date(edit.current_published_at).toLocaleString() : "the latest publication"}. Official DSHS fields were not changed.</p>}
        {edit.review_status === "pending" && (edit.submitted_by_user_id === adminId ? <p>Self-review is prohibited.</p> : <div style={{ display: "flex", gap: 12, marginTop: 18 }}><button type="button" style={btn} onClick={() => { setPublishId(null); setWithdrawId(null); setConfirm({ id: edit.id, decision: "approved" }); }}>Approve</button><button type="button" style={{ ...btn, background: "#9f2626" }} onClick={() => { setPublishId(null); setWithdrawId(null); setConfirm({ id: edit.id, decision: "rejected" }); }}>Reject</button></div>)}
        {edit.review_status === "approved" && !isCurrent && (edit.submitted_by_user_id === adminId ? <p>Self-publication is prohibited.</p> : <div style={{ marginTop: 18 }}><button type="button" style={btn} onClick={() => { setConfirm(null); setWithdrawId(null); setPublishId(edit.id); }}>Publish owner text</button></div>)}
        {isCurrent && (edit.submitted_by_user_id === adminId ? <p>This account submitted the published text and cannot withdraw it.</p> : <div style={{ marginTop: 18 }}><button type="button" style={{ ...btn, background: "#9f2626" }} onClick={() => { setConfirm(null); setPublishId(null); setWithdrawId(edit.id); }}>Withdraw owner text</button></div>)}
        {confirm?.id === edit.id && <div style={{ border: "2px solid #d4a152", borderRadius: 10, marginTop: 18, padding: 16, background: "#fffaf0" }}><strong>Confirm {confirm.decision}?</strong><p>Verify the claim and accuracy independently. Review decisions do not publish listing data.</p><button type="button" disabled={busy} style={btn} onClick={() => void review()}>{busy ? "Processing…" : "Confirm"}</button> <button type="button" disabled={busy} style={{ ...btn, background: "#536b7c" }} onClick={() => setConfirm(null)}>Cancel</button></div>}
        {publishId === edit.id && <div style={{ border: "2px solid #d4a152", borderRadius: 10, marginTop: 18, padding: 16, background: "#fffaf0" }}><strong>Publish this approved text?</strong><p>{edit.field_published ? "This replaces the current owner text. It does not change the official DSHS name, address, license number, or capacity." : <>This stores the owner-provided {edit.field_name} separately. It does not change the official DSHS name, address, license number, or capacity.</>}</p><button type="button" disabled={busy} style={btn} onClick={() => void publish()}>{busy ? "Publishing…" : "Confirm publication"}</button> <button type="button" disabled={busy} style={{ ...btn, background: "#536b7c" }} onClick={() => setPublishId(null)}>Cancel</button></div>}
        {withdrawId === edit.id && <div style={{ border: "2px solid #d4a152", borderRadius: 10, marginTop: 18, padding: 16, background: "#fffaf0" }}><strong>Withdraw this owner text?</strong><p>Withdrawal removes that text from the public profile, keeps the audit history, and does not change official DSHS name, address, license, or capacity.</p><button type="button" disabled={busy} style={{ ...btn, background: "#9f2626" }} onClick={() => void withdraw()}>{busy ? "Withdrawing…" : "Confirm withdrawal"}</button> <button type="button" disabled={busy} style={{ ...btn, background: "#536b7c" }} onClick={() => setWithdrawId(null)}>Cancel</button></div>}
        </article>;
      })}
      <section style={panel}><h2>Publication history</h2><p>Each publication and withdrawal is kept here. Withdrawn text is no longer on the public profile. Official DSHS fields are not changed.</p><div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><button type="button" style={{ ...btn, background: "#536b7c" }} onClick={() => { historyCursor.current = null; void refresh(); }}>First page</button>{history.length === pageSize && <button type="button" style={{ ...btn, background: "#536b7c" }} onClick={() => { const last = history[history.length - 1]; historyCursor.current = { before: last.created_at, beforeId: last.id }; void refresh(); }}>Older records</button>}</div><p>20 records per page</p>
        {history.length === 0 && <p>No publication history on this page.</p>}
        {history.map(event => <article key={event.id} style={{ padding: 13, borderTop: "1px solid #dbe5eb" }}><strong>{facilities[event.facility_id]?.canonical_name ?? "Facility listing"}</strong> — {event.field_name}<p>{event.event_type === "withdrawn" ? "Withdrawn" : "Published"} · {new Date(event.created_at).toLocaleString()}</p><p>Administrator: <code style={{ overflowWrap: "anywhere" }}>{event.actor_user_id}</code></p><div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "#f4f8fb", padding: 15, borderRadius: 8 }}>{event.published_value}</div>{event.previous_value && event.previous_value !== event.published_value && <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>Previously: {event.previous_value}</p>}</article>)}
      </section>
    </>}
  </div></main>;
}
