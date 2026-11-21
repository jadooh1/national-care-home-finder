import Link from "next/link";
import { buildFloridaAhcaSourceDateReport } from "../../../lib/florida-ahca-source-date";
import { FLORIDA_TIER1_COUNTS } from "../../../lib/florida-tier1-eligibility";

const C = {
  navy: "#123c59",
  teal: "#176b53",
  pale: "#f4f8fb",
  muted: "#536b7c",
  border: "#dbe5eb",
  warn: "#8a4b08",
};

export default function FloridaSourceDatePreviewPage() {
  const report = buildFloridaAhcaSourceDateReport();
  const preserved =
    report.preservedCounts.tier1OfflineEligible === FLORIDA_TIER1_COUNTS.tier1OfflineEligible
    && report.preservedCounts.publicationEligible === FLORIDA_TIER1_COUNTS.publicationEligible
    && report.preservedCounts.denominatorRows === FLORIDA_TIER1_COUNTS.denominatorRows;

  return (
    <main style={{ minHeight: "100vh", background: C.pale, color: C.navy, fontFamily: "Arial, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "16px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 19 }}>National Care Home Finder</strong>
          <Link href="/development/florida-tier1" style={{ color: C.teal, fontWeight: 600 }}>
            ← Florida Tier 1 preview
          </Link>
        </div>
      </header>

      <section style={{ background: `linear-gradient(125deg, ${C.navy}, ${C.teal})`, color: "white", padding: "clamp(28px, 6vw, 48px) 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto" }}>
          <p style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>UNPUBLISHED DEVELOPMENT REVIEW</p>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 44px)", lineHeight: 1.14, margin: "12px 0" }}>
            Florida AHCA source-date verification
          </h1>
          <p style={{ maxWidth: 820, lineHeight: 1.7, fontSize: 16, opacity: 0.95 }}>
            Observed {report.observedOn}. Freshness-only follow-up — does not re-count the 3,025-row ALF embed.
            Does not publish Florida, change Oregon, enable owner claims, or write Supabase. Robots disallow
            `/development`.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "auto", padding: "28px 5% 60px", display: "grid", gap: 18 }}>
        <section style={{ background: "#fff7e8", border: "1px solid #f0d2a0", borderRadius: 12, padding: 18, color: C.warn }}>
          <strong>Public / Tier 1 freshness: {report.stopGoPublic}.</strong> Development review:{" "}
          {report.stopGoDevelopmentPreview}. Authoritative ISO export:{" "}
          {report.decision.authoritativeIsoExportDate ?? "null"}. Policy exception applies:{" "}
          {String(report.decision.freshnessPolicyExceptionApplies)}. Offline Tier 1 preserved:{" "}
          {report.preservedCounts.tier1OfflineEligible.toLocaleString()} /{" "}
          {report.preservedCounts.denominatorRows.toLocaleString()}. Publication eligible:{" "}
          {report.preservedCounts.publicationEligible}. Final public visibility:{" "}
          {String(report.finalPublicVisibility)}. Counts preserved vs Tier 1 package: {String(preserved)}.
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Nationwide policy gate</h2>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>{report.decision.reason}</p>
          <ul style={{ color: C.muted, lineHeight: 1.7 }}>
            <li>Requires source-issued ISO: {String(report.policyGate.requiresSourceIssuedIsoOrDocumentedException)}</li>
            <li>Permits Tier 1 without ISO: {String(report.policyGate.permitsTier1WithoutIsoExportDate)}</li>
            <li>Florida freshness policy documented: {String(report.policyGate.floridaFreshnessPolicyDocumented)}</li>
            <li>Independent currentness evidence: {String(report.policyGate.floridaIndependentCurrentnessEvidence)}</li>
            <li>Nightly schedule alone insufficient: {String(report.policyGate.nightlyScheduleAloneInsufficient)}</li>
          </ul>
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Candidates examined</h2>
          {report.candidates.map((c) => (
            <div key={c.id} style={{ marginBottom: 14 }}>
              <strong>{c.id}</strong>
              <p style={{ color: C.muted, lineHeight: 1.6, margin: "6px 0" }}>
                {c.surface}. {c.observation}. Disposition: {c.disposition}. Accepted:{" "}
                {String(c.acceptedAsOfficialExport)}.
              </p>
            </div>
          ))}
          <p style={{ color: C.muted }}>
            Accepted official export candidates: {report.acceptedOfficialExportCandidates}.
          </p>
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Agency clarification (draft only)</h2>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>
            Email draft prepared: {String(report.agencyEmailDraft.doNotSend === true)}. Sent:{" "}
            {String(report.emailSent)}. To: {report.agencyEmailDraft.toSuggested}.
          </p>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>{report.decision.mostActionableNextStep}</p>
        </section>
      </div>
    </main>
  );
}
