"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Facility = {
  id: string; canonical_name: string; address_line1: string | null;
  city: string | null; county: string | null; state_code: string;
  postal_code: string | null; license_number: string | null;
  licensed_capacity: number | null; record_status: string;
};

const PAGE_SIZE = 20;
const DSHS_URL = "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHAdvLookup.aspx";
const C = { navy: "#123c59", teal: "#176b53", pale: "#f4f8fb", muted: "#536b7c", border: "#dbe5eb" };
const fieldStyle: React.CSSProperties = {
  boxSizing: "border-box", width: "100%", minWidth: 0, padding: "13px 14px",
  border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 16,
  background: "#fff", color: C.navy,
};

function cleanSearch(input: string) {
  return input.replace(/[^a-zA-Z0-9\s-]/g, "").trim().slice(0, 80);
}
function displayName(name: string) { return name.replace(/^\s*!+\s*/, "").trim() || name; }

export default function WashingtonPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [county, setCounty] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true); setError("");
      const term = cleanSearch(search);
      const cityTerm = cleanSearch(city);
      const countyTerm = cleanSearch(county);
      let query = supabase.from("wa_dshs_listed_facilities")
        .select("id,canonical_name,address_line1,city,county,state_code,postal_code,license_number,licensed_capacity,record_status", { count: "exact" })
        .order("canonical_name", { ascending: true }).order("id", { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (term) query = query.or([
        `canonical_name.ilike.%${term}%`, `city.ilike.%${term}%`,
        `county.ilike.%${term}%`, `postal_code.ilike.%${term}%`,
        `license_number.ilike.%${term}%`,
      ].join(","));
      if (cityTerm) query = query.ilike("city", `%${cityTerm}%`);
      if (countyTerm) query = query.ilike("county", `%${countyTerm}%`);
      const { data, count, error: queryError } = await query;
      if (cancelled) return;
      if (queryError) {
        setFacilities([]); setTotal(0);
        setError("Unable to load listings. Please try again later.");
      } else { setFacilities((data ?? []) as Facility[]); setTotal(count ?? 0); }
      setLoading(false);
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search, city, county, page]);

  const start = total ? page * PAGE_SIZE + 1 : 0;
  const end = Math.min((page + 1) * PAGE_SIZE, total);
  function resetFilters() { setSearch(""); setCity(""); setCounty(""); setPage(0); }

  return (
    <main style={{ minHeight: "100vh", background: C.pale, color: C.navy, fontFamily: "Arial, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "16px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 19 }}>National Care Home Finder</strong>
          <Link href="/" style={{ color: C.teal, fontWeight: 600 }}>← All states</Link>
        </div>
      </header>
      <section style={{ background: `linear-gradient(125deg, ${C.navy}, ${C.teal})`, color: "white", padding: "48px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto" }}>
          <p style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>WASHINGTON DIRECTORY</p>
          <h1 style={{ fontSize: "clamp(30px, 5vw, 46px)", lineHeight: 1.14, margin: "12px 0" }}>Explore Adult Family Homes</h1>
          <p style={{ maxWidth: 780, lineHeight: 1.7, fontSize: 16, opacity: 0.95 }}>
            Browse facilities appearing in a Washington DSHS locator download. A license-number match is not independent verification of current standing, vacancies, cost, or suitability.
          </p>
        </div>
      </section>
      <div style={{ maxWidth: 1100, margin: "auto", padding: "28px 5% 60px" }}>
        
<section
  aria-label="Market intelligence tools"
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
    gap: 16,
    marginBottom: 24,
  }}
>
  <Link href="/washington/map" style={{
    display: "block", background: "#123c59", color: "white",
    padding: 24, borderRadius: 14, textDecoration: "none"
  }}>
    <h2 style={{ margin: "0 0 10px" }}>Explore AFH Market Map →</h2>
    <p style={{ margin: 0, lineHeight: 1.6 }}>
      View care home locations, recorded licensed beds,
      and neighborhood concentration.
    </p>
  </Link>
  <Link href="/washington/demographics" style={{
    display: "block", background: "#176b53", color: "white",
    padding: 24, borderRadius: 14, textDecoration: "none"
  }}>
    <h2 style={{ margin: "0 0 10px" }}>Aging Population Dashboard →</h2>
    <p style={{ margin: 0, lineHeight: 1.6 }}>
      Compare older-adult population estimates with AFH
      counts and licensed capacity by ZIP code.
    </p>
  </Link>

<Link
  href="/washington/counties"
  style={{
    display: "block",
    background: "#176b53",
    color: "white",
    padding: 24,
    borderRadius: 14,
    textDecoration: "none"
  }}
>
  <h2 style={{ margin: "0 0 10px" }}>
    Compare Counties →
  </h2>
  <p style={{ margin: 0, lineHeight: 1.6 }}>
    Compare Adult Family Home counts,
    recorded licensed beds, and cities
    across Washington counties.
  </p>
</Link>

