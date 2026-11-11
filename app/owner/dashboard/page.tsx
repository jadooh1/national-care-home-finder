"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { LanguageSelector, useLanguage, usePageTitle } from "../../../components/language";
import { copy } from "../../../lib/copy/account";
import {
  browserClaimStorage,
  claimLicenseQuery,
  claimStatusKind,
  duplicateClaimBlocks,
  ownerSignInHref,
  readClaimLicense,
  writeClaimLicense,
} from "../../../lib/owner-claim";
import { captureAndStripAuthCallback, recoveryPending, markRecoveryPending } from "../../../lib/password-recovery";
import { supabase } from "../../../lib/supabase";

captureAndStripAuthCallback();

type Claim = { id: string; facility_id: string; verification_status: string; reviewed_at: string | null };
type ClaimEvent = { id: string; claim_id: string; event_type: string; to_status: string; created_at: string };
type Facility = { id: string; canonical_name: string; address_line1: string | null; city: string | null; county: string | null; license_number: string | null };
type DashError = "" | "load" | "duplicate" | "notes" | "session" | "submit";
type DashSearch = "" | "short" | "search" | "none";
type DashNotice = "" | "submitted";
const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 8, border: "1px solid #cad9e2", fontSize: 16 };
const card: React.CSSProperties = { background: "white", padding: 25, borderRadius: 14, border: "1px solid #dbe5eb", marginTop: 23 };
const languageStyle = `
.wa-lang { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 0 0 16px; }
.wa-lang button { min-height: 44px; padding: 8px 12px; border-radius: 999px; font-weight: 800; border: 1px solid #dbe5eb; background: #ffffff; color: #123c59; cursor: pointer; font-family: inherit; }
.wa-lang button[aria-pressed="true"] { background: #123c59; color: #ffffff; border-color: #123c59; }
`;

