import Link from "next/link";
import {
  MICHIGAN_ADDRESS_COUNTS,
  MICHIGAN_ADDRESS_FIELD_KEY,
  MICHIGAN_ADDRESS_INTERPRETATION,
  MICHIGAN_DESCRIBED_TYPES,
  MICHIGAN_FILE_SERVER_CLOCK,
  MICHIGAN_OFFICIAL_VALIDATION,
  MICHIGAN_STREET_TEXT_BY_TYPE,
  MICHIGAN_UNDESCRIBED_TYPE,
  michiganDirectoryReady,
} from "../../../lib/michigan-licensing";

const C = { navy: "#123c59", teal: "#176b53", pale: "#f4f8fb", muted: "#536b7c", border: "#dbe5eb" };
const OBSERVED = MICHIGAN_OFFICIAL_VALIDATION;

export default function MichiganLicensingValidationPage() {
  const publication = michiganDirectoryReady() ? "Michigan is published." : "Michigan is unpublished.";
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
          <h1 style={{ fontSize: "clamp(30px, 5vw, 46px)", lineHeight: 1.14, margin: "12px 0" }}>Michigan licensing validation</h1>
          <p style={{ maxWidth: 780, lineHeight: 1.7, fontSize: 16, opacity: 0.95 }}>
            {OBSERVED.rows.toLocaleString()} official rows were checked. A checked row is not an active home and is not an available placement.
          </p>
        </div>
      </section>
      <div style={{ maxWidth: 1100, margin: "auto", padding: "28px 5% 60px", display: "grid", gap: 18 }}>
        <p>{publication} This page does not list facilities.</p>
        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Officially described types</h2>
          <p style={{ color: C.muted }}>{OBSERVED.describedRows.toLocaleString()} rows use a type code from the official record key.</p>
          <ul>
            {MICHIGAN_DESCRIBED_TYPES.map(type => (
              <li key={type.code}>{type.code}: {type.label} — {OBSERVED.types[type.code].toLocaleString()}</li>
            ))}
          </ul>
          <p>{MICHIGAN_UNDESCRIBED_TYPE} remains undescribed. {OBSERVED.undescribedRows.toLocaleString()} rows keep that original type code, status EXEMPT, and a blank license date. No category name is assigned.</p>
        </section>
        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Status, identity, and profile paths</h2>
          <p>Observed status text is not an availability claim.</p>
          <ul>
            {Object.entries(OBSERVED.statuses).map(([status, count]) => (
              <li key={status}>{status}: {count.toLocaleString()}</li>
            ))}
          </ul>
          <p>Every license identifier is unique, and every identifier matches its type code. A profile path was requested for one license of each observed type code. All {OBSERVED.profilePathsReturned200} requests returned HTTP 200. The other profile paths were not requested.</p>
        </section>
        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Address, ZIP, and freshness</h2>
          <p>The official record key names {MICHIGAN_ADDRESS_FIELD_KEY.supplemental} and {MICHIGAN_ADDRESS_FIELD_KEY.street} as separate columns. It does not define the supplemental column as a physical address, a mailing address, or a unit line. The interpretation remains {MICHIGAN_ADDRESS_INTERPRETATION}. The supplemental column is not copied into the street column.</p>
          <p>Usable text in the official street column: {MICHIGAN_ADDRESS_COUNTS.usablePhysicalStreetRows.toLocaleString()} rows ({MICHIGAN_STREET_TEXT_BY_TYPE.AF} AF, {MICHIGAN_STREET_TEXT_BY_TYPE.AS} AS, {MICHIGAN_STREET_TEXT_BY_TYPE.AM} AM, {MICHIGAN_STREET_TEXT_BY_TYPE.AL} AL, {MICHIGAN_STREET_TEXT_BY_TYPE.AH} AH, and {MICHIGAN_STREET_TEXT_BY_TYPE.XH} {MICHIGAN_UNDESCRIBED_TYPE}). Unresolved blank street rows: {MICHIGAN_ADDRESS_COUNTS.unresolvedBlankStreetRows.toLocaleString()}. Publication-eligible records: {MICHIGAN_ADDRESS_COUNTS.publicationEligibleRows}. The {MICHIGAN_ADDRESS_COUNTS.undescribedStreetTextRows} {MICHIGAN_UNDESCRIBED_TYPE} rows with street text stay undescribed.</p>
          <p>Where both columns have text, the public profile showed the street column first {MICHIGAN_ADDRESS_COUNTS.profileShowsStreetBeforeSupplemental} times and the supplemental column first {MICHIGAN_ADDRESS_COUNTS.profileShowsSupplementalBeforeStreet} time. That display does not rewrite either column. {MICHIGAN_ADDRESS_COUNTS.supplementalEqualsLicenseeAddress.toLocaleString()} supplemental values equal the separate {MICHIGAN_ADDRESS_FIELD_KEY.licensee} column. That overlap is not a mailing-address definition.</p>
          <p>{OBSERVED.fiveDigitZips.toLocaleString()} ZIP values have five digits and {OBSERVED.nineDigitZips.toLocaleString()} have nine digits. A normalized five-digit form can be derived from a nine-digit value. The original value is not modified.</p>
          <p>{OBSERVED.eightDigitDatePairs.toLocaleString()} license-date pairs are eight digits, across {OBSERVED.distinctEightDigitEffectiveDates.toLocaleString()} distinct effective values. {OBSERVED.blankDatePairs.toLocaleString()} pairs are blank. No slash date or ISO date was present. The file server clock {MICHIGAN_FILE_SERVER_CLOCK} is not an export date. No coordinate is recorded.</p>
        </section>
      </div>
    </main>
  );
}
