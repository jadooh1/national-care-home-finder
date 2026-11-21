import Link from "next/link";
import { buildCaliforniaTier1PublicationPreflightPreview } from "../../../lib/california-tier1-publication-preflight";

const C = {
  navy: "#123c59",
  teal: "#176b53",
  pale: "#f4f8fb",
  muted: "#536b7c",
  border: "#dbe5eb",
  warn: "#8a4b08",
};

export default function CaliforniaPublicationPreflightPage() {
  const preview = buildCaliforniaTier1PublicationPreflightPreview();
  const loadError = !preview.arithmeticOk;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: C.pale,
        color: C.navy,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          background: "#fff",
          borderBottom: `1px solid ${C.border}`,
          padding: "16px 5%",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "auto",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <strong style={{ fontSize: 19 }}>National Care Home Finder</strong>
          <nav
            aria-label="Development navigation"
            style={{ display: "flex", gap: 16, flexWrap: "wrap" }}
          >
            <Link
              href="/development/california"
              style={{ color: C.teal, fontWeight: 600 }}
            >
              ← California directory
            </Link>
            <Link
              href="/development/california-disclosure-coverage"
              style={{ color: C.teal, fontWeight: 600 }}
            >
              Disclosure coverage
            </Link>
          </nav>
        </div>
      </header>

      <section
        style={{
          background: `linear-gradient(125deg, ${C.navy}, ${C.teal})`,
          color: "white",
          padding: "clamp(28px, 6vw, 48px) 5%",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "auto" }}>
          <p style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>
            UNPUBLISHED DEVELOPMENT REVIEW
          </p>
          <h1
            style={{
              fontSize: "clamp(26px, 5vw, 44px)",
              lineHeight: 1.14,
              margin: "12px 0",
            }}
          >
            California publication preflight
          </h1>
          <p style={{ maxWidth: 820, lineHeight: 1.7, opacity: 0.95 }}>
            Observed {preview.observedOn}. Baseline {preview.baseline}. Read-only
            eligibility and publication-readiness check. Source as-of{" "}
            {preview.source.adoptedAsOfIso}. California stays unpublished.
          </p>
        </div>
      </section>

      <div
        style={{
          maxWidth: 1100,
          margin: "auto",
          padding: "28px 5% 60px",
          display: "grid",
          gap: 18,
        }}
      >
        {loadError ? (
          <section
            role="alert"
            style={{
              background: "#fdecec",
              border: "1px solid #f0b4b4",
              borderRadius: 12,
              padding: 18,
              color: "#8b1e1e",
            }}
          >
            <strong>Arithmetic failed.</strong> Fail closed.
          </section>
        ) : null}

        <section
          role="status"
          style={{
            background: "#fff7e8",
            border: "1px solid #f0d2a0",
            borderRadius: 12,
            padding: 18,
            color: C.warn,
          }}
        >
          <strong>Public: {preview.stopGoPublic}.</strong> Eligibility accounting:{" "}
          {preview.stopGoEligibilityAccounting}. Offline Tier 1:{" "}
          {preview.reconciliation.offlineTier1Candidates.toLocaleString()}.
          Exclusions: {preview.reconciliation.remainingListingExclusions}.
          Publication eligible: {preview.reconciliation.publicationEligible}.
        </section>

        <section
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 18,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Why eligibility is CONDITIONAL</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {preview.conditionalReasons.map((reason) => (
              <li key={reason.id}>{reason.detail}</li>
            ))}
          </ul>
        </section>

        <section
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 18,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Reconciled counts</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>
              Otherwise-clear pre-approval:{" "}
              {preview.reconciliation.otherwiseClearOfflinePreApproval.toLocaleString()}
            </li>
            <li>
              Pending Increase future-eligible:{" "}
              {preview.reconciliation.pendingIncreaseFutureEligibleUnderApprovedMapping}
            </li>
            <li>
              Offline Tier 1:{" "}
              {preview.reconciliation.offlineTier1Candidates.toLocaleString()}
            </li>
            <li>
              Residual exclusions:{" "}
              {preview.reconciliation.remainingListingExclusions} (missing first
              date {preview.reconciliation.exclusionBuckets.missingFirstDate} ·
              provisional {preview.reconciliation.exclusionBuckets.provisional} ·
              prior conflict {preview.reconciliation.exclusionBuckets.priorConflict})
            </li>
            <li>
              Parent active-restricted roster:{" "}
              {preview.reconciliation.parentActiveRestrictedRoster.toLocaleString()}
            </li>
          </ul>
        </section>

        <section
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 18,
          }}
        >
          <h2 style={{ marginTop: 0 }}>GO / CONDITIONAL / STOP matrix</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {preview.matrix.map((row) => (
              <li key={row.area}>
                <strong>{row.title}</strong> — {row.status}
                {row.genuineLaunchDecision ? " (launch decision)" : ""}.{" "}
                {row.evidence}
              </li>
            ))}
          </ul>
        </section>

        <section
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 18,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Decisions requiring approval</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {preview.decisionsRequiringApproval.map((decision) => (
              <li key={decision.id}>
                <strong>{decision.title}</strong> — Recommendation:{" "}
                {decision.recommendation}
              </li>
            ))}
          </ul>
          <p style={{ marginBottom: 0, color: C.muted }}>
            {preview.mostActionableNextStep}
          </p>
        </section>
      </div>
    </main>
  );
}
