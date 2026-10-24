"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

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

const C = { navy: "#123c59", teal: "#176b53", pale: "#f4f8fb", muted: "#536b7c", border: "#dbe5eb" };
const DSHS_URL = "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHAdvLookup.aspx";
const card: React.CSSProperties = { background: "white", border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: "0 5px 16px rgba(18,60,89,.045)" };
const linkStyle: React.CSSProperties = { color: C.teal, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 };

function displayName(name: string) { return name.replace(/^\s*!+\s*/, "").trim() || name; }

export default function WashingtonFacilityProfile() {
  const params = useParams();
  const license = typeof params.license === "string" ? params.license : "";
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setFacility(null);
    setNotFound(false);
    if (!/^\d{1,20}$/.test(license)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    async function load() {
      const { data, error: queryError } = await supabase
        .from("wa_dshs_listed_facilities")
        .select("id,canonical_name,address_line1,city,county,state_code,postal_code,license_number,licensed_capacity,record_status")
        .eq("license_number", license)
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (queryError) setError("Unable to load this facility right now. Please try again later.");
      else if (!data) setNotFound(true);
      else setFacility(data as Facility);
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [license]);

  const address = facility ? [facility.address_line1, facility.city, facility.state_code, facility.postal_code].filter(Boolean).join(", ") : "";
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <main style={{ minHeight: "100vh", background: C.pale, color: C.navy, fontFamily: "Arial, sans-serif" }}>
      <header style={{ background: "white", borderBottom: `1px solid ${C.border}`, padding: "17px 5%" }}>
        <nav aria-label="Main navigation" style={{ maxWidth: 1100, margin: "auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ color: C.navy, textDecoration: "none", fontSize: 19, fontWeight: 800 }}>National Care Home Finder</Link>
          <Link href="/washington" style={linkStyle}>← Washington directory</Link>
        </nav>
      </header>
      <section style={{ background: `linear-gradient(125deg, ${C.navy}, ${C.teal})`, padding: "45px 5%", color: "white" }}>
        <div style={{ maxWidth: 1100, margin: "auto" }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>WASHINGTON · ADULT FAMILY HOME</p>
          <h1 style={{ fontSize: "clamp(29px, 5vw, 44px)", lineHeight: 1.15, margin: "12px 0" }}>
            {facility ? displayName(facility.canonical_name) : loading ? "Loading facility profile…" : "Facility profile"}
          </h1>
          <p style={{ opacity: 0.95, lineHeight: 1.6, maxWidth: 740 }}>Directory information is provided for research, not as an endorsement or confirmation of current licensing, vacancies, pricing, or services.</p>
        </div>
      </section>
      <div style={{ maxWidth: 1100, margin: "auto", padding: "28px 5% 64px" }}>
        <Link href="/washington" style={linkStyle}>← Back to Washington listings</Link>
        <div aria-live="polite" style={{ marginTop: 21 }}>
          {loading && <section style={card}><p>Loading facility information…</p></section>}
          {!loading && error && <section style={card}><p role="alert" style={{ color: "#a62a2a" }}>{error}</p><button onClick={() => window.location.reload()} style={{ padding: "10px 14px", cursor: "pointer" }}>Retry</button></section>}
          {!loading && notFound && <section style={card}><h2>Facility not found</h2><p>This license number does not match a listing in the current Washington directory.</p><Link href="/washington" style={linkStyle}>Search the directory</Link></section>}
        </div>
        {!loading && facility && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 310px), 1fr))", gap: 22, marginTop: 22, alignItems: "start" }}>
            <section style={card} aria-labelledby="details-heading">
              <h2 id="details-heading" style={{ margin: "0 0 16px", fontSize: 23 }}>Facility information</h2>
              <dl style={{ margin: 0, lineHeight: 1.7 }}>
                <dt style={{ fontWeight: 700, marginTop: 12 }}>Facility name</dt><dd style={{ margin: "0 0 7px" }}>{displayName(facility.canonical_name)}</dd>
                <dt style={{ fontWeight: 700, marginTop: 12 }}>Address</dt><dd style={{ margin: "0 0 7px" }}>{address || "Not available"}</dd>
                <dt style={{ fontWeight: 700, marginTop: 12 }}>County</dt><dd style={{ margin: "0 0 7px" }}>{facility.county ? `${facility.county} County` : "Not available"}</dd>
                <dt style={{ fontWeight: 700, marginTop: 12 }}>License number</dt><dd style={{ margin: "0 0 7px" }}>{facility.license_number ?? "Not available"}</dd>
                <dt style={{ fontWeight: 700, marginTop: 12 }}>Recorded licensed capacity</dt><dd style={{ margin: "0 0 7px" }}>{facility.licensed_capacity ?? "Not available"}{facility.licensed_capacity !== null ? " residents" : ""}</dd>
              </dl>
              {address && <p style={{ marginTop: 20 }}><a href={mapUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>View location in Google Maps ↗</a></p>}
            </section>
            <div style={{ display: "grid", gap: 22 }}>
              <section style={card} aria-labelledby="verify-heading">
                <h2 id="verify-heading" style={{ margin: "0 0 10px", fontSize: 23 }}>Verify before choosing care</h2>
                <p style={{ color: C.muted, lineHeight: 1.7, marginTop: 0 }}>This facility was matched by license number against a Washington DSHS locator download. That match does <strong>not</strong> independently establish its current license standing or quality of care.</p>
                <a href={DSHS_URL} target="_blank" rel="noopener noreferrer" style={linkStyle}>Check the official Washington DSHS locator ↗</a>
              </section>
              <section style={card} aria-labelledby="questions-heading">
                <h2 id="questions-heading" style={{ margin: "0 0 10px", fontSize: 23 }}>Questions to ask the home</h2>
                <ul style={{ lineHeight: 1.85, color: C.muted, paddingLeft: 22, marginBottom: 0 }}>
                  <li>Are you currently accepting residents?</li>
                  <li>What are your monthly rates and additional fees?</li>
                  <li>Which care needs can your staff support?</li>
                  <li>May I schedule a tour and review inspection history?</li>
                </ul>
              </section>
            </div>
          </div>
        )}
        <footer style={{ borderTop: `1px solid ${C.border}`, marginTop: 42, paddingTop: 19, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>Independent informational directory based on a DSHS locator download from October 23, 2026. Contact details, services, prices, vacancies, and current license standing have not been independently verified. Listings are not recommendations. Facility owners cannot edit this profile yet.</footer>
      </div>
    </main>
  );
}