export default function OwnerDashboard() {
  const router = useRouter();
  const { locale } = useLanguage();
  const text = copy[locale].dashboard;
  const codes = copy[locale].codes;
  usePageTitle(text.title);
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [events, setEvents] = useState<ClaimEvent[]>([]);
  const [facilities, setFacilities] = useState<Record<string, Facility>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DashError>("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Facility[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<DashSearch>("");
  const [selected, setSelected] = useState<Facility | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<DashNotice>("");
  const prefilled = useRef(false);

  function codeLabel(value: string) {
    if (value === "pending" || value === "approved" || value === "rejected" || value === "submitted") return codes[value];
    return value;
  }

  function formatStamp(value: string) {
    return new Date(value).toLocaleString(locale === "es" ? "es" : undefined);
  }

  const loadClaims = useCallback(async (userId: string) => {
    const result = await supabase.from("owner_claims")
      .select("id,facility_id,verification_status,reviewed_at")
      .eq("claimant_user_id", userId).order("id", { ascending: false });
    if (result.error) setError("load");
    else {
      const rows = (result.data ?? []) as Claim[];
      setClaims(rows);
      const ids = [...new Set(rows.map(claim => claim.facility_id))];
      if (ids.length) {
        const homes = await supabase.from("wa_dshs_listed_facilities")
          .select("id,canonical_name,address_line1,city,county,license_number").in("id", ids);
        if (homes.error) setFacilities({});
        else setFacilities(Object.fromEntries(((homes.data ?? []) as Facility[]).map(home => [home.id, home])));
      } else setFacilities({});
      const activity = await supabase.from("owner_claim_events")
        .select("id,claim_id,event_type,to_status,created_at")
        .order("created_at", { ascending: false }).limit(20);
      if (activity.error) setEvents([]);
      else setEvents((activity.data ?? []) as ClaimEvent[]);
      setError("");
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (recoveryPending()) { router.replace("/owner/reset-password"); return; }
      if (authError || !data.user) {
        const license = claimLicenseQuery(new URLSearchParams(window.location.search).get("license"));
        router.replace(ownerSignInHref(license));
        return;
      }
      setUser(data.user);
      await loadClaims(data.user.id);
      if (active) setLoading(false);
    }
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") markRecoveryPending();
      if (event === "PASSWORD_RECOVERY" || recoveryPending()) { router.replace("/owner/reset-password"); return; }
      if (!session) { setUser(null); router.replace("/owner"); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [router, loadClaims]);

  const searchListedFacilities = useCallback(async (rawTerm: string) => {
    setSearchError(""); setNotice(""); setSelected(null); setResults([]);
    const term = rawTerm.trim().replace(/[^a-zA-Z0-9\s-]/g, "").slice(0, 70);
    if (term.length < 3) { setSearchError("short"); return; }
    setSearching(true);
    const pattern = `"%${term}%"`;
    const { data, error: queryError } = await supabase.from("wa_dshs_listed_facilities")
      .select("id,canonical_name,address_line1,city,county,license_number")
      .or(`canonical_name.ilike.${pattern},license_number.ilike.${pattern},city.ilike.${pattern}`)
      .order("canonical_name", { ascending: true }).limit(15);
    if (queryError) setSearchError("search");
    else { setResults((data ?? []) as Facility[]); if (!data?.length) setSearchError("none"); }
    setSearching(false);
  }, []);

  useEffect(() => {
    if (!user || prefilled.current) return;
    const storage = browserClaimStorage();
    const fromUrl = claimLicenseQuery(new URLSearchParams(window.location.search).get("license"));
    if (storage && fromUrl) writeClaimLicense(storage, fromUrl);
    const license = fromUrl ?? (storage ? readClaimLicense(storage) : null);
    if (!license) return;
    prefilled.current = true;
    setSearch(license);
    void searchListedFacilities(license);
  }, [user, searchListedFacilities]);

  function findFacility(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void searchListedFacilities(search);
  }

  async function submitClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !user) return;
    setNotice(""); setError("");
    if (duplicateClaimBlocks(claims, selected.id)) {
      setError("duplicate"); return;
    }
    const textNotes = notes.trim();
    if (textNotes.length < 15) { setError("notes"); return; }
    setSubmitting(true);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user || authData.user.id !== user.id) {
      setError("session"); setSubmitting(false); return;
    }
    const result = await supabase.rpc("submit_owner_claim", {
      p_facility_id: selected.id,
      p_evidence_notes: textNotes.slice(0, 1500),
    });
    if (result.error) setError("submit");
    else {
      setNotice("submitted");
      setSelected(null); setNotes(""); setResults([]); setSearch("");
      const storage = browserClaimStorage();
      if (storage) writeClaimLicense(storage, null);
      await loadClaims(authData.user.id);
    }
    setSubmitting(false);
  }

  async function signOut() { await supabase.auth.signOut(); router.replace("/owner"); }

  return <main style={{ minHeight: "100vh", fontFamily: "Arial,sans-serif", background: "#f4f8fb", color: "#123c59", padding: "30px 5%" }}>
    <style>{languageStyle}</style>
    <div style={{ maxWidth: 1000, margin: "auto" }}>
      <LanguageSelector />
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 15, flexWrap: "wrap" }}>
        <Link href="/washington" style={{ color: "#176b53" }}>{text.back}</Link>
        <button type="button" onClick={signOut} style={{ padding: "10px 16px", border: "1px solid #176b53", borderRadius: 8, color: "#176b53", background: "white", cursor: "pointer" }}>{text.signOut}</button>
      </header>
      <h1 style={{ fontSize: 35, marginTop: 34 }}>{text.title}</h1>
      {loading ? <p role="status">{text.checking}</p> : <>
        <p>{text.signedInAs} <strong>{user?.email}</strong></p>
        <section style={card}>
          <h2>{text.manage}</h2>
          <p>{text.manageBody}</p>
          <Link
            href="/owner/listing-edits"
            style={{
              display: "inline-block",
              padding: "12px 18px",
              background: "#176b53",
              color: "#fff",
              textDecoration: "none",
              borderRadius: 9,
              fontWeight: 600
            }}
          >
            {text.manage}
          </Link>
        </section>
        <section style={card}>
          <h2>{text.claimsTitle}</h2>
          <p>{text.claimsBody}</p>
          {claims.length === 0 && <p>{text.noClaims}</p>}
          {claims.map(c => {
            const home = facilities[c.facility_id];
            return <div key={c.id} style={{ padding: "14px 0", borderTop: "1px solid #dbe5eb" }}>
              <div><strong>{home?.canonical_name ?? text.facilityUnavailable}</strong></div>
              <div>{text.license} {home?.license_number ?? text.notListed}{home?.city ? ` · ${home.city}` : ""}</div>
              <div>
                <strong>{text.status}</strong>{" "}
                <span style={{
                  fontWeight: 800,
                  color: claimStatusKind(c.verification_status) === "approved" ? "#176b53" : claimStatusKind(c.verification_status) === "rejected" ? "#9f2626" : "#8a5a00",
                }}>
                  {claimStatusKind(c.verification_status) ? text.claimStatus[claimStatusKind(c.verification_status)!] : codeLabel(c.verification_status)}
                </span>
              </div>
              {claimStatusKind(c.verification_status) && <p style={{ margin: "6px 0 0", lineHeight: 1.5 }}>{text.claimStatusNote[claimStatusKind(c.verification_status)!]}</p>}
              {c.reviewed_at && <div>{text.reviewed} {formatStamp(c.reviewed_at)}</div>}
              {events.filter(event => event.claim_id === c.id).map(event => <div key={event.id}>{text.activity} {codeLabel(event.event_type)} → {codeLabel(event.to_status)}</div>)}
            </div>;
          })}
        </section>
        <section style={card}>
          <h2>{text.claimTitle}</h2>
          <p>{text.claimBody}</p>
          <form onSubmit={findFacility}>
            <label htmlFor="facility-search">{text.searchLabel}</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 9 }}>
              <div style={{ flex: "1 1 230px" }}><input id="facility-search" style={field} value={search} onChange={e => setSearch(e.target.value)} maxLength={70} required /></div>
              <button type="submit" disabled={searching} style={{ background: "#176b53", color: "white", padding: "11px 20px", border: 0, borderRadius: 9, cursor: "pointer" }}>{searching ? text.searching : text.find}</button>
            </div>
          </form>
          {searchError && <p role="alert" style={{ color: "#9f2626" }}>{text.errors[searchError]}</p>}
          {results.length > 0 && <div style={{ marginTop: 18 }}><h3>{text.selectFacility}</h3>{results.map(f => <button key={f.id} type="button" onClick={() => { setSelected(f); setNotes(""); setNotice(""); }} style={{ width: "100%", textAlign: "left", background: selected?.id === f.id ? "#e6f4ee" : "white", border: "1px solid #cbd8df", padding: 13, marginBottom: 8, borderRadius: 9, cursor: "pointer", color: "#123c59" }}><strong>{f.canonical_name}</strong><div>{[f.address_line1, f.city, f.county].filter(Boolean).join(", ")}</div><small>{text.license} {f.license_number ?? text.notListed}</small></button>)}</div>}
          {selected && <form onSubmit={submitClaim} style={{ marginTop: 22 }}>
            <h3>{text.requestTitle}</h3>
            <p><strong>{text.selectedFacility}</strong> {selected.canonical_name}</p>
            <label htmlFor="claim-notes">{text.relationship}</label>
            <textarea id="claim-notes" required minLength={15} maxLength={1500} value={notes} onChange={e => setNotes(e.target.value)} rows={4} style={{ ...field, display: "block", marginTop: 9 }} placeholder={text.relationshipPlaceholder} />
            <p style={{ fontSize: 13, lineHeight: 1.5 }}>{text.pendingNote}</p>
            <button disabled={submitting} type="submit" style={{ background: "#176b53", color: "white", padding: "13px 20px", border: 0, borderRadius: 9, cursor: "pointer" }}>{submitting ? text.submitting : text.submitClaim}</button>
          </form>}
          {notice && <p role="status" style={{ color: "#176b53", fontWeight: 600 }}>{text.notices[notice]}</p>}
          {error && <p role="alert" style={{ color: "#a32222" }}>{text.errors[error]}</p>}
        </section>
      </>}
    </div>
  </main>;
}
