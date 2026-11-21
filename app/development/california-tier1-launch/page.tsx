import Link from "next/link";
import { buildCaliforniaTier1LaunchReadinessPreview } from "../../../lib/california-tier1-launch-readiness";

const C = {
  navy: "#123c59",
  teal: "#176b53",
  pale: "#f4f8fb",
  muted: "#536b7c",
  border: "#dbe5eb",
  warn: "#8a4b08",
};

export default function CaliforniaTier1LaunchPage() {
  const preview = buildCaliforniaTier1LaunchReadinessPreview();
  const loadError = !preview.arithmeticOk;

  return (
    <main style={{ minHeight: "100vh", background: C.pale, color: C.navy, fontFamily: "Arial, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "16px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 19 }}>National Care Home Finder</strong>
          <nav style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link href="/development/california-pending-policy" style={{ color: C.teal, fontWeight: 600 }}>
              ← Pending Increase policy
            </Link>
            <Link href="/development/california-disclosure-links" style={{ color: C.teal, fontWeight: 600 }}>
              Disclosure links →
            </Link>
          </nav>
        </div>
      </header>

      <section style={{ background: `linear-gradient(125deg, ${C.navy}, ${C.teal})`, color: "white", padding: "clamp(28px, 6vw, 48px) 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto" }}>
          <p style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>UNPUBLISHED DEVELOPMENT REVIEW</p>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 44px)", lineHeight: 1.14, margin: "12px 0" }}>
            California Tier 1 launch readiness
          </h1>
          <p style={{ maxWidth: 820, lineHeight: 1.7, opacity: 0.95 }}>
            Observed {preview.observedOn}. Baseline {preview.baseline}. Pending Increase mapping approved for
            future eligibility only. As-of {preview.download.adoptedAsOfIso}. California stays unpublished.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "auto", padding: "28px 5% 60px", display: "grid", gap: 18 }}>
        {loadError ? (
          <section role="alert" style={{ background: "#fdecec", border: "1px solid #f0b4b4", borderRadius: 12, padding: 18, color: "#8b1e1e" }}>
            <strong>Arithmetic failed.</strong> Fail closed.
          </section>
        ) : null}

        <section style={{ background: "#fff7e8", border: "1px solid #f0d2a0", borderRadius: 12, padding: 18, color: C.warn }}>
          <strong>Public: {preview.stopGoPublic}.</strong> Offline Tier 1 accounting: {preview.stopGoOfflineTier1Accounting}.
          Future-eligible under mapping: {preview.counts.tier1OfflineEligibleUnderApprovedMapping.toLocaleString()}.
          Remaining exclusions: {preview.counts.remainingListingExclusions}. Publication eligible:{" "}
          {preview.counts.publicationEligible}. Exclusions activated: no.
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Launch assessment</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {preview.assessment.map((row) => (
              <li key={row.area}>
                <strong>{row.title}</strong> — {row.stopGo}. {row.evidence}
              </li>
            ))}
          </ul>
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Decisions still requiring approval</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {preview.decisionsRequiringApproval.map((d) => (
              <li key={d.id}>
                <strong>{d.title}</strong> — {d.decisionText} Recommendation: {d.recommendation}
              </li>
            ))}
          </ul>
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Remaining blockers</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {preview.remainingBlockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <p style={{ marginBottom: 0, color: C.muted }}>{preview.mostActionableNextStep}</p>
        </section>
      </div>
    </main>
  );
}
