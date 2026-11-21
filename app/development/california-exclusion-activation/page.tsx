import Link from "next/link";
import { buildCaliforniaExclusionActivationDecisionPreview } from "../../../lib/california-exclusion-activation-decision";

const C = {
  navy: "#123c59",
  teal: "#176b53",
  pale: "#f4f8fb",
  muted: "#536b7c",
  border: "#dbe5eb",
  warn: "#8a4b08",
};

export default function CaliforniaExclusionActivationDecisionPage() {
  const preview = buildCaliforniaExclusionActivationDecisionPreview();
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
              href="/development/california-exclusion-control"
              style={{ color: C.teal, fontWeight: 600 }}
            >
              ← Exclusion-control readiness
            </Link>
            <Link
              href="/development/california-exclusion-necessity"
              style={{ color: C.teal, fontWeight: 600 }}
            >
              Activation necessity →
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
            California exclusion-control activation decision
          </h1>
          <p style={{ maxWidth: 820, lineHeight: 1.7, opacity: 0.95 }}>
            Observed {preview.observedOn}. Baseline {preview.baseline} (#207).
            Read-only activation decision audit. Not activated. California stays
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
          Exclusion readiness: {preview.stopGoExclusionActivationReadiness}.
          Public: {preview.stopGoPublic}. Activated: no. Publication eligible:{" "}
          {preview.source.publicationEligible}.
        </section>

        <section
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 18,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Verified evidence</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>
              Live FacilityDetail: {preview.liveVerification.length}/22 exact ID
              matches
            </li>
            <li>
              Buckets: {preview.bucketCounts.missingFirstLicenseDate} missing
              first date + {preview.bucketCounts.provisionalLicense} provisional
              + {preview.bucketCounts.statusConflict} status conflict
            </li>
            <li>
              Truncation aliases blocked:{" "}
              {preview.truncationProbes
                .map((p) => `${p.requestId}→${p.canonicalId}`)
                .join(", ")}
            </li>
            <li>
              Offline activation/rollback rehearsed with no database writes
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
          <h2 style={{ marginTop: 0 }}>Three decisions kept separate</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>
              Exclusion ledger activation —{" "}
              {preview.decisionSeparation.exclusionActivation.id} (inactive;
              readiness GO)
            </li>
            <li>
              Eligibility-mapping activation —{" "}
              {preview.decisionSeparation.eligibilityMappingActivation.id}{" "}
              (inactive; separate)
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
        </section>

        <section
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 18,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Remaining risks</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {preview.remainingRisks.map((risk) => (
              <li key={risk.id}>
                <strong>{risk.id}</strong> ({risk.severity}) — {risk.detail}
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
