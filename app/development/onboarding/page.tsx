import Link from "next/link";
import {
  MICHIGAN_BLANK_DATES,
  MICHIGAN_EIGHT_DIGIT_DATES,
  MICHIGAN_FILE_ROWS,
  MICHIGAN_FILE_SERVER_CLOCK,
  MICHIGAN_FIVE_DIGIT_ZIPS,
  MICHIGAN_NINE_DIGIT_ZIPS,
  MICHIGAN_OBSERVED_STATUSES,
  MICHIGAN_OBSERVED_TYPES,
  MICHIGAN_OFFICIAL_SOURCE_BLOCKERS,
  MICHIGAN_POSITIONAL_FIELDS,
  NEXT_STATE_REVIEW,
  PENNSYLVANIA_CATALOG_ROWS_UPDATED_AT,
  PENNSYLVANIA_LETTER_ONLY_STREET_ROWS,
  PENNSYLVANIA_PUBLICATION_ELIGIBLE_ROWS,
  PENNSYLVANIA_ROWS,
  PENNSYLVANIA_USABLE_STREET_ROWS,
  michiganDescribedRows,
  onboardingProfiles,
  publicPublicationPermitted,
} from "../../../lib/nationwide-onboarding";

const C = { navy: "#123c59", teal: "#176b53", pale: "#f4f8fb", muted: "#536b7c", border: "#dbe5eb" };

export default function NationwideOnboardingPage() {
  const profiles = onboardingProfiles();
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
          <h1 style={{ fontSize: "clamp(30px, 5vw, 46px)", lineHeight: 1.14, margin: "12px 0" }}>Nationwide state onboarding</h1>
          <p style={{ maxWidth: 780, lineHeight: 1.7, fontSize: 16, opacity: 0.95 }}>
            Washington, Oregon, and California remain the reference implementations. Michigan and Pennsylvania stay unpublished.
          </p>
        </div>
      </section>
      <div style={{ maxWidth: 1100, margin: "auto", padding: "28px 5% 60px", display: "grid", gap: 18 }}>
        <p>This page does not list facilities. A row in an official file is not an available placement.</p>
        {profiles.map(profile => (
          <section key={profile.state} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
            <h2 style={{ marginTop: 0 }}>{profile.state}</h2>
            <p style={{ color: C.muted }}>
              {profile.role === "reference" ? "Reference implementation." : "Candidate."} Publication control: {profile.publication}. Public publication permitted: {publicPublicationPermitted(profile) ? "yes" : "no"}.
            </p>
          </section>
        ))}
        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Michigan file observation</h2>
          <p>
            The official comma-delimited file contained {MICHIGAN_FILE_ROWS.toLocaleString()} rows and {MICHIGAN_POSITIONAL_FIELDS} positional fields. {michiganDescribedRows().toLocaleString()} rows use a type code from the official record description. Michigan is unpublished.
          </p>
          <ul>
            {MICHIGAN_OBSERVED_TYPES.map(category => (
              <li key={category.code}>
                {category.code}: {category.label ?? "Not described in the official record key"} — {category.observedRows.toLocaleString()}
              </li>
            ))}
          </ul>
          <p>Observed status text is not an availability claim.</p>
          <ul>
            {MICHIGAN_OBSERVED_STATUSES.map(status => (
              <li key={status.code}>{status.code}: {status.observedRows.toLocaleString()}</li>
            ))}
          </ul>
          <p>
            {MICHIGAN_EIGHT_DIGIT_DATES.toLocaleString()} license dates are eight digits. {MICHIGAN_BLANK_DATES.toLocaleString()} license dates are blank, and those blank dates are the undescribed XH rows. Neither shape is an export date. The file server clock {MICHIGAN_FILE_SERVER_CLOCK} is not an export date.
          </p>
          <p>
            {MICHIGAN_FIVE_DIGIT_ZIPS.toLocaleString()} ZIP values have five digits and {MICHIGAN_NINE_DIGIT_ZIPS.toLocaleString()} have nine digits. The original values are unchanged. No coordinate is recorded.
          </p>
          <p>Official-source blockers that stay closed: {MICHIGAN_OFFICIAL_SOURCE_BLOCKERS.join("; ")}. The supplemental-address field remains unresolved, and XH remains undescribed.</p>
        </section>
        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Next-state review</h2>
          <p>Pennsylvania is the selected candidate. Wisconsin and Minnesota were reviewed and were not selected. None of these states is published.</p>
          <ul>
            {NEXT_STATE_REVIEW.map(candidate => (
              <li key={candidate.state}>
                {candidate.rank}. {candidate.state} — {candidate.selected ? "selected" : "not selected"}. {candidate.note}
              </li>
            ))}
          </ul>
        </section>
        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Pennsylvania file observation</h2>
          <p>
            The official personal-care-home file contained {PENNSYLVANIA_ROWS.toLocaleString()} rows, all in one class. Usable street text: {PENNSYLVANIA_USABLE_STREET_ROWS.toLocaleString()}. Letter-only street values: {PENNSYLVANIA_LETTER_ONLY_STREET_ROWS.toLocaleString()}. Those letter-only values are not corrected. Publication-eligible records: {PENNSYLVANIA_PUBLICATION_ELIGIBLE_ROWS}.
          </p>
          <p>
            The portal catalog timestamp {PENNSYLVANIA_CATALOG_ROWS_UPDATED_AT} is not an export date. Latitude and longitude are georeferenced values, not accepted licensing coordinates. No per-facility disclosure prefix is recorded. Pennsylvania is unpublished.
          </p>
        </section>
      </div>
    </main>
  );
}
