import Link from "next/link";
import { buildCaliforniaAuthoritativeDataVerification } from "../../../lib/california-authoritative-data-verification";

const C = {
  navy: "#123c59",
  teal: "#176b53",
  pale: "#f4f8fb",
  muted: "#536b7c",
  border: "#dbe5eb",
  warn: "#8a4b08",
};

export default function CaliforniaAuthVerifyPage() {
  const report = buildCaliforniaAuthoritativeDataVerification();
  const loadError = !report.leadingZeroArithmeticOk || !report.statusSampleAllLicensed;

  return (
    <main style={{ minHeight: "100vh", background: C.pale, color: C.navy, fontFamily: "Arial, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "16px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 19 }}>National Care Home Finder</strong>
          <Link href="/development/california-arcgis-tier1" style={{ color: C.teal, fontWeight: 600 }}>
            ← ArcGIS Tier 1
          </Link>
        </div>
      </header>

      <section style={{ background: `linear-gradient(125deg, ${C.navy}, ${C.teal})`, color: "white", padding: "clamp(28px, 6vw, 48px) 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto" }}>
          <p style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>UNPUBLISHED DEVELOPMENT REVIEW</p>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 44px)", lineHeight: 1.14, margin: "12px 0" }}>
            California authoritative data verification
          </h1>
          <p style={{ maxWidth: 820, lineHeight: 1.7, opacity: 0.95 }}>
            Observed {report.observedOn}. STATUS domain hunt, leading-zero ID characterization, and export/version
            search after PR #197. California stays STOP / unpublished. No agency email sent.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "auto", padding: "28px 5% 60px", display: "grid", gap: 18 }}>
        {loadError ? (
          <section role="alert" style={{ background: "#fdecec", border: "1px solid #f0b4b4", borderRadius: 12, padding: 18, color: "#8b1e1e" }}>
            <strong>Verification arithmetic failed.</strong> Fail closed.
          </section>
        ) : null}

        <section style={{ background: "#fff7e8", border: "1px solid #f0d2a0", borderRadius: 12, padding: 18, color: C.warn }}>
          <strong>Stop/go: {report.stopGo}.</strong> STATUS accepted:{" "}
          {String(report.status.statusCodesAccepted)}. ISO export:{" "}
          {String(report.freshness.authoritativeIsoExportDate)}. Leading-zero mismatches:{" "}
          {report.leadingZeros.representationMismatches.toLocaleString()}. Agency email sent:{" "}
          {String(report.agencyEmailSent)}.
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>STATUS documentation</h2>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>{report.status.note}</p>
          <p style={{ marginBottom: 0 }}>
            Stratified sample: GIS codes {report.status.observedInScopeCodes.join(", ")} → all sampled FacilityDetail
            statuses Licensed (not an accepted domain).
          </p>
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Leading-zero IDs</h2>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>{report.leadingZeros.note}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>Mismatches</div>
              <strong>{report.leadingZeros.representationMismatches}</strong>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>Exact GIS w/ zeros</div>
              <strong>{report.leadingZeros.historicalLeadingZeroUniverse.exactGisMatchPreservingZeros}</strong>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>Missing if collapsed</div>
              <strong>{report.leadingZeros.historicalLeadingZeroUniverse.missingEvenIfCollapsed}</strong>
            </div>
          </div>
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Approvals required</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {report.approvalsRequired.map((a) => (
              <li key={a.id}>
                <strong>{a.id}</strong>: {a.needed}
              </li>
            ))}
          </ul>
          <p style={{ marginBottom: 0, color: C.muted }}>{report.mostActionableNextStep}</p>
        </section>
      </div>
    </main>
  );
}
