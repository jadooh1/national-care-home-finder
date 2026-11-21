import Link from "next/link";
import { buildCaliforniaPendingIncreasePublicationPolicyPreview } from "../../../lib/california-pending-increase-publication-policy";

const C = {
  navy: "#123c59",
  teal: "#176b53",
  pale: "#f4f8fb",
  muted: "#536b7c",
  border: "#dbe5eb",
  warn: "#8a4b08",
};

export default function CaliforniaPendingPolicyPage() {
  const preview = buildCaliforniaPendingIncreasePublicationPolicyPreview();
  const loadError = !preview.arithmeticOk;
  const decision = preview.decisionRequiringApproval;

  return (
    <main style={{ minHeight: "100vh", background: C.pale, color: C.navy, fontFamily: "Arial, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "16px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 19 }}>National Care Home Finder</strong>
          <nav style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link href="/development/california-pending-missing" style={{ color: C.teal, fontWeight: 600 }}>
              ← Pending / missing dates
            </Link>
            <Link href="/development/california-tier1-launch" style={{ color: C.teal, fontWeight: 600 }}>
              Tier 1 launch →
            </Link>
          </nav>
        </div>
      </header>

      <section style={{ background: `linear-gradient(125deg, ${C.navy}, ${C.teal})`, color: "white", padding: "clamp(28px, 6vw, 48px) 5%" }}>
        <div style={{ maxWidth: 1100, margin: "auto" }}>
          <p style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>UNPUBLISHED DEVELOPMENT REVIEW</p>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 44px)", lineHeight: 1.14, margin: "12px 0" }}>
            Pending Increase policy proposal
          </h1>
          <p style={{ maxWidth: 820, lineHeight: 1.7, opacity: 0.95 }}>
            Observed {preview.observedOn}. Baseline {preview.baseline}. Proposal only — not approved, not activated.
            California stays unpublished.
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
          <strong>Public: {preview.stopGoPublic}.</strong> Policy approved: no. Exclusions activated: no.
          Publication eligible: {preview.current.publicationEligible}. Awaiting: {decision.approvalState}.
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Decision requiring your approval</h2>
          <p style={{ fontWeight: 700, marginTop: 0 }}>{decision.title}</p>
          <p style={{ lineHeight: 1.7 }}>{decision.decisionText}</p>
          <p style={{ color: C.muted, marginBottom: 0 }}>
            Alternative: {decision.alternatives}
          </p>
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Hypothetical impact (if approved + CDSS agree)</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>
              Listing exclusions: {preview.current.listingExclusionsOffline.toLocaleString()} →{" "}
              {preview.hypotheticalIfPolicyApprovedAndCdssAgree.listingExclusionsRemaining}
            </li>
            <li>
              Otherwise-clear offline: {preview.current.otherwiseClearOffline.toLocaleString()} →{" "}
              {preview.hypotheticalIfPolicyApprovedAndCdssAgree.otherwiseClearOffline.toLocaleString()}
            </li>
            <li>
              Missing first dates still excluded:{" "}
              {preview.hypotheticalIfPolicyApprovedAndCdssAgree.missingFirstDateStillExcluded}
            </li>
            <li>
              Publication eligible: still{" "}
              {preview.hypotheticalIfPolicyApprovedAndCdssAgree.publicationEligible}
            </li>
          </ul>
          <p style={{ color: C.muted, marginBottom: 0 }}>
            {preview.hypotheticalIfPolicyApprovedAndCdssAgree.note}
          </p>
        </section>

        <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Remaining blockers</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {preview.remainingBlockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
