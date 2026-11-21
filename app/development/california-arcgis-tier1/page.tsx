import Link from "next/link";
import { buildCaliforniaArcgisTier1EligibilityPreview } from "../../../lib/california-arcgis-tier1-eligibility";

const C = {
  navy: "#123c59",
  teal: "#176b53",
  pale: "#f4f8fb",
  muted: "#536b7c",
  border: "#dbe5eb",
  warn: "#8a4b08",
};

export default function CaliforniaArcgisTier1PreviewPage() {
  const preview = buildCaliforniaArcgisTier1EligibilityPreview();
  const loadError = !preview.arithmeticOk || preview.counts.tier1OfflineEligible !== 0;

  return (
    <main style={{ minHeight: "100vh", background: C.pale, color: C.navy, fontFamily: "Arial, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "16px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 19 }}>National Care Home Finder</strong>
          <Link href="/development/publication-eligibility" style={{ color: C.teal, fontWeight: 600 }}>
            ← Publication eligibility
          </Link>
        </div>
      </header>

      <section style={{ background: `linear-gradient(125deg, ${C.navy}, ${C.teal})`, color: "white", padding: "clamp(28px, 6vw, 48px) 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto" }}>
          <p style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>UNPUBLISHED DEVELOPMENT REVIEW</p>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 44px)", lineHeight: 1.14, margin: "12px 0" }}>
            California ArcGIS Tier 1 reconciliation
          </h1>
          <p style={{ maxWidth: 820, lineHeight: 1.7, fontSize: 16, opacity: 0.95 }}>
            Observed {preview.observedOn}. Full-dataset ArcGIS FeatureServer/0 vs historical CHHS RCFE/ARF.
            This page does not publish California, change Washington or Oregon, activate exclusions, enable
            owner claims, or write Supabase. Robots disallow `/development`.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "auto", padding: "28px 5% 60px", display: "grid", gap: 18 }}>
        {loadError ? (
          <section role="alert" style={{ background: "#fdecec", border: "1px solid #f0b4b4", borderRadius: 12, padding: 18, color: "#8b1e1e" }}>
            <strong>Preview arithmetic failed.</strong> Fail closed — do not treat California ArcGIS as Tier 1 ready.
          </section>
        ) : null}

        <section style={{ background: "#fff7e8", border: "1px solid #f0d2a0", borderRadius: 12, padding: 18, color: C.warn }}>
          <strong>Public launch: {preview.stopGoPublic}.</strong> Development preview (ArcGIS-as-roster):{" "}
          {preview.stopGoDevelopmentPreview}. Tier 2 map: {preview.stopGoTier2Map}. Offline Tier 1 candidates:{" "}
          {preview.counts.tier1OfflineEligible}. Publication eligible: {preview.counts.publicationEligible}. Final
          public visibility: {String(preview.finalPublicVisibility)}. WA/OR unchanged:{" "}
          {String(preview.washingtonUnchanged && preview.oregonUnchanged)}.
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Verified reconciliation counts</h2>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>
            Dataset: {preview.source.datasetLabel}. Exact-string license match only. GIS STATUS integers not
            accepted. Coordinates not required for Tier 1; ArcGIS coords remain georeferenced (not Tier 2).
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>ArcGIS rows</div>
              <strong>{preview.counts.gisTotalRows.toLocaleString()}</strong>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>CHHS eligible</div>
              <strong>{preview.counts.chhsCombinedEligible.toLocaleString()}</strong>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>Exact matches</div>
              <strong>{preview.counts.exactIdMatches.toLocaleString()}</strong>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>Exact misses</div>
              <strong>{preview.counts.missingFromGisExact.toLocaleString()}</strong>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>Leading-zero mismatches</div>
              <strong>{preview.counts.leadingZeroRepresentationMismatches.toLocaleString()}</strong>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>Truly missing</div>
              <strong>{preview.counts.trulyMissingEvenIfZerosCollapsed.toLocaleString()}</strong>
            </div>
          </div>
          <p style={{ color: C.muted, marginBottom: 0 }}>
            Drift vs PR #133: GIS {preview.driftFromPr133.gisTotalRowsDelta}, exact matches{" "}
            {preview.driftFromPr133.exactIdMatchesDelta}. Eligible baseline unchanged:{" "}
            {String(preview.driftFromPr133.chhsCombinedEligibleUnchanged)}.
          </p>
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Failed Tier 1 gates</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {preview.gateResults.filter((g) => !g.passed).map((g) => (
              <li key={g.gate}>
                <strong>{g.gate}</strong>: {g.reasons.join(", ")}
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
