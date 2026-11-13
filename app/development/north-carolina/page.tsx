import Link from "next/link";
import {
  NORTH_CAROLINA_ADULT_CARE_HOMES,
  NORTH_CAROLINA_ADULT_COUNTIES,
  NORTH_CAROLINA_BLANK_ROWS,
  NORTH_CAROLINA_EXPIRY_BEFORE_OBSERVATION,
  NORTH_CAROLINA_FAMILY_CARE_HOMES,
  NORTH_CAROLINA_FAMILY_COUNTIES,
  NORTH_CAROLINA_LISTINGS_PAGE_UPDATED,
  NORTH_CAROLINA_PUBLICATION_ELIGIBLE_ROWS,
  NORTH_CAROLINA_STAR_NOT_AVAILABLE,
  NORTH_CAROLINA_UNIQUE_LICENSES,
  NORTH_CAROLINA_WORKBOOK_AS_OF,
  northCarolinaDirectoryReady,
} from "../../../lib/north-carolina-onboarding";

const C = { navy: "#123c59", teal: "#176b53", pale: "#f4f8fb", muted: "#536b7c", border: "#dbe5eb" };

export default function NorthCarolinaDevelopmentPage() {
  const publication = northCarolinaDirectoryReady() ? "North Carolina is published." : "North Carolina is unpublished.";
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
          <p style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>UNPUBLISHED DEVELOPMENT REVIEW</p>
          <h1 style={{ fontSize: "clamp(30px, 5vw, 46px)", lineHeight: 1.14, margin: "12px 0" }}>North Carolina licensing categories</h1>
          <p style={{ maxWidth: 780, lineHeight: 1.7, fontSize: 16, opacity: 0.95 }}>
            {NORTH_CAROLINA_UNIQUE_LICENSES.toLocaleString()} records have a license number and a North Carolina site address. A structurally complete record is not an active home and is not an available placement.
          </p>
        </div>
      </section>
      <div style={{ maxWidth: 1100, margin: "auto", padding: "28px 5% 60px", display: "grid", gap: 18 }}>
        <p>{publication} This page does not list facilities or profile links.</p>
        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Adult care homes and family care homes</h2>
          <p style={{ color: C.muted }}>The official workbooks keep the original license prefix, name, county, site address, and bed count.</p>
          <ul>
            <li>Adult care homes: {NORTH_CAROLINA_ADULT_CARE_HOMES.toLocaleString()} across {NORTH_CAROLINA_ADULT_COUNTIES.toLocaleString()} counties</li>
            <li>Family care homes: {NORTH_CAROLINA_FAMILY_CARE_HOMES.toLocaleString()} across {NORTH_CAROLINA_FAMILY_COUNTIES.toLocaleString()} counties</li>
            <li>Rows without a license, name, or site address: {NORTH_CAROLINA_BLANK_ROWS.toLocaleString()}</li>
          </ul>
        </section>
        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Status, disclosure, and freshness</h2>
          <p>The workbooks have no licensing-status column. Star text, including {NORTH_CAROLINA_STAR_NOT_AVAILABLE.toLocaleString()} not-available values, is not a current license status. {NORTH_CAROLINA_EXPIRY_BEFORE_OBSERVATION.toLocaleString()} expiry dates fall before this review and stay in the original column.</p>
          <p>The listings page says updated {NORTH_CAROLINA_LISTINGS_PAGE_UPDATED}. Each workbook says as of {NORTH_CAROLINA_WORKBOOK_AS_OF}. Neither text is an export date. No coordinate column is present. The star-rating result identifier is not the license number, so no facility link is recorded.</p>
          <p>Publication-eligible records: {NORTH_CAROLINA_PUBLICATION_ELIGIBLE_ROWS}.</p>
        </section>
      </div>
    </main>
  );
}
