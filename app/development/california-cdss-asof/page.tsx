import Link from "next/link";
import { buildCaliforniaTransparencyTier1EligibilityPreview } from "../../../lib/california-transparency-tier1-eligibility";

const C = {
  navy: "#123c59",
  teal: "#176b53",
  pale: "#f4f8fb",
  muted: "#536b7c",
  border: "#dbe5eb",
  warn: "#8a4b08",
};

export default function CaliforniaCdssAsOfPage() {
  const preview = buildCaliforniaTransparencyTier1EligibilityPreview();
  const loadError = !preview.arithmeticOk;

  return (
    <main style={{ minHeight: "100vh", background: C.pale, color: C.navy, fontFamily: "Arial, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "16px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 19 }}>National Care Home Finder</strong>
          <nav style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link href="/development/california-auth-verify" style={{ color: C.teal, fontWeight: 600 }}>
              ← Auth verification
            </Link>
            <Link href="/development/california-exclusion-conflict" style={{ color: C.teal, fontWeight: 600 }}>
              Exclusion / conflict →
            </Link>
          </nav>
        </div>
      </header>

      <section style={{ background: `linear-gradient(125deg, ${C.navy}, ${C.teal})`, color: "white", padding: "clamp(28px, 6vw, 48px) 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto" }}>
          <p style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>UNPUBLISHED DEVELOPMENT REVIEW</p>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 44px)", lineHeight: 1.14, margin: "12px 0" }}>
            California CDSS as-of date + Tier 1
          </h1>
          <p style={{ maxWidth: 820, lineHeight: 1.7, opacity: 0.95 }}>
            Observed {preview.observedOn}. Transparency CSV filename/header as-of under CDSS confirmation.
            ArcGIS roster pathway remains STOP. California stays unpublished.
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
          <strong>Public: {preview.stopGoPublic}.</strong> Development preview: {preview.stopGoDevelopmentPreview}.
          ArcGIS roster: {preview.stopGoArcGisRoster}. Adopted as-of: {preview.asOf.adoptedAsOfIso ?? "null"}.
          Offline Tier 1: {preview.counts.tier1OfflineEligible.toLocaleString()}. Publication eligible:{" "}
          {preview.counts.publicationEligible}.
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Resolved blockers</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {preview.resolvedBlockers.map((b) => (
              <li key={b}>{b}</li>
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
