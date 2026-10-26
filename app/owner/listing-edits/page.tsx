"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Claim = { facility_id: string };
type Facility = { id: string; canonical_name: string; license_number: string | null };
type Edit = { id: string; facility_id: string; field_name: string; proposed_value: unknown; review_status: string; created_at: string };
const panel: React.CSSProperties = { background: "white", padding: 22, border: "1px solid #dbe5eb", borderRadius: 14, marginTop: 18 };
const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 9, border: "1px solid #cad9e2", fontSize: 16 };
export default function OwnerListingEdits() {
  const router = useRouter();
  const [uid, setUid] = useState("");
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [edits, setEdits] = useState<Edit[]>([]);
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
    if (ids.length) {
      const homes = await supabase.from("wa_dshs_listed_facilities").select("id,canonical_name,license_number").in("id", ids);
      if (homes.error) { setError("Unable to load facility details."); return; }
      setFacilities((homes.data ?? []) as Facility[]);
      setFacilityId(old => ids.includes(old) ? old : ids[0]);
    } else { setFacilities([]); setFacilityId(""); }
    const history = await supabase.from("listing_edits").select("id,facility_id,field_name,proposed_value,review_status,created_at").eq("submitted_by_user_id", userId).order("created_at", { ascending: false }).limit(100);
    if (history.error) setError("Unable to load submitted proposals.");
    else { setEdits((history.data ?? []) as Edit[]); setError(""); }
  }
  useEffect(() => {
    let active = true;
    void (async () => {
      const auth = await supabase.auth.getUser();
      if (!active) return;
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
    if (!facilities.some(f => f.id === facilityId) || !["description", "services", "amenities"].includes(fieldName) || proposed.length < 1 || proposed.length > 2000) { setError("Choose an approved facility and enter 1–2,000 characters."); return; }
    setBusy(true);
    const auth = await supabase.auth.getUser();
    if (auth.error || auth.data.user?.id !== uid) { setError("Session expired. Sign in again."); setBusy(false); return; }
    const response = await supabase.from("listing_edits").insert({ facility_id: facilityId, submitted_by_user_id: uid, field_name: fieldName, proposed_value: proposed });
    if (response.error) setError("Could not submit proposal. Verify that your ownership claim was approved.");
    else { setValue(""); setNotice("Submitted for administrator review. No public listing has changed."); await refresh(uid); }
    setBusy(false);
  }
  return <main style={{ minHeight: "100vh", background: "#f4f8fb", color: "#123c59", padding: "30px 5%", fontFamily: "Arial,sans-serif" }}><div style={{ maxWidth: 960, margin: "auto" }}>
    <Link href="/owner/dashboard" style={{ color: "#176b53" }}>← Owner dashboard</Link><h1>Propose a listing update</h1>
    <p>Only representatives with approved ownership claims may propose descriptions, services, or amenities. Official DSHS licensing details cannot be changed here. A review decision alone does not publish a proposed value.</p>
    {loading ? <p>Loading account…</p> : <>
      {error && <p role="alert" style={{ color: "#9f2626" }}>{error}</p>}{notice && <p role="status" style={{ color: "#176b53" }}>{notice}</p>}
      <section style={panel}><h2>New proposal</h2>{facilities.length === 0 ? <p>You have no approved facility claims. <Link href="/owner/dashboard">Request verification in the owner dashboard.</Link></p> : <form onSubmit={submit}>
        <label htmlFor="facility">Facility</label><select id="facility" style={field} value={facilityId} onChange={e => setFacilityId(e.target.value)}>{facilities.map(f => <option key={f.id} value={f.id}>{f.canonical_name} {f.license_number ? "(" + f.license_number + ")" : ""}</option>)}</select>
        <label htmlFor="category" style={{ display: "block", marginTop: 15 }}>Information type</label><select id="category" style={field} value={fieldName} onChange={e => setFieldName(e.target.value)}><option value="description">Description</option><option value="services">Services</option><option value="amenities">Amenities</option></select>
        <label htmlFor="proposal" style={{ display: "block", marginTop: 15 }}>Proposed information (1–2,000 characters)</label><textarea id="proposal" required maxLength={2000} rows={6} style={field} value={value} onChange={e => setValue(e.target.value)} />
        <p style={{ fontSize: 13 }}>Do not include any resident personal information, health records, identity documents, or passwords.</p>
        <button disabled={busy} style={{ border: 0, borderRadius: 9, background: "#176b53", color: "white", padding: "12px 19px" }}>{busy ? "Submitting…" : "Submit proposal"}</button>
      </form>}</section>
      <section style={panel}><h2>My proposals</h2>{edits.length === 0 && <p>No proposals yet.</p>}{edits.map(e => <article key={e.id} style={{ padding: 13, borderTop: "1px solid #dbe5eb" }}><strong>{facilities.find(f => f.id === e.facility_id)?.canonical_name ?? "Facility"}</strong> — {e.field_name}<p>Status: <strong>{e.review_status}</strong> · {new Date(e.created_at).toLocaleString()}</p><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{typeof e.proposed_value === "string" ? e.proposed_value : JSON.stringify(e.proposed_value)}</p></article>)}</section>
    </>}
  </div></main>;
}
