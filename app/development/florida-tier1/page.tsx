import Link from "next/link";
import { buildFloridaTier1EligibilityPreview } from "../../../lib/florida-tier1-eligibility";
import { buildFloridaTier1LaunchPlan } from "../../../lib/florida-tier1-launch";

const C = {
  navy: "#123c59",
  teal: "#176b53",
  pale: "#f4f8fb",
  muted: "#536b7c",
  border: "#dbe5eb",
  warn: "#8a4b08",
};

export default function FloridaTier1PreviewPage() {
  const preview = buildFloridaTier1EligibilityPreview();
  const launch = buildFloridaTier1LaunchPlan();
  const loadError = !preview.arithmeticOk || preview.counts.tier1OfflineEligible <= 0;

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
            Florida Tier 1 eligibility preview
          </h1>
          <p style={{ maxWidth: 820, lineHeight: 1.7, fontSize: 16, opacity: 0.95 }}>
            Observed {preview.observedOn}. Full-dataset ALF embed scope ({preview.counts.denominatorRows} rows). This page
            does not publish Florida, change Oregon, enable owner claims, or write Supabase. Robots disallow
            `/development`.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "auto", padding: "28px 5% 60px", display: "grid", gap: 18 }}>
        {loadError ? (
          <section role="alert" style={{ background: "#fdecec", border: "1px solid #f0b4b4", borderRadius: 12, padding: 18, color: "#8b1e1e" }}>
            <strong>Preview arithmetic failed.</strong> Fail closed — do not treat Florida as launch-ready.
          </section>
        ) : null}

        <section style={{ background: "#fff7e8", border: "1px solid #f0d2a0", borderRadius: 12, padding: 18, color: C.warn }}>
          <strong>Public launch: {preview.stopGoPublic}.</strong> Development preview: {preview.stopGoDevelopmentPreview}.
          Offline Tier 1 candidates: {preview.counts.tier1OfflineEligible.toLocaleString()} /{" "}
          {preview.counts.denominatorRows.toLocaleString()}. Publication eligible: {preview.counts.publicationEligible}.
          Final public visibility: {String(preview.finalPublicVisibility)}. Oregon unchanged:{" "}
          {String(preview.oregonUnchanged)}.
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Verified counts (full-dataset scope)</h2>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>
            Dataset: {preview.source.datasetLabel}. Not extrapolated from a sample. Primary identity:{" "}
            {preview.rules.primaryIdentity}. Coordinates required: {String(preview.rules.coordinatesRequired)}.
            Inspection link required: {String(preview.rules.inspectionLinkRequired)}.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>LICENSED</div>
              <strong>{preview.counts.licensed.toLocaleString()}</strong>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>IN REVIEW excluded</div>
              <strong>{preview.counts.inReview.toLocaleString()}</strong>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>7622 pair excluded</div>
              <strong>{preview.counts.duplicateLicenseNumberRows}</strong>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>Blank state excluded</div>
              <strong>{preview.counts.blankStateLicensedRowsExcluded}</strong>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>Tier 1 offline</div>
              <strong>{preview.counts.tier1OfflineEligible.toLocaleString()}</strong>
            </div>
          </div>
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Resolved for preview</h2>
          <ul style={{ color: C.muted, lineHeight: 1.7 }}>
            {preview.resolvedForPreview.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3>Remaining public-launch blockers</h3>
          <ul style={{ color: C.muted, lineHeight: 1.7 }}>
            {preview.remainingBlockers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>{preview.freshness.note}</p>
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Explicit exclusions</h2>
          {preview.exclusions.map((ex) => (
            <div key={ex.reason} style={{ marginBottom: 14 }}>
              <strong>{ex.reason}</strong>
              <p style={{ color: C.muted, lineHeight: 1.6, margin: "6px 0" }}>{ex.note}</p>
            </div>
          ))}
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Staged launch &amp; rollback</h2>
          <ol style={{ lineHeight: 1.7 }}>
            {launch.phases.map((phase) => (
              <li key={phase.phase} style={{ marginBottom: 10 }}>
                <strong>
                  Phase {phase.phase}: {phase.name}
                </strong>
                <div style={{ color: C.muted }}>{phase.goNoGo}</div>
              </li>
            ))}
          </ol>
          <p style={{ color: C.muted }}>
            Rollback items: {launch.rollback.length}. Email draft prepared (not sent):{" "}
            {String(launch.agencyEmailDraft.doNotSend)}. Allows publication without approval:{" "}
            {String(launch.allowsPublicationWithoutApproval)}.
          </p>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>{preview.mostActionableNextStep}</p>
        </section>
      </div>
    </main>
  );
}
