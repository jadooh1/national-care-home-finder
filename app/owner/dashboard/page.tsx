"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";

type Claim = { id: string; facility_id: string; verification_status: string; reviewed_at: string | null };
type Facility = { id: string; canonical_name: string; address_line1: string | null; city: string | null; county: string | null; license_number: string | null };
const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 8, border: "1px solid #cad9e2", fontSize: 16 };
const card: React.CSSProperties = { background: "white", padding: 25, borderRadius: 14, border: "1px solid #dbe5eb", marginTop: 23 };
export default function OwnerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Facility[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selected, setSelected] = useState<Facility | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  const loadClaims = useCallback(async (userId: string) => {
    const result = await supabase.from("owner_claims")
      .select("id,facility_id,verification_status,reviewed_at")
      .eq("claimant_user_id", userId).order("id", { ascending: false });
    if (result.error) setError("Unable to load ownership claims. Please try again later.");
    else { setClaims((result.data ?? []) as Claim[]); setError(""); }
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError || !data.user) { router.replace("/owner"); return; }
      setUser(data.user);
      await loadClaims(data.user.id);
      if (active) setLoading(false);
    }
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setUser(null); router.replace("/owner"); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [router, loadClaims]);

  async function findFacility(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSearchError(""); setNotice(""); setSelected(null); setResults([]);
    const term = search.trim().replace(/[^a-zA-Z0-9\s-]/g, "").slice(0, 70);
    if (term.length < 3) { setSearchError("Enter at least 3 letters or numbers."); return; }
    setSearching(true);
    const { data, error: queryError } = await supabase.from("wa_dshs_listed_facilities")
      .select("id,canonical_name,address_line1,city,county,license_number")
      .or(`canonical_name.ilike.%${term}%,license_number.ilike.%${term}%,city.ilike.%${term}%`)
      .order("canonical_name", { ascending: true }).limit(15);
    if (queryError) setSearchError("Unable to search facilities. Please retry.");
    else { setResults((data ?? []) as Facility[]); if (!data?.length) setSearchError("No matching listings. Try a facility name or license number."); }
    setSearching(false);
  }

  async function submitClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !user) return;
    setNotice(""); setError("");
    if (claims.some(c => c.facility_id === selected.id && c.verification_status !== "rejected")) {
      setError("You already have an ownership claim for this facility."); return;
    }
    const text = notes.trim();
    if (text.length < 15) { setError("Please describe your relationship to the facility in at least 15 characters."); return; }
    setSubmitting(true);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user || authData.user.id !== user.id) {
      setError("Your session expired. Please sign in again."); setSubmitting(false); return;
    }
    const result = await supabase.from("owner_claims").insert({
      facility_id: selected.id,
      claimant_user_id: authData.user.id,
      verification_status: "pending",
      evidence_notes: text.slice(0, 1500),
      reviewed_at: null,
    });
    if (result.error) setError("Claim could not be submitted. Please contact support if this continues.");
    else {
      setNotice("Your ownership claim was submitted for review. Submission does not verify ownership or grant editing access.");
      setSelected(null); setNotes(""); setResults([]); setSearch("");
      await loadClaims(authData.user.id);
    }
    setSubmitting(false);
  }

  async function signOut() { await supabase.auth.signOut(); router.replace("/owner"); }

  return <main style={{ minHeight: "100vh", fontFamily: "Arial,sans-serif", background: "#f4f8fb", color: "#123c59", padding: "30px 5%" }}>
    <div style={{ maxWidth: 1000, margin: "auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 15, flexWrap: "wrap" }}>
        <Link href="/washington" style={{ color: "#176b53" }}>← Washington directory</Link>
        <button type="button" onClick={signOut} style={{ padding: "10px 16px", border: "1px solid #176b53", borderRadius: 8, color: "#176b53", background: "white", cursor: "pointer" }}>Sign out</button>
      </header>
      <h1 style={{ fontSize: 35, marginTop: 34 }}>Owner dashboard</h1>
      {loading ? <p role="status">Checking account…</p> : <>
        <p>Signed in as <strong>{user?.email}</strong></p>
        <section style={card}>
          <h2>My ownership claims</h2>
          <p>All claims require independent administrative review. Your account alone does not grant access to manage a care home.</p>
          {claims.length === 0 && <p>No ownership claims submitted yet.</p>}
          {claims.map(c => <div key={c.id} style={{ padding: "14px 0", borderTop: "1px solid #dbe5eb" }}><div><strong>Facility ID:</strong> {c.facility_id}</div><div><strong>Status:</strong> {c.verification_status}</div></div>)}
        </section>
        <section style={card}>
          <h2>Claim your facility</h2>
          <p>Search for the licensed facility, then provide a brief explanation of your authority to represent it. Do not include SSNs, passwords, bank details, or other sensitive personal information.</p>
          <form onSubmit={findFacility}>
            <label htmlFor="facility-search">Facility name, license number, or city</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 9 }}>
              <div style={{ flex: "1 1 230px" }}><input id="facility-search" style={field} value={search} onChange={e => setSearch(e.target.value)} maxLength={70} required /></div>
              <button type="submit" disabled={searching} style={{ background: "#176b53", color: "white", padding: "11px 20px", border: 0, borderRadius: 9, cursor: "pointer" }}>{searching ? "Searching…" : "Find facility"}</button>
            </div>
          </form>
          {searchError && <p role="alert" style={{ color: "#9f2626" }}>{searchError}</p>}
          {results.length > 0 && <div style={{ marginTop: 18 }}><h3>Select the correct facility</h3>{results.map(f => <button key={f.id} type="button" onClick={() => { setSelected(f); setNotes(""); setNotice(""); }} style={{ width: "100%", textAlign: "left", background: selected?.id === f.id ? "#e6f4ee" : "white", border: "1px solid #cbd8df", padding: 13, marginBottom: 8, borderRadius: 9, cursor: "pointer", color: "#123c59" }}><strong>{f.canonical_name}</strong><div>{[f.address_line1, f.city, f.county].filter(Boolean).join(", ")}</div><small>License: {f.license_number ?? "Not listed"}</small></button>)}</div>}
          {selected && <form onSubmit={submitClaim} style={{ marginTop: 22 }}>
            <h3>Request ownership verification</h3>
            <p><strong>Selected facility:</strong> {selected.canonical_name}</p>
            <label htmlFor="claim-notes">Your relationship to this facility (15–1,500 characters)</label>
            <textarea id="claim-notes" required minLength={15} maxLength={1500} value={notes} onChange={e => setNotes(e.target.value)} rows={4} style={{ ...field, display: "block", marginTop: 9 }} placeholder="Example: I am the facility's licensed provider or authorized business representative." />
            <p style={{ fontSize: 13, lineHeight: 1.5 }}>The claim will remain pending until reviewed. Never submit sensitive identification documents in this text box.</p>
            <button disabled={submitting} type="submit" style={{ background: "#176b53", color: "white", padding: "13px 20px", border: 0, borderRadius: 9, cursor: "pointer" }}>{submitting ? "Submitting…" : "Submit ownership claim"}</button>
          </form>}
          {notice && <p role="status" style={{ color: "#176b53", fontWeight: 600 }}>{notice}</p>}
          {error && <p role="alert" style={{ color: "#a32222" }}>{error}</p>}
        </section>
      </>}
    </div>
  </main>;
}
