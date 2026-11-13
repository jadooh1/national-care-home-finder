import Link from "next/link";
import {
  CALIFORNIA_ARF_ELIGIBLE_BY_STATUS,
  CALIFORNIA_ARF_LABEL,
  CALIFORNIA_EXCLUDED_RECORDS,
  CALIFORNIA_RAW_FILE_DATES,
  CALIFORNIA_RCFE_ELIGIBLE_BY_STATUS,
  CALIFORNIA_RCFE_LABEL,
  CALIFORNIA_STATUS_LABELS,
  CALIFORNIA_STATUS_ORDER,
  californiaDirectoryReady,
  californiaEligibleCount,
  californiaExcludedCount,
  countStatuses,
  type CaliforniaLicenseStatus,
} from "../../../lib/california-directory";

const C = { navy: "#123c59", teal: "#176b53", pale: "#f4f8fb", muted: "#536b7c", border: "#dbe5eb" };

const GROUPS = [
  { label: CALIFORNIA_RCFE_LABEL, counts: CALIFORNIA_RCFE_ELIGIBLE_BY_STATUS, rawFileDate: CALIFORNIA_RAW_FILE_DATES.rcfe },
  { label: CALIFORNIA_ARF_LABEL, counts: CALIFORNIA_ARF_ELIGIBLE_BY_STATUS, rawFileDate: CALIFORNIA_RAW_FILE_DATES.arf },
] as const;

export default function CaliforniaDevelopmentDirectoryPage() {
  const publication = californiaDirectoryReady() ? "California is published." : "California is unpublished.";
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
          <h1 style={{ fontSize: "clamp(30px, 5vw, 46px)", lineHeight: 1.14, margin: "12px 0" }}>California licensing categories</h1>
          <p style={{ maxWidth: 780, lineHeight: 1.7, fontSize: 16, opacity: 0.95 }}>
            {californiaEligibleCount().toLocaleString()} records are structurally eligible for a later directory. A structurally eligible record is not an active home and is not an available placement.
          </p>
        </div>
      </section>
      <div style={{ maxWidth: 1100, margin: "auto", padding: "28px 5% 60px", display: "grid", gap: 18 }}>
        <p>{publication} This page does not list facilities or profile links.</p>
        {GROUPS.map(group => (
          <section key={group.label} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
            <h2 style={{ marginTop: 0 }}>{group.label}</h2>
            <p style={{ color: C.muted }}>{countStatuses(group.counts).toLocaleString()} structurally eligible records. The raw file date text is {group.rawFileDate}. That text is not an export date.</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
              {CALIFORNIA_STATUS_ORDER.map((status: CaliforniaLicenseStatus) => (
                <li key={status}>{CALIFORNIA_STATUS_LABELS[status]}: {group.counts[status].toLocaleString()}</li>
              ))}
            </ul>
          </section>
        ))}
        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Excluded records</h2>
          <p>{californiaExcludedCount().toLocaleString()} records stay in the validation report with their original values.</p>
          <ul>
            <li>Blank category: {CALIFORNIA_EXCLUDED_RECORDS.blankCategory.toLocaleString()}</li>
            <li>Other license category: {CALIFORNIA_EXCLUDED_RECORDS.otherLicenseCategory.toLocaleString()}</li>
            <li>Shifted row: {CALIFORNIA_EXCLUDED_RECORDS.shiftedRow.toLocaleString()}</li>
          </ul>
          <p>No coordinate or export date is recorded. The blank category and the shifted row keep their original values. One checked residential-care facility number and one checked adult-residential facility number resolved on the official route, and their live status text was not the open-data status. A historical licensed status is not a current placement. A later status sample timed out and stays inconclusive.</p>
        </section>
      </div>
    </main>
  );
}
