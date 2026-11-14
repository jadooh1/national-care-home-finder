"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageSelector, useLanguage, usePageTitle } from "../../../components/language";
import { copy } from "../../../lib/copy/account";
import { captureAndStripAuthCallback, recoveryPending } from "../../../lib/password-recovery";
import { manageableOwnerContentView, ownerListingRefreshError, publishedContentOutcome } from "../../../lib/premium-option-a";
import { supabase } from "../../../lib/supabase";

captureAndStripAuthCallback();

type Claim = { facility_id: string };
type Facility = { id: string; canonical_name: string; license_number: string | null };
type Edit = { id: string; facility_id: string; field_name: string; review_status: string; created_at: string };
type EditEvent = { id: string; edit_id: string; event_type: string; from_status: string | null; to_status: string; created_at: string };
type Published = { facility_id: string; field_name: string; published_value: string; published_at: string };
type PublicationEvent = { id: string; facility_id: string; field_name: string; event_type: string; previous_value: string | null; published_value: string; created_at: string };
type Cursor = { before: string; beforeId: string };
type EditError = "" | keyof typeof copy.en.edits.errors;
type EditNotice = "" | keyof typeof copy.en.edits.notices;
const panel: React.CSSProperties = { background: "white", padding: 22, border: "1px solid #dbe5eb", borderRadius: 14, marginTop: 18 };
const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 9, border: "1px solid #cad9e2", fontSize: 16 };
const quietButton: React.CSSProperties = { border: 0, borderRadius: 9, background: "#536b7c", color: "white", padding: "11px 16px", cursor: "pointer" };
const pageSize = 20;
const languageStyle = `
.wa-lang { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 0 0 16px; }
.wa-lang button { min-height: 44px; padding: 8px 12px; border-radius: 999px; font-weight: 800; border: 1px solid #dbe5eb; background: #ffffff; color: #123c59; cursor: pointer; font-family: inherit; }
.wa-lang button[aria-pressed="true"] { background: #123c59; color: #ffffff; border-color: #123c59; }
`;

