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
import {
  PUBLICATION_ACCEPTANCE_LAUNCH_RECOMMENDATION,
  buildPublicationAcceptanceReport,
} from "../../../lib/publication-eligibility-acceptance";

const C = {
  navy: "#123c59",
  teal: "#176b53",
  pale: "#f4f8fb",
  muted: "#536b7c",
  border: "#dbe5eb",
  warn: "#8a4b08",
  danger: "#8b1e1e",
};

function profileFor(state: string) {
  return PUBLICATION_STATE_PROFILES.find((p) => p.state === state) ?? null;
}

export default function PublicationEligibilityPage() {
  const report = buildPublicationReadinessReport();
  const rollout = buildPublicationRolloutPlan();
  const acceptance = buildPublicationAcceptanceReport();
  const oregon = report.summaries.find((s) => s.state === "Oregon") ?? null;
  const florida = report.summaries.find((s) => s.state === "Florida") ?? null;
  const oregonProfile = profileFor("Oregon");
  const floridaProfile = profileFor("Florida");
  const loadError =
    !report.summaries.length
    || !oregon
    || !florida
    || !oregonProfile
    || !floridaProfile;

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

      <section style={{ background: `linear-gradient(125deg, ${C.navy}, ${C.teal})`, color: "white", padding: "clamp(28px, 6vw, 48px) 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto" }}>
          <p style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>UNPUBLISHED DEVELOPMENT REVIEW</p>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 44px)", lineHeight: 1.14, margin: "12px 0" }}>
            Tiered publication eligibility
          </h1>
          <p style={{ maxWidth: 820, lineHeight: 1.7, fontSize: 16, opacity: 0.95 }}>
            Spec {PUBLICATION_ELIGIBILITY_SPEC_VERSION} · observed {PUBLICATION_ELIGIBILITY_OBSERVED_ON}. Fail-closed
            per-facility tiers (0–3). State authorization stays separate from row eligibility. This page does not
            publish facilities or change directory contracts. Robots disallow `/development`.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "auto", padding: "28px 5% 60px", display: "grid", gap: 18 }}>
        {loadError ? (
          <section
            role="alert"
            style={{ background: "#fdecec", border: `1px solid #f0b4b4`, borderRadius: 12, padding: 18, color: C.danger }}
          >
            <strong>Readiness data incomplete.</strong> Oregon/Florida summaries or profiles failed to load. Fail closed
            — do not treat this page as launch authorization.
          </section>
        ) : null}

        <section style={{ background: "#fff7e8", border: `1px solid #f0d2a0`, borderRadius: 12, padding: 18, color: C.warn }}>
          <strong>STOP for new public states.</strong> Washington remains the only public directory. Oregon stays
          development / map-off. Florida stays unpublished. California stays BLOCKED. Owner claims remain
          Washington-only. Eligibility never auto-publishes. No Supabase writes.
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Oregon &amp; Florida acceptance</h2>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>
            Acceptance matrix: {acceptance.passed} pass · {acceptance.blocked} blocked · {acceptance.failed} fail.
            Public launch authorized: {String(acceptance.allowsPublication)}.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 14,
            }}
          >
            <article style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
              <h3 style={{ margin: "0 0 8px" }}>Oregon — {PUBLICATION_ACCEPTANCE_LAUNCH_RECOMMENDATION.oregon.decision}</h3>
              <p style={{ margin: "0 0 8px", color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
                Auth: {oregon?.stateAuthorization}. Map disabled: {String(oregon?.oregonMapDisabled)}. ISO export:{" "}
                {oregonProfile?.freshness.officialExportDateIso ?? "null"}. Source retrievedOn: null.
              </p>
              <p style={{ margin: "0 0 8px", fontSize: 13 }}>
                Tiers T0–T3: {oregon?.tierCounts.tier0}/{oregon?.tierCounts.tier1}/{oregon?.tierCounts.tier2}/
                {oregon?.tierCounts.tier3}
              </p>
              <ul style={{ margin: 0, paddingLeft: 18, color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
                {(oregon?.blockers ?? []).map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.6 }}>
                {PUBLICATION_ACCEPTANCE_LAUNCH_RECOMMENDATION.oregon.reason}
              </p>
            </article>
            <article style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
              <h3 style={{ margin: "0 0 8px" }}>Florida — {PUBLICATION_ACCEPTANCE_LAUNCH_RECOMMENDATION.florida.decision}</h3>
              <p style={{ margin: "0 0 8px", color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
                Auth: {florida?.stateAuthorization}. Disclosure verified:{" "}
                {String(floridaProfile?.disclosure.facilitySpecificVerified)}. ISO export:{" "}
                {floridaProfile?.freshness.officialExportDateIso ?? "null"}. Licensing coords:{" "}
                {String(floridaProfile?.coordinates.licensingProvenanceVerified)}.
              </p>
              <p style={{ margin: "0 0 8px", fontSize: 13 }}>
                Tiers T0–T3: {florida?.tierCounts.tier0}/{florida?.tierCounts.tier1}/{florida?.tierCounts.tier2}/
                {florida?.tierCounts.tier3}
              </p>
              <ul style={{ margin: 0, paddingLeft: 18, color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
                {(florida?.blockers ?? []).map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.6 }}>
                {PUBLICATION_ACCEPTANCE_LAUNCH_RECOMMENDATION.florida.reason}
              </p>
            </article>
          </div>
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
          <h2 style={{ marginTop: 0 }}>State readiness (tiers · blockers · source dates)</h2>
          <p style={{ color: C.muted }}>
            Roster row labels are evidence, not launch-ready public counts. Fixture hard-cases are separate.
          </p>
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: "8px 6px" }}>State</th>
                  <th style={{ padding: "8px 6px" }}>Auth</th>
                  <th style={{ padding: "8px 6px" }}>Stop/Go</th>
                  <th style={{ padding: "8px 6px" }}>T0</th>
                  <th style={{ padding: "8px 6px" }}>T1</th>
                  <th style={{ padding: "8px 6px" }}>T2</th>
                  <th style={{ padding: "8px 6px" }}>T3</th>
                  <th style={{ padding: "8px 6px" }}>ISO export</th>
                  <th style={{ padding: "8px 6px" }}>Blockers</th>
                </tr>
              </thead>
              <tbody>
                {report.summaries.map((row) => {
                  const profile = profileFor(row.state);
                  return (
                    <tr key={row.state} style={{ borderBottom: `1px solid ${C.border}`, verticalAlign: "top" }}>
                      <td style={{ padding: "8px 6px" }}>{row.state}</td>
                      <td style={{ padding: "8px 6px" }}>{row.stateAuthorization}</td>
                      <td style={{ padding: "8px 6px" }}>{row.stopGo}</td>
                      <td style={{ padding: "8px 6px" }}>{row.tierCounts.tier0}</td>
                      <td style={{ padding: "8px 6px" }}>{row.tierCounts.tier1}</td>
                      <td style={{ padding: "8px 6px" }}>{row.tierCounts.tier2}</td>
                      <td style={{ padding: "8px 6px" }}>{row.tierCounts.tier3}</td>
                      <td style={{ padding: "8px 6px", color: C.muted }}>
                        {profile?.freshness.officialExportDateIso ?? "null"}
                      </td>
                      <td style={{ padding: "8px 6px", color: C.muted, fontSize: 12, lineHeight: 1.5 }}>
                        {row.blockers.length ? row.blockers.join("; ") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Publication tiers</h2>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7, color: C.muted }}>
            <li>
              <strong style={{ color: C.navy }}>Tier 0 blocked</strong> — invalid/ambiguous ID, bad address, ambiguous
              status, category conflict, exclusion, freshness STOP, CA blocked.
            </li>
            <li>
              <strong style={{ color: C.navy }}>Tier 1 listing</strong> — identity, provenance, category, status,
              usable physical address, freshness (ISO or documented policy). Disclosure optional. No coords required.
            </li>
            <li>
              <strong style={{ color: C.navy }}>Tier 2 mapped</strong> — Tier 1 + licensing coordinates + address
              alignment. Georeferenced pins rejected. Oregon map stays off.
            </li>
            <li>
              <strong style={{ color: C.navy }}>Tier 3 enhanced</strong> — Tier 1/2 + separately verified optional
              capacity/disclosure/inspection. Missing inspection ≠ clean inspection.
            </li>
          </ol>
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Regulatory profiles (source dates)</h2>
          <ul style={{ lineHeight: 1.7, color: C.muted }}>
            {PUBLICATION_STATE_PROFILES.map((p) => (
              <li key={p.state}>
                <strong style={{ color: C.navy }}>{p.state}</strong> — {p.identityRules.fieldLabel}; ISO export:{" "}
                {p.freshness.officialExportDateIso ?? "null"}; rejected proxies:{" "}
                {p.freshness.rejectedProxies.length ? p.freshness.rejectedProxies.join(", ") : "none"}; disclosure
                verified: {p.disclosure.facilitySpecificVerified ? "yes" : "no"}; stop/go {p.publicationStopGo}.
              </li>
            ))}
          </ul>
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Preview &amp; rollback</h2>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>
            Preview checklist items: {acceptance.previewRollback.preview.length}. Rollback checklist items:{" "}
            {acceptance.previewRollback.rollback.length}. Rollout phases: {rollout.phases.length}. Allows publication
            without approval: {String(rollout.allowsPublicationWithoutApproval)}.
          </p>
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
        </section>
      </div>
    </main>
  );
}
