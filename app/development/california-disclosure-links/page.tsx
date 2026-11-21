import Link from "next/link";
import { buildCaliforniaDisclosureLinkVerificationPreview } from "../../../lib/california-disclosure-link-verification";

const C = {
  navy: "#123c59",
  teal: "#176b53",
  pale: "#f4f8fb",
  muted: "#536b7c",
  border: "#dbe5eb",
  warn: "#8a4b08",
};

export default function CaliforniaDisclosureLinksPage() {
  const preview = buildCaliforniaDisclosureLinkVerificationPreview();
  const loadError = !preview.arithmeticOk;

  return (
    <main style={{ minHeight: "100vh", background: C.pale, color: C.navy, fontFamily: "Arial, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "16px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 19 }}>National Care Home Finder</strong>
          <Link href="/development/california-tier1-launch" style={{ color: C.teal, fontWeight: 600 }}>
            ← Tier 1 launch
          </Link>
        </div>
      </header>

      <section style={{ background: `linear-gradient(125deg, ${C.navy}, ${C.teal})`, color: "white", padding: "clamp(28px, 6vw, 48px) 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto" }}>
          <p style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>UNPUBLISHED DEVELOPMENT REVIEW</p>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 44px)", lineHeight: 1.14, margin: "12px 0" }}>
            California disclosure links
          </h1>
          <p style={{ maxWidth: 820, lineHeight: 1.7, opacity: 0.95 }}>
            Observed {preview.observedOn}. Baseline {preview.baseline}. Official CDSS FacDetail and FacilityReports
            verification. Leading zeros preserved. California stays unpublished.
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
          <strong>Public: {preview.stopGoPublic}.</strong> Working facility-specific samples:{" "}
          {preview.counts.workingFacilitySpecific}. Invalid refused: {preview.counts.invalidRefused}.
          Offline Tier 1: {preview.counts.tier1OfflineEligible.toLocaleString()}. Publication eligible:{" "}
          {preview.counts.publicationEligible}.
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Tier 1 vs publication policy</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>
              Offline Tier 1 disclosure required: {preview.tier1Policy.offlineTier1DisclosureRequired ? "yes" : "no"}
            </li>
            <li>
              CDSS Search/Download fallback satisfies offline Tier 1:{" "}
              {preview.tier1Policy.fallbackSatisfiesOfflineTier1 ? "yes" : "no"}
            </li>
            <li>
              Fallback alone satisfies publication-acceptance facility-specific link:{" "}
              {preview.tier1Policy.fallbackSatisfiesPublicationAcceptanceFacilitySpecificLink
                ? "yes"
                : "no"}
            </li>
            <li>
              REPORTPAGE fakeout publishable: {preview.tier1Policy.reportPageFieldPublishable ? "yes" : "no"}
            </li>
          </ul>
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Decision requiring approval</h2>
          {preview.decisionsRequiringApproval.map((d) => (
            <div key={d.id}>
              <p style={{ fontWeight: 700, marginTop: 0 }}>{d.title}</p>
              <p style={{ lineHeight: 1.7 }}>{d.decisionText}</p>
              <p style={{ color: C.muted, marginBottom: 0 }}>Recommendation: {d.recommendation}</p>
            </div>
          ))}
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Sample classifications</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {preview.samples.map((s) => (
              <li key={s.facilityNumber}>
                {s.facilityNumber} ({s.role}) — {s.classification}
                {s.apiStatus ? `; API status ${s.apiStatus}` : ""}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
