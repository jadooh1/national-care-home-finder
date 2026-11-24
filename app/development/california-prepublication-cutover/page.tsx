import Link from "next/link";
import { buildCaliforniaPrepublicationCutoverPreview } from "../../../lib/california-prepublication-cutover";

const C = {
  navy: "#123c59",
  teal: "#176b53",
  pale: "#f4f8fb",
  muted: "#536b7c",
  border: "#dbe5eb",
  warn: "#8a4b08",
};

export default function CaliforniaPrepublicationCutoverPage() {
  const preview = buildCaliforniaPrepublicationCutoverPreview();
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
              href="/development/california-exclusion-necessity"
              style={{ color: C.teal, fontWeight: 600 }}
            >
              Activation necessity
            </Link>
            <Link
              href="/development/california-exclusion-control"
              style={{ color: C.teal, fontWeight: 600 }}
            >
              Exclusion control
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
            California prepublication cutover controls
          </h1>
          <p style={{ maxWidth: 820, lineHeight: 1.7, opacity: 0.95 }}>
            Observed {preview.observedOn}. Baseline {preview.baseline} (#212).
            Functional publication-selection pipeline with inactive runtime
            controls. Dry-run activation and rollback only. California stays
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
            <strong>Cutover arithmetic failed.</strong> Fail closed.
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
          <strong>Public: {preview.stopGoPublic}.</strong> Runtime exclusions:{" "}
          {preview.defaults.exclusionsActivated ? "ON" : "OFF"}. Eligibility
          mapping:{" "}
          {preview.defaults.eligibilityMappingActivated ? "ON" : "OFF"}.
          Publication eligible: {preview.defaults.publicationEligibleCount}.
          Residual ledger size: {preview.residualCount}. Source as-of{" "}
          {preview.source.adoptedAsOfIso}.
        </section>

        <section
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 18,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Independent controls</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>
              <strong>{preview.decisions.exclusionActivation.id}</strong> —
              activated={String(preview.decisions.exclusionActivation.activated)}
              ; does not publish California.
            </li>
            <li>
              <strong>
                {preview.decisions.eligibilityMappingActivation.id}
              </strong>{" "}
              — activated=
              {String(preview.decisions.eligibilityMappingActivation.activated)}
              ; future-eligibility only.
            </li>
            <li>
              <strong>
                {preview.decisions.californiaPublicPublication.id}
              </strong>{" "}
              — activated=
              {String(preview.decisions.californiaPublicPublication.activated)};
              STOP until separate approval.
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
          <h2 style={{ marginTop: 0 }}>
            Dry-run activation (exclusion + mapping explored)
          </h2>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>
            activatedRuntime=
            {String(preview.activationAll.activatedRuntime)}. Residual blocked{" "}
            {preview.activationAll.residualEnforced.blocked}/
            {preview.activationAll.residualEnforced.total}. Selected under
            rehearsal: {preview.activationAll.selectedUnderRehearsal}. Defaults
            remain inactive after rehearsal.
          </p>
          <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {preview.activationAll.steps.map((step) => (
              <li key={step.id}>
                <strong>{step.id}</strong> [{step.status}] — {step.detail}
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
          <h2 style={{ marginTop: 0 }}>Dry-run rollback</h2>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>
            Surfaces fail closed:{" "}
            {preview.rollback.surfacesFailClosed ? "yes" : "no"}. Defaults
            unchanged: {preview.rollback.defaultsUnchanged ? "yes" : "no"}.
          </p>
          <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {preview.rollback.steps.map((step) => (
              <li key={step.id}>
                <strong>{step.id}</strong> [{step.status}] — {step.detail}
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
          <h2 style={{ marginTop: 0 }}>Selection fail-closed samples</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>
              Clear facility under defaults: selected=
              {String(preview.samples.clearDefault.selected)} (
              {preview.samples.clearDefault.reasons.join(", ")}).
            </li>
            <li>
              Stale source: selected=
              {String(preview.samples.staleBlocked.selected)} (
              {preview.samples.staleBlocked.reasons.join(", ")}).
            </li>
            <li>
              Unverified disclosure: selected=
              {String(preview.samples.unverifiedBlocked.selected)} (
              {preview.samples.unverifiedBlocked.reasons.join(", ")}).
            </li>
            <li>
              Pending Increase without mapping: selected=
              {String(preview.samples.pendingWithoutMapping.selected)} (
              {preview.samples.pendingWithoutMapping.reasons.join(", ")}).
            </li>
          </ul>
          <p style={{ marginBottom: 0, color: C.muted }}>
            {preview.mostActionableNextStep}
          </p>
        </section>
      </div>
    </main>
  );
}
