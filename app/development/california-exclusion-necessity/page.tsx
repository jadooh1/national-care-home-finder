import Link from "next/link";
import { buildCaliforniaExclusionActivationNecessityPreview } from "../../../lib/california-exclusion-activation-necessity";

const C = {
  navy: "#123c59",
  teal: "#176b53",
  pale: "#f4f8fb",
  muted: "#536b7c",
  border: "#dbe5eb",
  warn: "#8a4b08",
};

export default function CaliforniaExclusionActivationNecessityPage() {
  const preview = buildCaliforniaExclusionActivationNecessityPreview();
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
              href="/development/california-exclusion-activation"
              style={{ color: C.teal, fontWeight: 600 }}
            >
              ← Activation decision
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
            California exclusion activation necessity
          </h1>
          <p style={{ maxWidth: 820, lineHeight: 1.7, opacity: 0.95 }}>
            Observed {preview.observedOn}. Baseline {preview.baseline} (#208).
            Read-only sequencing decision. Not activated. California stays
            unpublished.
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
          <strong>Recommendation: {preview.finalRecommendation}.</strong>{" "}
          Current risk from inactive exclusions:{" "}
          {
            preview.recommendation
              .currentSecurityOrPublicationRiskFromInactiveExclusions
          }
          . Public: {preview.stopGoPublic}. Activation needed for launch prep:{" "}
          {preview.recommendation.activationNecessaryBeforeContinuingLaunchPrep
            ? "yes"
            : "no"}
          .
        </section>

        <section
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 18,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Why defer is safe now</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {preview.currentBlocks.map((block) => (
              <li key={block.id}>
                <strong>{block.id}</strong> ({block.surface}) — {block.evidence}
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
          <h2 style={{ marginTop: 0 }}>Safest sequence</h2>
          <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {preview.sequence.map((step) => (
              <li key={step.id}>
                <strong>{step.id}</strong> [{step.phase}
                {step.requiresExclusionActivation
                  ? "; requires exclusion activation"
                  : ""}
                ] — {step.detail}
              </li>
            ))}
          </ol>
        </section>

        <section
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 18,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Decision matrix</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {preview.matrix.map((row) => (
              <li key={row.area}>
                <strong>{row.title}</strong> — {row.status}
                {row.genuineApprovalDecision ? " (approval decision)" : ""}.{" "}
                {row.evidence}
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
