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
  buildCaliforniaTier1FullRosterPreview,
  californiaTier1FullRosterDetailPath,
  californiaTier1FullRosterListingPath,
} from "../../../lib/california-tier1-full-roster";

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
  searchParams: Promise<{
    q?: string;
    category?: string;
    city?: string;
    page?: string;
  }>;
};

export default async function CaliforniaDevelopmentDirectoryPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const publication = californiaDirectoryReady()
    ? "California is published."
    : "California is unpublished.";
  const coverage = buildCaliforniaDisclosureCoveragePrelaunchPreview();
  const pageNumber = Number(params.page) || 1;
  const roster = buildCaliforniaTier1FullRosterPreview({
    q: params.q,
    category: params.category,
    city: params.city,
    page: pageNumber,
  });
  const loadError = !coverage.arithmeticOk || !roster.arithmeticOk;

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
          <strong>Public: {coverage.stopGoPublic}.</strong> {publication} Prior
          offline Tier 1 candidates:{" "}
          {coverage.counts.offlineTier1Candidates.toLocaleString()}. Current
          listable development roster:{" "}
          {roster.search.listableCount.toLocaleString()}. Publication eligible:{" "}
          {coverage.counts.publicationEligible}. This page is development-only
          and does not publish California.
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
            Tier 1 development directory (statewide roster)
          </h2>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>
            {roster.search.scopeNote} Prior offline accounting was{" "}
            {roster.reconciliation.priorOfflineTier1.toLocaleString()} at as-of{" "}
            {roster.reconciliation.priorSourceAsOfIso}; current listable count is{" "}
            {roster.reconciliation.currentListable.toLocaleString()} (delta{" "}
            {roster.reconciliation.delta >= 0 ? "+" : ""}
            {roster.reconciliation.delta}) at as-of{" "}
            {roster.reconciliation.sourceAsOfIso}. Residual exclusions still
            blocked: {roster.reconciliation.residualStillPresent}. Detail pages
            stay under /development/california. Not a public directory.
          </p>
          <form
            method="get"
            role="search"
            aria-label="California development roster search"
            action={californiaTier1FullRosterListingPath()}
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              alignItems: "end",
              marginBottom: 18,
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Search</span>
              <input
                type="search"
                name="q"
                defaultValue={roster.search.query}
                placeholder="Name, license, city, or ZIP"
                autoComplete="off"
                style={fieldStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>City</span>
              <input
                type="search"
                name="city"
                defaultValue={roster.search.city}
                placeholder="City"
                autoComplete="off"
                style={fieldStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Category</span>
              <select
                name="category"
                defaultValue={roster.search.category}
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
              Search roster
            </button>
          </form>
          <p
            role="status"
            aria-live="polite"
            style={{ color: C.muted, marginTop: 0 }}
          >
            Showing page {roster.search.page} of {roster.search.pageCount} (
            {roster.search.results.length} on this page;{" "}
            {roster.search.total.toLocaleString()} matches of{" "}
            {roster.search.listableCount.toLocaleString()} listable).
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
            {roster.search.results.map((facility) => {
              const detailPath = californiaTier1FullRosterDetailPath(
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
                    Status {facility.downloadStatus}
                    {facility.pendingIncrease
                      ? " · Pending Increase flag (approved capacity only; mapping inactive)"
                      : ""}{" "}
                    · {facility.city ?? "—"}, {facility.postalCode ?? "—"} · License
                    first date {facility.licenseFirstDate || "—"} · Approved
                    licensed capacity{" "}
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
          {roster.search.total === 0 ? (
            <p style={{ color: C.muted, marginBottom: 0 }}>
              No roster matches. Invalid, residual-exclusion, and non-listable
              identifiers never appear here.
            </p>
          ) : null}
          {roster.search.pageCount > 1 ? (
            <nav
              aria-label="Roster pagination"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 18,
                alignItems: "center",
              }}
            >
              {roster.search.page > 1 ? (
                <Link
                  href={californiaTier1FullRosterListingPath({
                    q: roster.search.query,
                    category: roster.search.category,
                    city: roster.search.city,
                    page: roster.search.page - 1,
                  })}
                  style={{
                    color: C.teal,
                    fontWeight: 700,
                    minHeight: 44,
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  ← Previous
                </Link>
              ) : null}
              {roster.search.page < roster.search.pageCount ? (
                <Link
                  href={californiaTier1FullRosterListingPath({
                    q: roster.search.query,
                    category: roster.search.category,
                    city: roster.search.city,
                    page: roster.search.page + 1,
                  })}
                  style={{
                    color: C.teal,
                    fontWeight: 700,
                    minHeight: 44,
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  Next →
                </Link>
              ) : null}
            </nav>
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
            {roster.prepublicationChecklist.map((item) => (
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
