"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { captureAndStripAuthCallback, recoveryPending } from "../../../lib/password-recovery";

captureAndStripAuthCallback();

type Claim = { facility_id: string };
type Facility = { id: string; canonical_name: string; license_number: string | null };
type Edit = { id: string; facility_id: string; field_name: string; review_status: string; created_at: string };
type EditEvent = { id: string; edit_id: string; event_type: string; from_status: string | null; to_status: string; created_at: string };
type Published = { facility_id: string; field_name: string; published_value: string; published_at: string };
type PublicationEvent = { id: string; facility_id: string; field_name: string; event_type: string; previous_value: string | null; published_value: string; created_at: string };
type Cursor = { before: string; beforeId: string };
const panel: React.CSSProperties = { background: "white", padding: 22, border: "1px solid #dbe5eb", borderRadius: 14, marginTop: 18 };
const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 9, border: "1px solid #cad9e2", fontSize: 16 };
const quietButton: React.CSSProperties = { border: 0, borderRadius: 9, background: "#536b7c", color: "white", padding: "11px 16px", cursor: "pointer" };
const pageSize = 20;
export default function OwnerListingEdits() {
  const router = useRouter();
  const [uid, setUid] = useState("");
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [edits, setEdits] = useState<Edit[]>([]);
  const [events, setEvents] = useState<EditEvent[]>([]);
  const [published, setPublished] = useState<Published[]>([]);
  const [publications, setPublications] = useState<PublicationEvent[]>([]);
  const editCursor = useRef<Cursor | null>(null);
  const eventCursor = useRef<Cursor | null>(null);
  const historyCursor = useRef<Cursor | null>(null);
  const [facilityId, setFacilityId] = useState("");
  const [fieldName, setFieldName] = useState("description");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function refresh(userId: string) {
    const claims = await supabase.from("owner_claims").select("facility_id").eq("claimant_user_id", userId).eq("verification_status", "approved");
    if (claims.error) { setError("Unable to load approved ownership claims."); return; }
    const ids = [...new Set(((claims.data ?? []) as Claim[]).map(c => c.facility_id))];
    setApprovedIds(ids);
    const history = await supabase.rpc("owner_list_listing_edits", {
      p_limit: pageSize,
      p_before: editCursor.current?.before ?? null,
      p_before_id: editCursor.current?.beforeId ?? null,
    });
    if (history.error) { setError("Unable to load submitted proposals."); return; }
    const rows = (history.data ?? []) as Edit[];
    setEdits(rows);
    const activity = await supabase.rpc("owner_list_listing_edit_events", {
      p_limit: pageSize,
      p_before: eventCursor.current?.before ?? null,
      p_before_id: eventCursor.current?.beforeId ?? null,
    });
    if (activity.error) { setError("Unable to load proposal activity."); return; }
    setEvents((activity.data ?? []) as EditEvent[]);
    const publicationHistory = await supabase.rpc("owner_list_publication_history", {
      p_limit: pageSize,
      p_before: historyCursor.current?.before ?? null,
      p_before_id: historyCursor.current?.beforeId ?? null,
    });
    if (publicationHistory.error) { setError("Unable to load publication history."); return; }
    const publicationRows = (publicationHistory.data ?? []) as PublicationEvent[];
    setPublications(publicationRows);
    if (ids.length) {
      const content = await supabase.from("wa_afh_published_owner_content").select("facility_id,field_name,published_value,published_at").in("facility_id", ids);
      setPublished(content.error ? [] : (content.data ?? []) as Published[]);
    } else setPublished([]);
    const detailIds = [...new Set([...ids, ...rows.map(row => row.facility_id), ...publicationRows.map(row => row.facility_id)])];
    if (detailIds.length) {
      const homes = await supabase.from("wa_dshs_listed_facilities").select("id,canonical_name,license_number").in("id", detailIds);
      if (homes.error) { setError("Unable to load facility details."); return; }
      setFacilities((homes.data ?? []) as Facility[]);
      setFacilityId(old => ids.includes(old) ? old : ids[0] ?? "");
    } else { setFacilities([]); setFacilityId(""); }
    setError("");
  }
  useEffect(() => {
    let active = true;
    void (async () => {
      const auth = await supabase.auth.getUser();
      if (!active) return;
      if (recoveryPending()) { router.replace("/owner/reset-password"); return; }
      if (auth.error || !auth.data.user) { router.replace("/owner"); return; }
      setUid(auth.data.user.id);
      await refresh(auth.data.user.id);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [router]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setNotice("");
    const proposed = value.trim();
    if (!approvedIds.includes(facilityId) || !["description", "services", "amenities"].includes(fieldName) || proposed.length < 1 || proposed.length > 2000) { setError("Choose an approved facility and enter 1–2,000 characters."); return; }
    setBusy(true);
    const auth = await supabase.auth.getUser();
    if (auth.error || auth.data.user?.id !== uid) { setError("Session expired. Sign in again."); setBusy(false); return; }
    const response = await supabase.rpc("submit_listing_edit", { p_facility_id: facilityId, p_field_name: fieldName, p_proposed_value: proposed });
    if (response.error) setError("Could not submit proposal. Verify that your ownership claim was approved.");
    else { setValue(""); setNotice("Submitted for administrator review. No public listing has changed."); await refresh(uid); }
    setBusy(false);
  }
  return <main style={{ minHeight: "100vh", background: "#f4f8fb", color: "#123c59", padding: "30px 5%", fontFamily: "Arial,sans-serif" }}><div style={{ maxWidth: 960, margin: "auto" }}>
    <Link href="/owner/dashboard" style={{ color: "#176b53" }}>← Owner dashboard</Link><h1>Propose a listing update</h1>
    <p>Only representatives with approved ownership claims may propose descriptions, services, or amenities. Official DSHS licensing details cannot be changed here. A review decision alone does not publish a proposed value.</p>
    {loading ? <p>Loading account…</p> : <>
      {error && <p role="alert" style={{ color: "#9f2626" }}>{error}</p>}{notice && <p role="status" style={{ color: "#176b53" }}>{notice}</p>}
      <section style={panel}><h2>New proposal</h2>{approvedIds.length === 0 ? <p>You have no approved facility claims. <Link href="/owner/dashboard">Request verification in the owner dashboard.</Link></p> : <form onSubmit={submit}>
        <label htmlFor="facility">Facility</label><select id="facility" style={field} value={facilityId} onChange={e => setFacilityId(e.target.value)}>{facilities.filter(f => approvedIds.includes(f.id)).map(f => <option key={f.id} value={f.id}>{f.canonical_name} {f.license_number ? "(" + f.license_number + ")" : ""}</option>)}</select>
        <label htmlFor="category" style={{ display: "block", marginTop: 15 }}>Information type</label><select id="category" style={field} value={fieldName} onChange={e => setFieldName(e.target.value)}><option value="description">Description</option><option value="services">Services</option><option value="amenities">Amenities</option></select>
        <label htmlFor="proposal" style={{ display: "block", marginTop: 15 }}>Proposed information (1–2,000 characters)</label><textarea id="proposal" required maxLength={2000} rows={6} style={field} value={value} onChange={e => setValue(e.target.value)} />
        <p style={{ fontSize: 13 }}>Do not include any resident personal information, health records, identity documents, or passwords.</p>
        <button disabled={busy} style={{ border: 0, borderRadius: 9, background: "#176b53", color: "white", padding: "12px 19px" }}>{busy ? "Submitting…" : "Submit proposal"}</button>
      </form>}</section>
      <section style={panel}><h2>Published on the public profile</h2><p>This is the owner-provided text an administrator has published. It is stored separately from the official DSHS licensing record. Withdrawn text is removed from this section.</p>{published.length === 0 && <p>No owner text is published for your approved facilities.</p>}{published.map(item => <article key={`${item.facility_id}-${item.field_name}`} style={{ padding: 13, borderTop: "1px solid #dbe5eb" }}><strong>{facilities.find(f => f.id === item.facility_id)?.canonical_name ?? "Facility details are unavailable"}</strong> — {item.field_name}<p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item.published_value}</p></article>)}</section>
      <section style={panel}><h2>Publication history</h2><p>This history covers facilities with your approved ownership claim. It does not show administrator accounts.</p><div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><button type="button" style={quietButton} onClick={() => { historyCursor.current = null; void refresh(uid); }}>First page</button>{publications.length === pageSize && <button type="button" style={quietButton} onClick={() => { const last = publications[publications.length - 1]; historyCursor.current = { before: last.created_at, beforeId: last.id }; void refresh(uid); }}>Older records</button>}</div><p>20 records per page</p>{publications.length === 0 && <p>No publication history for your approved facilities.</p>}{publications.map(item => <article key={item.id} style={{ padding: 13, borderTop: "1px solid #dbe5eb" }}><strong>{facilities.find(f => f.id === item.facility_id)?.canonical_name ?? "Facility details are unavailable"}</strong> — {item.field_name}<p>{item.event_type === "withdrawn" ? "No longer on the public profile" : "Published"} · {new Date(item.created_at).toLocaleString()}</p><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item.published_value}</p></article>)}</section>
      <section style={panel}><h2>My proposals</h2><p>The proposed text is stored for administrator review and is not shown on this page. Approval does not publish it.</p><div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><button type="button" style={quietButton} onClick={() => { editCursor.current = null; void refresh(uid); }}>First page</button>{edits.length === pageSize && <button type="button" style={quietButton} onClick={() => { const last = edits[edits.length - 1]; editCursor.current = { before: last.created_at, beforeId: last.id }; void refresh(uid); }}>Older records</button>}</div><p>20 records per page</p>{edits.length === 0 && <p>No proposals yet.</p>}{edits.map(e => <article key={e.id} style={{ padding: 13, borderTop: "1px solid #dbe5eb" }}><strong>{facilities.find(f => f.id === e.facility_id)?.canonical_name ?? "Facility details are unavailable"}</strong> — {e.field_name}<p>Status: <strong>{e.review_status}</strong> · {new Date(e.created_at).toLocaleString()}</p></article>)}</section>
      <section style={panel}><h2>Proposal activity</h2><div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><button type="button" style={quietButton} onClick={() => { eventCursor.current = null; void refresh(uid); }}>First page</button>{events.length === pageSize && <button type="button" style={quietButton} onClick={() => { const last = events[events.length - 1]; eventCursor.current = { before: last.created_at, beforeId: last.id }; void refresh(uid); }}>Older records</button>}</div><p>20 records per page</p>{events.length === 0 && <p>No proposal activity yet.</p>}{events.map(event => <article key={event.id} style={{ padding: 13, borderTop: "1px solid #dbe5eb" }}><p>Activity: {event.event_type}{event.from_status ? `, ${event.from_status} → ${event.to_status}` : `, ${event.to_status}`} · {new Date(event.created_at).toLocaleString()}</p></article>)}</section>
    </>}
  </div></main>;
}
