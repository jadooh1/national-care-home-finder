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
import {
  claimSubmitGate,
  classifySubmission,
  createFacilitySearch,
  facilitySearchTerm,
  reduceFacilitySearch,
  rememberSubmittedClaim,
} from "../../../lib/owner-dashboard";
import { OWNER_FACILITY_COLUMNS, readManagedOwnerFacilities, searchOwnerFacilities, type OwnerFacilityClient } from "../../../lib/owner-facility-read";
import { captureAndStripAuthCallback, recoveryPending, markRecoveryPending } from "../../../lib/password-recovery";
import { supabase } from "../../../lib/supabase";

captureAndStripAuthCallback();

type Claim = { id: string; facility_id: string; verification_status: string; reviewed_at: string | null };
type ClaimEvent = { id: string; claim_id: string; event_type: string; to_status: string; created_at: string };
type Facility = { id: string; canonical_name: string; address_line1: string | null; city: string | null; county: string | null; license_number: string | null };
type DashError = "" | "load" | "duplicate" | "notes" | "session" | "submit";
type DashSearch = "" | "short" | "search" | "none";
type DashNotice = "" | "submitted" | "submittedRefresh";
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
  const [claimsLoadError, setClaimsLoadError] = useState(false);
  const [facilitiesLoadError, setFacilitiesLoadError] = useState(false);
  const [activityLoadError, setActivityLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Facility[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<DashSearch>("");
  const [selected, setSelected] = useState<Facility | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<DashNotice>("");
  const prefilled = useRef(false);
  const searchModel = useRef(createFacilitySearch<Facility>());
  const dashboardMounted = useRef(true);
  const submittingRef = useRef(false);

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
    if (!dashboardMounted.current) return { claimsError: Boolean(result.error), facilitiesError: false, activityError: false };
    if (result.error) {
      setClaimsLoadError(true);
      return { claimsError: true, facilitiesError: false, activityError: false };
    }
    const rows = (result.data ?? []) as Claim[];
    setClaims(rows);
    setClaimsLoadError(false);
    const ids = [...new Set(rows.map(claim => claim.facility_id))];
    let facilitiesError = false;
    if (ids.length) {
      const homes = await readManagedOwnerFacilities(supabase as unknown as OwnerFacilityClient, {
        requestedIds: ids,
        authorizedIds: ids,
        columns: OWNER_FACILITY_COLUMNS,
      });
      if (!dashboardMounted.current) return { claimsError: false, facilitiesError: homes.failed, activityError: false };
      if (homes.failed) {
        facilitiesError = true;
        setFacilitiesLoadError(true);
      } else {
        setFacilities(Object.fromEntries(homes.facilities.map(home => [home.id, {
          id: home.id,
          canonical_name: home.canonical_name,
          address_line1: home.address_line1 ?? null,
          city: home.city ?? null,
          county: home.county ?? null,
          license_number: home.license_number,
        }])));
        setFacilitiesLoadError(false);
      }
    } else if (dashboardMounted.current) {
      setFacilities({});
      setFacilitiesLoadError(false);
    }
    const activity = await supabase.from("owner_claim_events")
      .select("id,claim_id,event_type,to_status,created_at")
      .order("created_at", { ascending: false }).limit(20);
    if (!dashboardMounted.current) return { claimsError: false, facilitiesError, activityError: Boolean(activity.error) };
    if (activity.error) {
      setActivityLoadError(true);
      return { claimsError: false, facilitiesError, activityError: true };
    }
    setEvents((activity.data ?? []) as ClaimEvent[]);
    setActivityLoadError(false);
    return { claimsError: false, facilitiesError, activityError: false };
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
    return () => {
      active = false;
      dashboardMounted.current = false;
      searchModel.current = reduceFacilitySearch(searchModel.current, { type: "unmount" });
      subscription.unsubscribe();
    };
  }, [router, loadClaims]);

  function publishSearch(next: ReturnType<typeof createFacilitySearch<Facility>>, clearSelection: boolean) {
    searchModel.current = next;
    if (!next.mounted) return;
    setSearch(next.query);
    setResults([...next.results]);
    setSearching(next.searching);
    setSearchError(next.error);
    if (clearSelection) { setNotice(""); setSelected(null); }
  }

  const searchListedFacilities = useCallback(async (liveInput: string) => {
    const started = reduceFacilitySearch(searchModel.current, { type: "submit", liveInput });
    publishSearch(started, true);
    if (!started.mounted || !started.searching) return;
    const term = facilitySearchTerm(started.query);
    const ticket = started.ticket;
    const { data, error: queryError } = await searchOwnerFacilities(supabase as unknown as OwnerFacilityClient, {
      columns: OWNER_FACILITY_COLUMNS,
      term,
    });
    const painted = reduceFacilitySearch(searchModel.current, {
      type: "response",
      ticket,
      ok: !queryError,
      results: (data ?? []) as Facility[],
    });
    if (painted === searchModel.current) return;
    publishSearch(painted, false);
  }, []);

  useEffect(() => {
    if (!user || prefilled.current) return;
    const storage = browserClaimStorage();
    const fromUrl = claimLicenseQuery(new URLSearchParams(window.location.search).get("license"));
    if (storage && fromUrl) writeClaimLicense(storage, fromUrl);
    const license = fromUrl ?? (storage ? readClaimLicense(storage) : null);
    if (!license) return;
    prefilled.current = true;
    void searchListedFacilities(license);
  }, [user, searchListedFacilities]);

  function changeFacilityQuery(query: string) {
    const next = reduceFacilitySearch(searchModel.current, { type: "edit", query });
    if (next === searchModel.current) return;
    publishSearch(next, false);
  }

  function findFacility(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const live = new FormData(event.currentTarget).get("facility-search");
    void searchListedFacilities(typeof live === "string" ? live : "");
  }

  async function submitClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (claimSubmitGate(submittingRef.current) === "ignore" || !selected || !user) return;
    setNotice(""); setError("");
    if (duplicateClaimBlocks(claims, selected.id)) {
      setError("duplicate"); return;
    }
    const textNotes = notes.trim();
    if (textNotes.length < 15) { setError("notes"); return; }
    const facility = selected;
    submittingRef.current = true;
    setSubmitting(true);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user || authData.user.id !== user.id) {
      if (dashboardMounted.current) setError("session");
      submittingRef.current = false;
      if (dashboardMounted.current) setSubmitting(false);
      return;
    }
    const result = await supabase.rpc("submit_owner_claim", {
      p_facility_id: facility.id,
      p_evidence_notes: textNotes.slice(0, 1500),
    });
    if (!dashboardMounted.current) {
      submittingRef.current = false;
      return;
    }
    const submitted = classifySubmission(!result.error, { claimsError: false, facilitiesError: false, activityError: false });
    if (submitted === "failed") {
      setError("submit");
    } else {
      setClaims(current => rememberSubmittedClaim(current, facility.id));
      setFacilities(current => ({ ...current, [facility.id]: facility }));
      setNotice("submitted");
      setSelected(null); setNotes(""); setResults([]); setSearch("");
      const storage = browserClaimStorage();
      if (storage) writeClaimLicense(storage, null);
      const refresh = await loadClaims(authData.user.id);
      if (dashboardMounted.current && classifySubmission(true, refresh) === "submitted-refresh-failed") {
        setNotice("submittedRefresh");
      }
    }
    submittingRef.current = false;
    if (dashboardMounted.current) setSubmitting(false);
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
          {claimsLoadError && <p role="alert" style={{ color: "#a32222" }}>{text.errors.load} <button type="button" onClick={() => { if (user) void loadClaims(user.id); }} style={{ minHeight: 44, marginLeft: 8, padding: "8px 12px", borderRadius: 8, border: "1px solid #176b53", background: "white", color: "#176b53", cursor: "pointer" }}>{text.retry}</button></p>}
          {facilitiesLoadError && <p role="alert" style={{ color: "#a32222" }}>{text.errors.facilities} <button type="button" onClick={() => { if (user) void loadClaims(user.id); }} style={{ minHeight: 44, marginLeft: 8, padding: "8px 12px", borderRadius: 8, border: "1px solid #176b53", background: "white", color: "#176b53", cursor: "pointer" }}>{text.retry}</button></p>}
          {activityLoadError && <p role="alert" style={{ color: "#a32222" }}>{text.errors.activity} <button type="button" onClick={() => { if (user) void loadClaims(user.id); }} style={{ minHeight: 44, marginLeft: 8, padding: "8px 12px", borderRadius: 8, border: "1px solid #176b53", background: "white", color: "#176b53", cursor: "pointer" }}>{text.retry}</button></p>}
          {!claimsLoadError && claims.length === 0 && <p>{text.noClaims}</p>}
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
              <div style={{ flex: "1 1 230px" }}><input id="facility-search" name="facility-search" style={field} value={search} onChange={e => changeFacilityQuery(e.target.value)} maxLength={70} required /></div>
              <button type="submit" style={{ background: "#176b53", color: "white", padding: "11px 20px", border: 0, borderRadius: 9, cursor: "pointer" }}>{searching ? text.searching : text.find}</button>
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
