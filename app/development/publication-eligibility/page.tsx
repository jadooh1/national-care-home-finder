import Link from "next/link";
import {
  PUBLICATION_ELIGIBILITY_OBSERVED_ON,
  PUBLICATION_ELIGIBILITY_SPEC_VERSION,
} from "../../../lib/publication-eligibility";
import { PUBLICATION_STATE_PROFILES } from "../../../lib/publication-eligibility-profiles";
import { buildPublicationReadinessReport } from "../../../lib/publication-eligibility-readiness";
import {
  FIRST_REALISTIC_LAUNCH_CANDIDATE,
  buildPublicationRolloutPlan,
} from "../../../lib/publication-eligibility-rollout";

const C = {
  navy: "#123c59",
  teal: "#176b53",
  pale: "#f4f8fb",
  muted: "#536b7c",
  border: "#dbe5eb",
  warn: "#8a4b08",
};

export default function PublicationEligibilityPage() {
  const report = buildPublicationReadinessReport();
  const rollout = buildPublicationRolloutPlan();

  return (
    <main style={{ minHeight: "100vh", background: C.pale, color: C.navy, fontFamily: "Arial, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "16px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 19 }}>National Care Home Finder</strong>
          <Link href="/development/onboarding" style={{ color: C.teal, fontWeight: 600 }}>
            ← Onboarding
          </Link>
        </div>
      </header>

      <section style={{ background: `linear-gradient(125deg, ${C.navy}, ${C.teal})`, color: "white", padding: "48px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto" }}>
          <p style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>UNPUBLISHED DEVELOPMENT REVIEW</p>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", lineHeight: 1.14, margin: "12px 0" }}>
            Tiered publication eligibility
          </h1>
          <p style={{ maxWidth: 820, lineHeight: 1.7, fontSize: 16, opacity: 0.95 }}>
            Spec {PUBLICATION_ELIGIBILITY_SPEC_VERSION} · observed {PUBLICATION_ELIGIBILITY_OBSERVED_ON}. Fail-closed
            per-facility tiers (0–3). State authorization stays separate from row eligibility. This page does not
            publish facilities or change directory contracts.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "auto", padding: "28px 5% 60px", display: "grid", gap: 18 }}>
        <section style={{ background: "#fff7e8", border: `1px solid #f0d2a0`, borderRadius: 12, padding: 18, color: C.warn }}>
          <strong>STOP for new public states.</strong> Washington remains the only public directory. Oregon stays
          development / map-off. California stays BLOCKED. Owner claims remain Washington-only. No Supabase writes.
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>First realistic launch candidate</h2>
          <p>
            <strong>{FIRST_REALISTIC_LAUNCH_CANDIDATE.state}</strong> — {FIRST_REALISTIC_LAUNCH_CANDIDATE.role}. Not a
            public launch authorization.
          </p>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>{FIRST_REALISTIC_LAUNCH_CANDIDATE.why}</p>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>
            Strongest unpublished follow-on:{" "}
            <strong>{FIRST_REALISTIC_LAUNCH_CANDIDATE.strongestUnpublishedFollowOn.state}</strong> —{" "}
            {FIRST_REALISTIC_LAUNCH_CANDIDATE.strongestUnpublishedFollowOn.why}
          </p>
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>State readiness (labeled scopes)</h2>
          <p style={{ color: C.muted }}>
            Roster row labels are evidence, not launch-ready public counts. Fixture hard-cases are separate.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: "8px 6px" }}>State</th>
                  <th style={{ padding: "8px 6px" }}>Auth</th>
                  <th style={{ padding: "8px 6px" }}>Stop/Go</th>
                  <th style={{ padding: "8px 6px" }}>Listing note</th>
                  <th style={{ padding: "8px 6px" }}>Map</th>
                </tr>
              </thead>
              <tbody>
                {report.summaries.map((row) => (
                  <tr key={row.state} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "8px 6px" }}>{row.state}</td>
                    <td style={{ padding: "8px 6px" }}>{row.stateAuthorization}</td>
                    <td style={{ padding: "8px 6px" }}>{row.stopGo}</td>
                    <td style={{ padding: "8px 6px", color: C.muted }}>{row.listingCoverageNote}</td>
                    <td style={{ padding: "8px 6px", color: C.muted }}>{row.mapCoverageNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Regulatory profiles</h2>
          <ul style={{ lineHeight: 1.7, color: C.muted }}>
            {PUBLICATION_STATE_PROFILES.map((p) => (
              <li key={p.state}>
                <strong style={{ color: C.navy }}>{p.state}</strong> — {p.identityRules.fieldLabel}; freshness:{" "}
                {p.freshness.officialExportDateIso ?? "null"}; disclosure verified:{" "}
                {p.disclosure.facilitySpecificVerified ? "yes" : "no"}; stop/go {p.publicationStopGo}.
              </li>
            ))}
          </ul>
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Rollout phases</h2>
          <ol style={{ lineHeight: 1.7 }}>
            {rollout.phases.map((phase) => (
              <li key={phase.phase} style={{ marginBottom: 10 }}>
                <strong>
                  Phase {phase.phase}: {phase.name}
                </strong>
                <div style={{ color: C.muted }}>{phase.goNoGo}</div>
              </li>
            ))}
          </ol>
          <p style={{ color: C.muted }}>
            Rollback checklist items: {rollout.rollback.length}. Allows publication without approval:{" "}
            {String(rollout.allowsPublicationWithoutApproval)}.
          </p>
        </section>
      </div>
    </main>
  );
}
