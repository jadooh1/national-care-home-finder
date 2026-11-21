import Link from "next/link";
import { buildCaliforniaExclusionControlReadinessPreview } from "../../../lib/california-exclusion-control-readiness";

const C = {
  navy: "#123c59",
  teal: "#176b53",
  pale: "#f4f8fb",
  muted: "#536b7c",
  border: "#dbe5eb",
  warn: "#8a4b08",
};

export default function CaliforniaExclusionControlPage() {
  const preview = buildCaliforniaExclusionControlReadinessPreview();
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
              href="/development/california-publication-preflight"
              style={{ color: C.teal, fontWeight: 600 }}
            >
              ← Publication preflight
            </Link>
            <Link
              href="/development/california"
              style={{ color: C.teal, fontWeight: 600 }}
            >
              California directory
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
            California exclusion-control readiness
          </h1>
          <p style={{ maxWidth: 820, lineHeight: 1.7, opacity: 0.95 }}>
            Observed {preview.observedOn}. Baseline {preview.baseline}. Read-only
            specification for {preview.counts.residualExclusions} residual
            exclusions. Not activated. California stays unpublished.
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
          <strong>Public: {preview.stopGoPublic}.</strong> Exclusion activation:{" "}
          {preview.stopGoExclusionActivation}. Residual exclusions:{" "}
          {preview.counts.residualExclusions}. Activated: no. Publication
          eligible: {preview.counts.publicationEligible}.
        </section>

        <section
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 18,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Three decisions kept separate</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>
              Exclusion ledger activation —{" "}
              {preview.decisionSeparation.exclusionActivation.id} (inactive)
            </li>
            <li>
              Eligibility-mapping activation —{" "}
              {preview.decisionSeparation.eligibilityMappingActivation.id}{" "}
              (inactive)
            </li>
            <li>
              California public publication —{" "}
              {preview.decisionSeparation.californiaPublicPublication.id}{" "}
              (inactive / STOP)
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
          <h2 style={{ marginTop: 0 }}>Residual exclusion buckets</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>
              Missing first-license date:{" "}
              {preview.counts.missingFirstLicenseDate}
            </li>
            <li>Provisional license: {preview.counts.provisionalLicense}</li>
            <li>Status conflict: {preview.counts.statusConflict}</li>
          </ul>
          <p style={{ color: C.muted, marginBottom: 0 }}>
            Exact IDs are enforced by fail-closed search / detail / API gates.
            Leading zeros preserved.
          </p>
        </section>

        <section
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 18,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Reversible activation plan</h2>
          <p style={{ color: C.muted }}>
            Not executed. Rollback retains audit rows and keeps surfaces fail-
            closed via unpublished / publicationEligible=0.
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {preview.activationPlan.steps.map((step) => (
              <li key={step.id}>
                <strong>{step.title}</strong> — {step.detail}
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
          <h2 style={{ marginTop: 0 }}>Approval-readiness matrix</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {preview.matrix.map((row) => (
              <li key={row.area}>
                <strong>{row.title}</strong> — {row.status}
                {row.genuineApprovalDecision ? " (approval decision)" : ""}.{" "}
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
