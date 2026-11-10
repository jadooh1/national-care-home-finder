import Link from "next/link";
import {
  PENNSYLVANIA_CATALOG_ROWS_UPDATED_AT,
  PENNSYLVANIA_OFFICIAL_VALIDATION,
  PENNSYLVANIA_PROGRAM_OFFICE,
  PENNSYLVANIA_TYPE,
  pennsylvaniaDirectoryReady,
  pennsylvaniaMapReady,
} from "../../../lib/pennsylvania-licensing";

const C = { navy: "#123c59", teal: "#176b53", pale: "#f4f8fb", muted: "#536b7c", border: "#dbe5eb" };
const OBSERVED = PENNSYLVANIA_OFFICIAL_VALIDATION;

export default function PennsylvaniaLicensingValidationPage() {
  const publication = pennsylvaniaDirectoryReady() ? "Pennsylvania is published." : "Pennsylvania is unpublished.";
  const map = pennsylvaniaMapReady() ? "A map is published." : "No map is published.";
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
          <h1 style={{ fontSize: "clamp(30px, 5vw, 46px)", lineHeight: 1.14, margin: "12px 0" }}>Pennsylvania licensing validation</h1>
          <p style={{ maxWidth: 780, lineHeight: 1.7, fontSize: 16, opacity: 0.95 }}>
            {OBSERVED.rows.toLocaleString()} official rows were checked. A checked row is not an active home and is not an available placement.
          </p>
        </div>
      </section>
      <div style={{ maxWidth: 1100, margin: "auto", padding: "28px 5% 60px", display: "grid", gap: 18 }}>
        <p>{publication} {map} This page does not list facilities.</p>
        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Category, identity, and status</h2>
          <p>Every row uses type {PENNSYLVANIA_TYPE} and program office {PENNSYLVANIA_PROGRAM_OFFICE}. The file has no license-number column and no per-row status column. Its object identifier is unique on all {OBSERVED.objectIdsUnique.toLocaleString()} rows and is not treated as a license number.</p>
          <p>{OBSERVED.nameDuplicateGroups} names occur on more than one row, covering {OBSERVED.rowsSharingAName} rows. {OBSERVED.sharedStreetCityZipGroups} street, city, and ZIP combinations occur on more than one row. Those rows keep their original object identifiers. The dataset title is not a licensing-status definition.</p>
        </section>
        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Addresses</h2>
          <p>Usable street text, with both a letter and a digit in the street column: {OBSERVED.usableStreetRows.toLocaleString()}. Unresolved letter-only street values: {OBSERVED.letterOnlyStreetRows}. Six of those have text in Street Additional Information, and seven name a street without a number. Neither group is rewritten, and the additional-information column is not copied into the street column.</p>
          <p>All {OBSERVED.fiveDigitZips.toLocaleString()} ZIP values have five digits. All rows are state PA. Observed capacity runs from {OBSERVED.capacityMinimum} to {OBSERVED.capacityMaximum}. A capacity in that range is not an availability claim.</p>
        </section>
        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Coordinates, disclosure, and freshness</h2>
          <p>All {OBSERVED.georeferencedRows.toLocaleString()} rows have georeferenced latitude and longitude. The official accuracy field describes those points as interpolated, a street centroid, a ZIP centroid, or an intersection. Verified licensing coordinates: {OBSERVED.licensingCoordinateRows}. {map}</p>
          <p>The provider directory can search personal care homes and shows inspection history for a facility license number. That license number is not a column in this file, so no disclosure prefix is verified. The directory's daily-refresh notice is not an export date.</p>
          <p>The portal catalog timestamp {PENNSYLVANIA_CATALOG_ROWS_UPDATED_AT} is not an export date. Publication-eligible records: {OBSERVED.publicationEligibleRows}.</p>
        </section>
      </div>
    </main>
  );
}
