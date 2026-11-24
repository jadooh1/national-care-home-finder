import Link from "next/link";
import { buildCaliforniaEligibilityMappingActivationPreview } from "../../../lib/california-eligibility-mapping-activation";

const C = {
  navy: "#123c59",
  teal: "#176b53",
  pale: "#f4f8fb",
  muted: "#536b7c",
  border: "#dbe5eb",
  warn: "#8a4b08",
};

export default function CaliforniaEligibilityMappingActivationPage() {
  const preview = buildCaliforniaEligibilityMappingActivationPreview();
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
              href="/development/california-exclusion-ledger"
              style={{ color: C.teal, fontWeight: 600 }}
            >
              ← Exclusion ledger
            </Link>
            <Link
              href="/development/california-prepublication-cutover"
              style={{ color: C.teal, fontWeight: 600 }}
            >
              Prepublication cutover
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
              fontSize: "clamp(28px, 5vw, 46px)",
              lineHeight: 1.14,
              margin: "12px 0",
            }}
          >
            California eligibility mapping activation
          </h1>
          <p style={{ maxWidth: 820, lineHeight: 1.7, opacity: 0.95 }}>
            Observed {preview.observedOn}. Baseline {preview.baseline} (#214).
            Approved development-only application activation of Pending Increase
            eligibility mapping. Exclusion ledger stays ON. California stays
            unpublished with publication-eligible count zero.
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
            <strong>Activation arithmetic failed.</strong> Fail closed.
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
          <strong>Public: {preview.stopGoPublic}.</strong> Exclusions:{" "}
          {preview.controls.exclusionsActivated ? "ON (development)" : "OFF"}.
          Eligibility mapping:{" "}
          {preview.controls.eligibilityMappingActivated
            ? "ON (development)"
            : "OFF"}
          . Publication eligible: {preview.controls.publicationEligibleCount}.
          Cache: {preview.controls.cacheGeneration}. Pending Increase:{" "}
          {preview.pendingIncrease.listableInformational}/
          {preview.pendingIncrease.historicalTotal} listable;{" "}
          {preview.pendingIncrease.historicalOutOfScope} out-of-scope.
        </section>

        <section
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 18,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Before → after</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>
              exclusionsActivated: {String(preview.before.exclusionsActivated)} →{" "}
              {String(preview.after.exclusionsActivated)}
            </li>
            <li>
              eligibilityMappingActivated:{" "}
              {String(preview.before.eligibilityMappingActivated)} →{" "}
              {String(preview.after.eligibilityMappingActivated)}
            </li>
            <li>
              californiaPublished: {String(preview.before.californiaPublished)} →{" "}
              {String(preview.after.californiaPublished)}
            </li>
            <li>
              publicationEligibleCount:{" "}
              {preview.before.publicationEligibleCount} →{" "}
              {preview.after.publicationEligibleCount}
            </li>
            <li>
              Database writes:{" "}
              {preview.authorization.databaseWrites ? "yes" : "no"} (application
              level only)
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
          <h2 style={{ marginTop: 0 }}>Pending Increase reconciliation</h2>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>
            Source as-of {preview.source.adoptedAsOfIso}. Historical ledger 66 =
            {preview.pendingIncrease.listableInformational} listable RCFE/ARF
            informational flags + {preview.pendingIncrease.historicalOutOfScope}{" "}
            out-of-scope types (
            {preview.pendingIncrease.outOfScopeTypes.join(" / ")}). Live sample
            reconcile: {preview.liveReconciliation.filter((r) => r.listable).length}
            /8 listable exact ID + first-date + capacity agreement;{" "}
            {preview.liveReconciliation.filter((r) => !r.listable).length}/8
            out-of-scope confirmed.
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
          <h2 style={{ marginTop: 0 }}>Gate checks</h2>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>
            Residuals blocked: {preview.residualBlocked ? "yes" : "no"} (
            {preview.residualCount}). Truncation alias blocked:{" "}
            {preview.truncBlocked ? "yes" : "no"}. Sample mapping applied:{" "}
            {preview.mappingAppliedOnSample ? "yes" : "no"}. Capacity mismatch
            blocked: {preview.capacityMismatchBlocked ? "yes" : "no"}. Missing
            first date blocked: {preview.missingFirstBlocked ? "yes" : "no"}.
            Invalid ID blocked: {preview.invalidBlocked ? "yes" : "no"}.
            Out-of-scope blocked: {preview.outOfScopeBlocked ? "yes" : "no"}.
            Public surfaces blocked:{" "}
            {preview.publicSurfacesBlocked ? "yes" : "no"}. Publication
            selection blocked:{" "}
            {preview.publicationSelectionBlocked ? "yes" : "no"}.
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
          <h2 style={{ marginTop: 0 }}>Executable mapping rollback</h2>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>
            Reversible: {preview.rollback.reversible ? "yes" : "no"}. Database
            writes: {preview.rollback.databaseWrites ? "yes" : "no"}. Restores
            eligibilityMappingActivated=
            {String(preview.rollback.restoresControls.eligibilityMappingActivated)}{" "}
            while exclusionsActivated=
            {String(preview.rollback.restoresControls.exclusionsActivated)}.
          </p>
          <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {preview.rollback.steps.map((step) => (
              <li key={step.id}>
                <strong>{step.id}</strong> — {step.detail}
              </li>
            ))}
          </ol>
          <p style={{ marginBottom: 0, color: C.muted }}>
            {preview.mostActionableNextStep}
          </p>
        </section>
      </div>
    </main>
  );
}