export default function OwnerListingEdits() {
  const router = useRouter();
  const { locale } = useLanguage();
  const text = copy[locale].edits;
  const codes = copy[locale].codes;
  usePageTitle(text.title);
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
  const [error, setError] = useState<EditError>("");
  const [notice, setNotice] = useState<EditNotice>("");

  function codeLabel(code: string) {
    if (code === "pending" || code === "approved" || code === "rejected" || code === "submitted") return codes[code];
    return code;
  }

  function fieldLabel(name: string) {
    if (name === "description" || name === "services" || name === "amenities") return text.fieldData[name];
    return name;
  }

  function formatStamp(stamp: string) {
    return new Date(stamp).toLocaleString(locale === "es" ? "es" : undefined);
  }

  function facilityName(id: string) {
    return facilities.find(item => item.id === id)?.canonical_name ?? text.facilityUnavailable;
  }

  async function refresh(userId: string) {
    const claims = await supabase.from("owner_claims").select("facility_id").eq("claimant_user_id", userId).eq("verification_status", "approved");
    if (claims.error) { setError("claims"); return; }
    const ids = [...new Set(((claims.data ?? []) as Claim[]).map(c => c.facility_id))];
    setApprovedIds(ids);
    const history = await supabase.rpc("owner_list_listing_edits", {
      p_limit: pageSize,
      p_before: editCursor.current?.before ?? null,
      p_before_id: editCursor.current?.beforeId ?? null,
    });
    if (history.error) { setError("proposals"); return; }
    const rows = (history.data ?? []) as Edit[];
    setEdits(rows);
    const activity = await supabase.rpc("owner_list_listing_edit_events", {
      p_limit: pageSize,
      p_before: eventCursor.current?.before ?? null,
      p_before_id: eventCursor.current?.beforeId ?? null,
    });
    if (activity.error) { setError("activity"); return; }
    setEvents((activity.data ?? []) as EditEvent[]);
    const publicationHistory = await supabase.rpc("owner_list_publication_history", {
      p_limit: pageSize,
      p_before: historyCursor.current?.before ?? null,
      p_before_id: historyCursor.current?.beforeId ?? null,
    });
    if (publicationHistory.error) { setError("history"); return; }
    const publicationRows = (publicationHistory.data ?? []) as PublicationEvent[];
    setPublications(publicationRows);
    let publishedFailed = false;
    if (ids.length) {
      try {
        const content = await supabase.from(manageableOwnerContentView(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")).select("facility_id,field_name,published_value,published_at").in("facility_id", ids);
        const publishedRows = (content.data ?? []) as Published[];
        const outcome = publishedContentOutcome(Boolean(content.error), publishedRows.length);
        if (outcome === "unavailable") {
          setPublished([]);
          publishedFailed = true;
        } else setPublished(publishedRows);
      } catch {
        setPublished([]);
        publishedFailed = true;
      }
    } else setPublished([]);
    const detailIds = [...new Set([...ids, ...rows.map(row => row.facility_id), ...publicationRows.map(row => row.facility_id)])];
    if (detailIds.length) {
      const homes = await supabase.from("wa_dshs_listed_facilities").select("id,canonical_name,license_number").in("id", detailIds);
      if (homes.error) { setError("facilities"); return; }
      setFacilities((homes.data ?? []) as Facility[]);
      setFacilityId(old => ids.includes(old) ? old : ids[0] ?? "");
    } else { setFacilities([]); setFacilityId(""); }
    const refreshError = ownerListingRefreshError({ publishedFailed, facilitiesFailed: false });
    if (refreshError) { setError(refreshError); return; }
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
    if (!approvedIds.includes(facilityId) || !["description", "services", "amenities"].includes(fieldName) || proposed.length < 1 || proposed.length > 2000) { setError("invalid"); return; }
    setBusy(true);
    const auth = await supabase.auth.getUser();
    if (auth.error || auth.data.user?.id !== uid) { setError("session"); setBusy(false); return; }
    const response = await supabase.rpc("submit_listing_edit", { p_facility_id: facilityId, p_field_name: fieldName, p_proposed_value: proposed });
    if (response.error) setError("submit");
    else { setValue(""); setNotice("submitted"); await refresh(uid); }
    setBusy(false);
  }
  return <main style={{ minHeight: "100vh", background: "#f4f8fb", color: "#123c59", padding: "30px 5%", fontFamily: "Arial,sans-serif" }}><style>{languageStyle}</style><div style={{ maxWidth: 960, margin: "auto" }}>
    <LanguageSelector />
    <Link href="/owner/dashboard" style={{ color: "#176b53" }}>{text.back}</Link><h1>{text.title}</h1>
    <p>{text.intro}</p>
    {loading ? <p>{text.loading}</p> : <>
      {error && <p role="alert" style={{ color: "#9f2626" }}>{text.errors[error]}</p>}{notice && <p role="status" style={{ color: "#176b53" }}>{text.notices[notice]}</p>}
      <section style={panel}><h2>{text.newProposal}</h2>{approvedIds.length === 0 ? <p>{text.noApproved} <Link href="/owner/dashboard">{text.requestVerification}</Link></p> : <form onSubmit={submit}>
        <label htmlFor="facility">{text.facility}</label><select id="facility" style={field} value={facilityId} onChange={e => setFacilityId(e.target.value)}>{facilities.filter(f => approvedIds.includes(f.id)).map(f => <option key={f.id} value={f.id}>{f.canonical_name} {f.license_number ? "(" + f.license_number + ")" : ""}</option>)}</select>
        <label htmlFor="category" style={{ display: "block", marginTop: 15 }}>{text.informationType}</label><select id="category" style={field} value={fieldName} onChange={e => setFieldName(e.target.value)}><option value="description">{text.fieldOption.description}</option><option value="services">{text.fieldOption.services}</option><option value="amenities">{text.fieldOption.amenities}</option></select>
        <label htmlFor="proposal" style={{ display: "block", marginTop: 15 }}>{text.proposedLabel}</label><textarea id="proposal" required maxLength={2000} rows={6} style={field} value={value} onChange={e => setValue(e.target.value)} />
        <p style={{ fontSize: 13 }}>{text.privacy}</p>
        <button disabled={busy} style={{ border: 0, borderRadius: 9, background: "#176b53", color: "white", padding: "12px 19px" }}>{busy ? text.submitting : text.submit}</button>
      </form>}</section>
      <section style={panel}><h2>{text.publishedTitle}</h2><p>{text.publishedBody}</p>{published.length === 0 && !error && <p>{text.nonePublished}</p>}{published.map(item => <article key={`${item.facility_id}-${item.field_name}`} style={{ padding: 13, borderTop: "1px solid #dbe5eb" }}><strong>{facilityName(item.facility_id)}</strong> — {fieldLabel(item.field_name)}<p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item.published_value}</p></article>)}</section>
      <section style={panel}><h2>{text.historyTitle}</h2><p>{text.historyBody}</p><div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><button type="button" style={quietButton} onClick={() => { historyCursor.current = null; void refresh(uid); }}>{text.firstPage}</button>{publications.length === pageSize && <button type="button" style={quietButton} onClick={() => { const last = publications[publications.length - 1]; historyCursor.current = { before: last.created_at, beforeId: last.id }; void refresh(uid); }}>{text.older}</button>}</div><p>{text.pageSize}</p>{publications.length === 0 && <p>{text.noHistory}</p>}{publications.map(item => <article key={item.id} style={{ padding: 13, borderTop: "1px solid #dbe5eb" }}><strong>{facilityName(item.facility_id)}</strong> — {fieldLabel(item.field_name)}<p>{item.event_type === "withdrawn" ? text.withdrawn : text.published} · {formatStamp(item.created_at)}</p><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item.published_value}</p></article>)}</section>
      <section style={panel}><h2>{text.proposalsTitle}</h2><p>{text.proposalsBody}</p><div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><button type="button" style={quietButton} onClick={() => { editCursor.current = null; void refresh(uid); }}>{text.firstPage}</button>{edits.length === pageSize && <button type="button" style={quietButton} onClick={() => { const last = edits[edits.length - 1]; editCursor.current = { before: last.created_at, beforeId: last.id }; void refresh(uid); }}>{text.older}</button>}</div><p>{text.pageSize}</p>{edits.length === 0 && <p>{text.noProposals}</p>}{edits.map(e => <article key={e.id} style={{ padding: 13, borderTop: "1px solid #dbe5eb" }}><strong>{facilityName(e.facility_id)}</strong> — {fieldLabel(e.field_name)}<p>{text.status} <strong>{codeLabel(e.review_status)}</strong> · {formatStamp(e.created_at)}</p></article>)}</section>
      <section style={panel}><h2>{text.activityTitle}</h2><div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><button type="button" style={quietButton} onClick={() => { eventCursor.current = null; void refresh(uid); }}>{text.firstPage}</button>{events.length === pageSize && <button type="button" style={quietButton} onClick={() => { const last = events[events.length - 1]; eventCursor.current = { before: last.created_at, beforeId: last.id }; void refresh(uid); }}>{text.older}</button>}</div><p>{text.pageSize}</p>{events.length === 0 && <p>{text.noActivity}</p>}{events.map(event => <article key={event.id} style={{ padding: 13, borderTop: "1px solid #dbe5eb" }}><p>{text.activity} {codeLabel(event.event_type)}{event.from_status ? `, ${codeLabel(event.from_status)} → ${codeLabel(event.to_status)}` : `, ${codeLabel(event.to_status)}`} · {formatStamp(event.created_at)}</p></article>)}</section>
    </>}
  </div></main>;
}
