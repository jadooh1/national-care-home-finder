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
  MICHIGAN_POSITIONAL_FIELDS,
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
            Washington, Oregon, and California remain the reference implementations. Michigan is the next candidate and stays unpublished.
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
        </section>
      </div>
    </main>
  );
}