</section>

        <section aria-label="Search and filter facilities" style={{ background: "white", padding: 22, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: "0 6px 20px rgba(18,60,89,.05)" }}>
          <h2 style={{ fontSize: 21, margin: "0 0 18px" }}>Find care homes</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))", gap: 15 }}>
            <div><label htmlFor="name-filter" style={{ display: "block", fontWeight: 700, marginBottom: 7 }}>Name, ZIP, or license</label>
              <input id="name-filter" type="search" value={search} placeholder="e.g. 759392" style={fieldStyle} onChange={e => { setSearch(e.target.value); setPage(0); }} /></div>
            <div><label htmlFor="city-filter" style={{ display: "block", fontWeight: 700, marginBottom: 7 }}>City</label>
              <input id="city-filter" type="search" value={city} placeholder="e.g. Puyallup" style={fieldStyle} onChange={e => { setCity(e.target.value); setPage(0); }} /></div>
            <div><label htmlFor="county-filter" style={{ display: "block", fontWeight: 700, marginBottom: 7 }}>County</label>
              <input id="county-filter" type="search" value={county} placeholder="e.g. Pierce" style={fieldStyle} onChange={e => { setCounty(e.target.value); setPage(0); }} /></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between", gap: 12, marginTop: 18 }}>
            <button onClick={resetFilters} style={{ background: "white", color: C.teal, border: `1px solid ${C.teal}`, borderRadius: 9, padding: "10px 15px", fontWeight: 700, cursor: "pointer" }}>Clear filters</button>
            <a href={DSHS_URL} target="_blank" rel="noopener noreferrer" style={{ color: C.teal, fontWeight: 700 }}>Official Washington DSHS locator ↗</a>
          </div>
        </section>
        <div aria-live="polite" style={{ margin: "23px 0 15px", color: C.muted, fontWeight: 600 }}>
          {loading ? "Loading listings…" : error ? "Unable to display listings" : total === 0 ? "No matches found" : `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()} listings`}
        </div>
        {error && <p role="alert" style={{ color: "#a62a2a" }}>{error}</p>}
        {!loading && !error && total === 0 && <p>Try another city, county, name, ZIP code, or license number.</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 440px), 1fr))", gap: 17 }}>
          {!error && facilities.map(facility => {
            const address = [facility.address_line1, facility.city, facility.state_code, facility.postal_code].filter(Boolean).join(", ");
            const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
            return (
              <article key={facility.id} style={{ border: `1px solid ${C.border}`, borderRadius: 14, background: "#fff", padding: 22, boxShadow: "0 3px 12px rgba(18,60,89,.035)" }}>
                <h2 style={{ margin: "0 0 12px", fontSize: 22, lineHeight: 1.3 }}>{displayName(facility.canonical_name)}</h2>
                {address && <p style={{ margin: "8px 0", lineHeight: 1.5 }}>{address}</p>}
                {facility.county && <p style={{ margin: "8px 0", color: C.muted }}>{facility.county} County</p>}
                <p style={{ margin: "8px 0" }}><strong>License:</strong> {facility.license_number ?? "Not available"}</p>
                {facility.licensed_capacity !== null && <p style={{ margin: "8px 0" }}><strong>Recorded capacity:</strong> {facility.licensed_capacity}</p>}
                <p style={{ borderTop: `1px solid ${C.border}`, paddingTop: 13, marginTop: 15, color: C.muted, fontSize: 14, lineHeight: 1.5 }}>
                  {facility.record_status === "verified" ? "Independently verified listing" : "DSHS license-number match — not independently verified"}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 13, alignItems: "center" }}>
                  {facility.license_number && <Link href={`/washington/${encodeURIComponent(facility.license_number)}`} style={{ color: "white", background: C.teal, borderRadius: 8, padding: "10px 13px", textDecoration: "none", fontWeight: 700 }}>View details →</Link>}
                  {address && <a href={mapLink} target="_blank" rel="noopener noreferrer" style={{ color: C.teal, fontWeight: 700 }}>View map ↗</a>}
                  <a href={DSHS_URL} target="_blank" rel="noopener noreferrer" style={{ color: C.teal, fontWeight: 700 }}>Check DSHS ↗</a>
                </div>
              </article>
            );
          })}
        </div>
        {!loading && !error && total > PAGE_SIZE && (
          <nav aria-label="Listing pages" style={{ display: "flex", justifyContent: "center", gap: 18, alignItems: "center", flexWrap: "wrap", marginTop: 29 }}>
            <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} style={{ padding: "11px 17px", borderRadius: 9, border: `1px solid ${C.border}`, background: "white", cursor: "pointer" }}>← Previous</button>
            <strong>Page {page + 1} of {Math.ceil(total / PAGE_SIZE)}</strong>
            <button disabled={end >= total} onClick={() => setPage(p => p + 1)} style={{ padding: "11px 17px", borderRadius: 9, border: `1px solid ${C.border}`, background: "white", cursor: "pointer" }}>Next →</button>
          </nav>
        )}
        <footer style={{ marginTop: 45, paddingTop: 20, borderTop: `1px solid ${C.border}`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
          Independent informational directory using a DSHS locator list downloaded October 23, 2026. Information may be outdated; confirm current licensing and services directly with Washington DSHS. Listings are not recommendations.
        </footer>
      </div>
    </main>
  );
}
