import type { CSSProperties } from "react";
import Link from "next/link";
import {
  CALIFORNIA_ARF_ELIGIBLE_BY_STATUS,
  CALIFORNIA_ARF_LABEL,
  CALIFORNIA_EXCLUDED_RECORDS,
  CALIFORNIA_RAW_FILE_DATES,
  CALIFORNIA_RCFE_ELIGIBLE_BY_STATUS,
  CALIFORNIA_RCFE_LABEL,
  CALIFORNIA_STATUS_LABELS,
  CALIFORNIA_STATUS_ORDER,
  californiaDirectoryReady,
  californiaEligibleCount,
  californiaExcludedCount,
  countStatuses,
  type CaliforniaLicenseStatus,
} from "../../../lib/california-directory";
import {
  CALIFORNIA_COVERAGE_DIRECTORY_SAMPLES,
  CALIFORNIA_COVERAGE_DISCLOSURE_POLICY,
  CALIFORNIA_COVERAGE_FAIL_CLOSED_DEMO,
  CALIFORNIA_COVERAGE_OFFICIAL_URLS,
  buildCaliforniaDisclosureCoveragePrelaunchPreview,
} from "../../../lib/california-disclosure-coverage-prelaunch";
import {
  buildCaliforniaTier1DevDirectoryPreview,
  californiaTier1DevDetailPath,
  californiaTier1DevListingPath,
} from "../../../lib/california-tier1-dev-directory";

const C = {
  navy: "#123c59",
  teal: "#176b53",
  pale: "#f4f8fb",
  muted: "#536b7c",
  border: "#dbe5eb",
  warn: "#8a4b08",
};

const GROUPS = [
  {
    label: CALIFORNIA_RCFE_LABEL,
    counts: CALIFORNIA_RCFE_ELIGIBLE_BY_STATUS,
    rawFileDate: CALIFORNIA_RAW_FILE_DATES.rcfe,
  },
  {
    label: CALIFORNIA_ARF_LABEL,
    counts: CALIFORNIA_ARF_ELIGIBLE_BY_STATUS,
    rawFileDate: CALIFORNIA_RAW_FILE_DATES.arf,
  },
] as const;

const fieldStyle: CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  minWidth: 0,
  padding: "13px 14px",
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  fontSize: 16,
  background: "#fff",
  color: C.navy,
};

type PageProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

export default async function CaliforniaDevelopmentDirectoryPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const publication = californiaDirectoryReady()
    ? "California is published."
    : "California is unpublished.";
  const coverage = buildCaliforniaDisclosureCoveragePrelaunchPreview();
  const tier1 = buildCaliforniaTier1DevDirectoryPreview({
    q: params.q,
    category: params.category,
  });
  const loadError = !coverage.arithmeticOk || !tier1.arithmeticOk;

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
            alignItems: "center",
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
            <Link href="/" style={{ color: C.teal, fontWeight: 600 }}>
              ← All states
            </Link>
            <Link
              href="/development/california-disclosure-coverage"
              style={{ color: C.teal, fontWeight: 600 }}
            >
              Disclosure coverage
            </Link>
            <Link
              href="/development/california-publication-preflight"
              style={{ color: C.teal, fontWeight: 600 }}
            >
              Publication preflight
            </Link>
            <Link
              href="/development/california-exclusion-control"
              style={{ color: C.teal, fontWeight: 600 }}
            >
              Exclusion control
            </Link>
            <Link
              href="/development/california-exclusion-activation"
              style={{ color: C.teal, fontWeight: 600 }}
            >
              Exclusion activation
            </Link>
            <Link
              href="/development/california-exclusion-necessity"
              style={{ color: C.teal, fontWeight: 600 }}
            >
              Activation necessity →
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
            California licensing categories
          </h1>
          <p
            style={{
              maxWidth: 820,
              lineHeight: 1.7,
              fontSize: 16,
              opacity: 0.95,
            }}
          >
            {californiaEligibleCount().toLocaleString()} records are structurally
            eligible for a later directory. A structurally eligible record is not
            an active home and is not an available placement. Source as-of{" "}
            {coverage.download.adoptedAsOfIso}.
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
            <strong>Coverage arithmetic failed.</strong> Fail closed.
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
          <strong>Public: {coverage.stopGoPublic}.</strong> {publication} Offline
          Tier 1 candidates:{" "}
          {coverage.counts.offlineTier1Candidates.toLocaleString()}. Publication
          eligible: {coverage.counts.publicationEligible}. This page is
          development-only and does not publish California.
        </section>

        <section
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 18,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Approved disclosure policy</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>
              Facility-specific CDSS FacDetail links are approved for valid
              official facility numbers (leading zeros preserved).
            </li>
            <li>
              General Care Facility Search / Download Data links are supplemental
              attribution only
              {CALIFORNIA_COVERAGE_DISCLOSURE_POLICY.generalSearchLinksSupplementalOnly
                ? ""
                : " — policy mismatch"}
              .
            </li>
            <li>
              Inspection and complaint reports use{" "}
              <code>FacilityReports?facNum=&amp;inx=</code>. REPORTPAGE fakeout
              placeholders are never published.
            </li>
            <li>
              Supplemental search:{" "}
              <a
                href={CALIFORNIA_COVERAGE_OFFICIAL_URLS.careFacilitySearchHome}
                style={{ color: C.teal }}
              >
                CDSS Care Facility Search
              </a>
              {" · "}
              <a
                href={CALIFORNIA_COVERAGE_OFFICIAL_URLS.downloadDataPage}
                style={{ color: C.teal }}
              >
                Download Data
              </a>
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
            Tier 1 development directory (fixtures)
          </h2>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>
            {tier1.search.scopeNote} Search by name or exact license number.
            Detail pages stay under /development/california. Not a public
            directory.
          </p>
          <form
            method="get"
            action={californiaTier1DevListingPath()}
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              alignItems: "end",
              marginBottom: 18,
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Search</span>
              <input
                type="search"
                name="q"
                defaultValue={tier1.search.query}
                placeholder="Name or Facility Number"
                autoComplete="off"
                style={fieldStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Category</span>
              <select
                name="category"
                defaultValue={tier1.search.category}
                style={fieldStyle}
              >
                <option value="">All</option>
                <option value="RCFE">RCFE</option>
                <option value="ARF">ARF</option>
              </select>
            </label>
            <button
              type="submit"
              style={{
                minHeight: 48,
                border: "none",
                borderRadius: 10,
                background: C.teal,
                color: "#fff",
                fontWeight: 800,
                fontSize: 16,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Search fixtures
            </button>
          </form>
          <p
            role="status"
            aria-live="polite"
            style={{ color: C.muted, marginTop: 0 }}
          >
            Showing {tier1.search.total} of {tier1.scope.fixtureCount} development
            fixtures.
          </p>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gap: 14,
            }}
          >
            {tier1.search.results.map((facility) => {
              const detailPath = californiaTier1DevDetailPath(
                facility.facilityNumber,
              );
              return (
                <li
                  key={facility.facilityNumber}
                  style={{
                    borderTop: `1px solid ${C.border}`,
                    paddingTop: 12,
                  }}
                >
                  <h3 style={{ margin: "0 0 6px", fontSize: 17 }}>
                    {detailPath ? (
                      <Link
                        href={detailPath}
                        style={{ color: C.navy, textDecoration: "none" }}
                      >
                        {facility.facilityName}
                      </Link>
                    ) : (
                      facility.facilityName
                    )}
                  </h3>
                  <p
                    style={{
                      margin: "0 0 8px",
                      color: C.muted,
                      lineHeight: 1.6,
                    }}
                  >
                    {facility.category} · {facility.facilityType} · License{" "}
                    {facility.facilityNumber}
                    {facility.leadingZero ? " (leading zero preserved)" : ""} ·
                    Status {facility.apiStatus}
                    {facility.pendingIncrease
                      ? " · Pending Increase (approved capacity only)"
                      : ""}{" "}
                    · License first date {facility.licenseFirstDate ?? "—"} ·
                    Approved licensed capacity{" "}
                    {facility.approvedLicensedCapacity ?? "—"} · Source as-of{" "}
                    {facility.sourceAsOfIso}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 14,
                      alignItems: "center",
                    }}
                  >
                    {detailPath ? (
                      <Link
                        href={detailPath}
                        style={{
                          color: C.teal,
                          fontWeight: 700,
                          minHeight: 44,
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                      >
                        Development detail
                      </Link>
                    ) : null}
                    <a
                      href={facility.disclosureUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: C.teal,
                        fontWeight: 600,
                        minHeight: 44,
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      Official CDSS facility detail for {facility.facilityNumber}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
          {tier1.search.total === 0 ? (
            <p style={{ color: C.muted, marginBottom: 0 }}>
              No fixtures matched. Invalid, residual-exclusion, and non-fixture
              identifiers never appear here.
            </p>
          ) : null}
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
            Representative facilities (development sample)
          </h2>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>
            RCFE and ARF examples including Pending Increase and leading-zero
            IDs. Official CDSS detail links open in a new tab. Not a public
            directory.
          </p>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gap: 14,
            }}
          >
            {CALIFORNIA_COVERAGE_DIRECTORY_SAMPLES.map((facility) => (
              <li
                key={facility.facilityNumber}
                style={{
                  borderTop: `1px solid ${C.border}`,
                  paddingTop: 12,
                }}
              >
                <h3 style={{ margin: "0 0 6px", fontSize: 17 }}>
                  {facility.facilityName}
                </h3>
                <p style={{ margin: "0 0 8px", color: C.muted, lineHeight: 1.6 }}>
                  {facility.category} · {facility.facilityType} · License{" "}
                  {facility.facilityNumber}
                  {facility.leadingZero ? " (leading zero preserved)" : ""} ·
                  Status {facility.apiStatus}
                  {facility.pendingIncrease ? " · Pending Increase sample" : ""}{" "}
                  · License first date {facility.licenseFirstDate ?? "—"} ·
                  Capacity {facility.capacity ?? "—"} · Source as-of{" "}
                  {facility.sourceAsOfIso}
                </p>
                <a
                  href={facility.disclosureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: C.teal, fontWeight: 600 }}
                >
                  Official CDSS facility detail for {facility.facilityNumber}
                </a>
              </li>
            ))}
          </ul>
          <p style={{ marginBottom: 0, marginTop: 16, color: C.muted }}>
            Fail-closed demo: facility number{" "}
            {CALIFORNIA_COVERAGE_FAIL_CLOSED_DEMO.invalidFacilityNumber} produces
            no disclosure link (
            {CALIFORNIA_COVERAGE_FAIL_CLOSED_DEMO.reason}).
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
          <h2 style={{ marginTop: 0 }}>Prepublication integration checklist</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {tier1.prepublicationChecklist.map((item) => (
              <li key={item.id}>
                <strong>{item.id}</strong> —{" "}
                {item.completeInThisPr ? "done in this PR" : "still required later"}
                . {item.detail}
              </li>
            ))}
          </ul>
        </section>

        {GROUPS.map((group) => (
          <section
            key={group.label}
            style={{
              background: "#fff",
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: 18,
            }}
          >
            <h2 style={{ marginTop: 0 }}>{group.label}</h2>
            <p style={{ color: C.muted }}>
              {countStatuses(group.counts).toLocaleString()} structurally eligible
              records. The raw file date text is {group.rawFileDate}. That text is
              not an export date.
            </p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "grid",
                gap: 8,
              }}
            >
              {CALIFORNIA_STATUS_ORDER.map((status: CaliforniaLicenseStatus) => (
                <li key={status}>
                  {CALIFORNIA_STATUS_LABELS[status]}:{" "}
                  {group.counts[status].toLocaleString()}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 18,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Excluded records</h2>
          <p>
            {californiaExcludedCount().toLocaleString()} records stay in the
            validation report with their original values.
          </p>
          <ul>
            <li>
              Blank category:{" "}
              {CALIFORNIA_EXCLUDED_RECORDS.blankCategory.toLocaleString()}
            </li>
            <li>
              Other license category:{" "}
              {CALIFORNIA_EXCLUDED_RECORDS.otherLicenseCategory.toLocaleString()}
            </li>
            <li>
              Shifted row:{" "}
              {CALIFORNIA_EXCLUDED_RECORDS.shiftedRow.toLocaleString()}
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
