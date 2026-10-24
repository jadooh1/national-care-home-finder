"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Facility = {
  id: string;
  canonical_name: string;
  address_line1: string | null;
  city: string | null;
  county: string | null;
  state_code: string;
  postal_code: string | null;
  license_number: string | null;
  licensed_capacity: number | null;
  record_status: string;
};

const PAGE_SIZE = 20;
const DSHS_URL = "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHAdvLookup.aspx";

export default function WashingtonPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      // Permit ordinary name, location and license searches without injecting
      // punctuation into PostgREST's filter-expression grammar.
      const term = search.replace(/[^a-zA-Z0-9\s-]/g, "").trim().slice(0, 80);
      let request = supabase
        .from("wa_dshs_listed_facilities")
        .select(
          "id,canonical_name,address_line1,city,county,state_code,postal_code,license_number,licensed_capacity,record_status",
          { count: "exact" }
        )
        .order("canonical_name", { ascending: true })
        .order("id", { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (term) {
        request = request.or(
          [
            `canonical_name.ilike.%${term}%`,
            `city.ilike.%${term}%`,
            `county.ilike.%${term}%`,
            `postal_code.ilike.%${term}%`,
            `license_number.ilike.%${term}%`,
          ].join(",")
        );
      }

      const { data, count, error: queryError } = await request;
      if (cancelled) return;
      if (queryError) {
        setFacilities([]);
        setTotal(0);
        setError("Listings are temporarily unavailable. Please try again later.");
      } else {
        setFacilities((data ?? []) as Facility[]);
        setTotal(count ?? 0);
      }
      setLoading(false);
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, page]);

  const start = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, total);
  const searchStyle = {
    width: "100%",
    padding: 13,
    border: "1px solid #bccad5",
    borderRadius: 9,
    fontSize: 16,
  };

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 20px", color: "#17324d" }}>
      <Link href="/">← Back to Home</Link>
      <h1 style={{ marginBottom: 12 }}>Washington Adult Family Homes</h1>
      <p style={{ lineHeight: 1.7, maxWidth: 780 }}>
        Browse Washington Adult Family Homes appearing in the DSHS locator download.
        Inclusion indicates a matching license number in that source; it does not
        independently confirm current license standing, openings, pricing or care suitability.
        Always <a href={DSHS_URL} target="_blank" rel="noopener noreferrer">check the official DSHS locator</a> before making care decisions.
      </p>

      <label htmlFor="facility-search" style={{ display: "block", fontWeight: 700, margin: "24px 0 8px" }}>
        Search Washington Adult Family Homes
      </label>
      <input
        id="facility-search"
        type="search"
        placeholder="Name, city, county, ZIP or license number"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(0);
        }}
        style={searchStyle}
      />
      <p aria-live="polite" style={{ color: "#536b7c" }}>
        {loading ? "Loading listings…" : error ? "Unable to display listings" :
          total === 0 ? "No matching DSHS-listed facilities found." :
          `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()} listings`}
      </p>
      {error && <p role="alert" style={{ color: "#a62a2a" }}>{error}</p>}

      {!error && facilities.map((facility) => (
        <article
          key={facility.id}
          style={{ border: "1px solid #dce4eb", borderRadius: 12, padding: 20, marginBottom: 14, background: "#fff" }}
        >
          <h2 style={{ fontSize: 21, margin: "0 0 10px" }}>{facility.canonical_name}</h2>
          <p style={{ margin: "8px 0" }}>
            {[facility.address_line1, facility.city, facility.state_code, facility.postal_code].filter(Boolean).join(", ")}
          </p>
          {facility.county && <p style={{ margin: "8px 0" }}>County: {facility.county}</p>}
          <p style={{ margin: "8px 0" }}>License #: {facility.license_number ?? "Not available"}</p>
          {facility.licensed_capacity !== null && (
            <p style={{ margin: "8px 0" }}>Licensed capacity recorded: {facility.licensed_capacity}</p>
          )}
          <p style={{ margin: "10px 0", fontWeight: 600 }}>
            {facility.record_status === "verified" ? "Independently verified listing" : "DSHS locator match — not independently verified"}
          </p>
          <a href={DSHS_URL} target="_blank" rel="noopener noreferrer">Verify details with Washington DSHS ↗</a>
        </article>
      ))}

      {!loading && !error && total > PAGE_SIZE && (
        <nav aria-label="Listing pagination" style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 25 }}>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            style={{ padding: "10px 15px", borderRadius: 8 }}>Previous</button>
          <span>Page {page + 1} of {Math.ceil(total / PAGE_SIZE)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={end >= total}
            style={{ padding: "10px 15px", borderRadius: 8 }}>Next</button>
        </nav>
      )}
      <p style={{ marginTop: 36, fontSize: 14, color: "#536b7c", lineHeight: 1.6 }}>
        Independent informational directory. DSHS source list downloaded October 23, 2026.
        Licensing conditions and availability may change; listings are not recommendations.
      </p>
    </main>
  );
}
