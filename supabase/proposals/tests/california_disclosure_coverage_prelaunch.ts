import assert from "node:assert/strict";
import test from "node:test";
import {
  CALIFORNIA_COVERAGE_BASELINE,
  CALIFORNIA_COVERAGE_DECISIONS_REQUIRING_APPROVAL,
  CALIFORNIA_COVERAGE_DIRECTORY_SAMPLES,
  CALIFORNIA_COVERAGE_DISCLOSURE_POLICY,
  CALIFORNIA_COVERAGE_FAIL_CLOSED_DEMO,
  CALIFORNIA_COVERAGE_LINK_CLASSES,
  CALIFORNIA_COVERAGE_METHODOLOGY,
  CALIFORNIA_COVERAGE_OFFICIAL_URLS,
  CALIFORNIA_COVERAGE_PRELAUNCH_ASSESSMENT,
  CALIFORNIA_COVERAGE_SAMPLE_OBSERVATIONS,
  CALIFORNIA_COVERAGE_SAMPLE_SUMMARY,
  CALIFORNIA_COVERAGE_TIER1_COUNTS,
  buildCaliforniaDisclosureCoveragePrelaunchPreview,
  californiaCoverageFacilityDetailPageUrl,
  californiaCoverageGeneratorCoversTier1Id,
  californiaCoverageRefuseUnverifiedLink,
  californiaCoverageReportDocumentUrl,
  californiaDisclosureCoverageAllowsPublication,
  californiaDisclosureCoverageDirectoryReady,
  isCaliforniaCoverageFakeoutReportPageUrl,
  isCaliforniaCoverageFacilityNumber,
} from "../../../lib/california-disclosure-coverage-prelaunch.ts";

test("baseline #204; publication and directory stay STOP", () => {
  assert.equal(CALIFORNIA_COVERAGE_BASELINE, "b4e19bd");
  assert.equal(californiaDisclosureCoverageAllowsPublication(), false);
  assert.equal(californiaDisclosureCoverageDirectoryReady(), false);
});

test("approved disclosure policy: FacDetail primary; search supplemental", () => {
  assert.equal(
    CALIFORNIA_COVERAGE_DISCLOSURE_POLICY.facilitySpecificFacDetailApproved,
    true,
  );
  assert.equal(
    CALIFORNIA_COVERAGE_DISCLOSURE_POLICY.generalSearchLinksSupplementalOnly,
    true,
  );
  assert.equal(
    CALIFORNIA_COVERAGE_DISCLOSURE_POLICY.reportPageFakeoutNeverPublish,
    true,
  );
  assert.equal(
    CALIFORNIA_COVERAGE_DISCLOSURE_POLICY
      .publicationAcceptanceRequiresFacilitySpecificFacDetail,
    true,
  );
  assert.equal(
    CALIFORNIA_COVERAGE_DISCLOSURE_POLICY.offlineTier1DisclosureRequired,
    false,
  );
});

test("canonical FacDetail preserves leading zeros; refuses invalid IDs", () => {
  assert.equal(
    californiaCoverageFacilityDetailPageUrl("079201384"),
    `${CALIFORNIA_COVERAGE_OFFICIAL_URLS.facilityDetailPagePrefix}079201384`,
  );
  assert.equal(californiaCoverageFacilityDetailPageUrl("95354"), null);
  assert.equal(isCaliforniaCoverageFacilityNumber("015601083"), true);
  assert.equal(isCaliforniaCoverageFacilityNumber("95354"), false);

  const truncated = californiaCoverageRefuseUnverifiedLink({
    facilityNumber: "015601083",
    candidateUrl: californiaCoverageFacilityDetailPageUrl("15601083"),
  });
  assert.equal(truncated.accepted, false);
  assert.equal(truncated.reason, "candidate-not-canonical-facdetail-rewrite");

  const gen = californiaCoverageGeneratorCoversTier1Id("079201384");
  assert.equal(gen.covered, true);
  assert.equal(gen.leadingZerosPreserved, true);
});

test("distinguishes facility detail from inspection/complaint documents", () => {
  assert.equal(
    CALIFORNIA_COVERAGE_LINK_CLASSES.facilityDetail.kind,
    "facility-specific-detail",
  );
  assert.equal(
    CALIFORNIA_COVERAGE_LINK_CLASSES.inspectionOrComplaintDocument
      .distinctFromFacilityDetail,
    true,
  );
  assert.equal(
    CALIFORNIA_COVERAGE_LINK_CLASSES.reportPagePlaceholder.neverPublish,
    true,
  );
  assert.equal(
    californiaCoverageReportDocumentUrl("079201384", 0),
    `${CALIFORNIA_COVERAGE_OFFICIAL_URLS.facilityReportDocumentApi}?facNum=079201384&inx=0`,
  );

  const reportOk = californiaCoverageRefuseUnverifiedLink({
    facilityNumber: "079201384",
    linkClass: "report-document",
    candidateUrl: californiaCoverageReportDocumentUrl("079201384", 0),
  });
  assert.equal(reportOk.accepted, true);
});

test("refuses fakeout REPORTPAGE and search-fallback as facility-specific", () => {
  assert.equal(
    isCaliforniaCoverageFakeoutReportPageUrl(
      "http://www.fakeout.gov/WebReports/FASWebReportDisplay.nsf/0/abc?OpenDocument",
    ),
    true,
  );
  const fakeout = californiaCoverageRefuseUnverifiedLink({
    facilityNumber: "079201384",
    candidateUrl:
      "http://www.fakeout.gov/WebReports/FASWebReportDisplay.nsf/0/abc?OpenDocument",
  });
  assert.equal(fakeout.accepted, false);
  assert.equal(fakeout.reason, "fakeout-reportpage-refused");

  const search = californiaCoverageRefuseUnverifiedLink({
    facilityNumber: "079201384",
    linkClass: "search-fallback",
    candidateUrl: CALIFORNIA_COVERAGE_OFFICIAL_URLS.careFacilitySearchHome,
  });
  assert.equal(search.accepted, false);
  assert.equal(
    search.reason,
    "search-fallback-not-facility-specific-disclosure",
  );

  assert.equal(CALIFORNIA_COVERAGE_FAIL_CLOSED_DEMO.disclosureUrl, null);
});

test("stratified live sample: 44/44 working with Pending Increase and leading zeros", () => {
  assert.equal(CALIFORNIA_COVERAGE_SAMPLE_OBSERVATIONS.length, 44);
  assert.equal(CALIFORNIA_COVERAGE_SAMPLE_SUMMARY.workingFacilitySpecific, 44);
  assert.equal(CALIFORNIA_COVERAGE_SAMPLE_SUMMARY.fail, 0);
  assert.ok(CALIFORNIA_COVERAGE_SAMPLE_SUMMARY.pendingIncreaseWorking >= 10);
  assert.ok(CALIFORNIA_COVERAGE_SAMPLE_SUMMARY.leadingZeroWorking >= 10);
  assert.equal(
    CALIFORNIA_COVERAGE_SAMPLE_SUMMARY.reportDocumentsContainId,
    CALIFORNIA_COVERAGE_SAMPLE_SUMMARY.reportDocumentsChecked,
  );
  assert.equal(
    CALIFORNIA_COVERAGE_SAMPLE_SUMMARY.reportPageAlwaysFakeoutWhenPresent,
    true,
  );
  assert.ok(
    CALIFORNIA_COVERAGE_SAMPLE_OBSERVATIONS.every(
      (r) =>
        r.identifierExactMatch
        && r.classification === "working-facility-specific",
    ),
  );
  assert.ok(
    CALIFORNIA_COVERAGE_SAMPLE_OBSERVATIONS.some((r) => r.downloadFile === "RCFE"),
  );
  assert.ok(
    CALIFORNIA_COVERAGE_SAMPLE_OBSERVATIONS.some((r) => r.downloadFile === "ARF"),
  );
});

test("methodology is rate-limited; full 15429 crawl not claimed", () => {
  assert.equal(
    CALIFORNIA_COVERAGE_METHODOLOGY.fullLiveCrawlOf15429NotRunThisSession,
    true,
  );
  assert.equal(CALIFORNIA_COVERAGE_METHODOLOGY.rateLimitMsBetweenRequests, 400);
  assert.equal(CALIFORNIA_COVERAGE_METHODOLOGY.components.length, 3);
  assert.equal(
    CALIFORNIA_COVERAGE_METHODOLOGY.components[0].coveragePercent,
    100,
  );
});

test("directory samples include RCFE, ARF, and Pending Increase", () => {
  assert.ok(CALIFORNIA_COVERAGE_DIRECTORY_SAMPLES.length >= 6);
  assert.ok(
    CALIFORNIA_COVERAGE_DIRECTORY_SAMPLES.some((r) => r.category === "RCFE"),
  );
  assert.ok(
    CALIFORNIA_COVERAGE_DIRECTORY_SAMPLES.some((r) => r.category === "ARF"),
  );
  assert.ok(
    CALIFORNIA_COVERAGE_DIRECTORY_SAMPLES.some((r) => r.pendingIncrease),
  );
  assert.ok(
    CALIFORNIA_COVERAGE_DIRECTORY_SAMPLES.every(
      (r) =>
        r.disclosureUrl
        === `${CALIFORNIA_COVERAGE_OFFICIAL_URLS.facilityDetailPagePrefix}${r.facilityNumber}`
        && r.sourceAsOfIso === "2026-11-15",
    ),
  );
});

test("prelaunch assessment: public STOP; coverage CONDITIONAL; blockers listed", () => {
  const preview = buildCaliforniaDisclosureCoveragePrelaunchPreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.stopGoPublic, "STOP");
  assert.equal(preview.stopGoDisclosureCoverage, "CONDITIONAL");
  assert.equal(preview.allowsPublication, false);
  assert.equal(preview.counts.offlineTier1Candidates, 15429);
  assert.equal(preview.counts.publicationEligible, 0);
  assert.ok(preview.assessmentStop >= 1);
  assert.ok(
    CALIFORNIA_COVERAGE_PRELAUNCH_ASSESSMENT.some(
      (r) => r.area === "publication-gate" && r.stopGo === "STOP",
    ),
  );
  assert.ok(
    CALIFORNIA_COVERAGE_DECISIONS_REQUIRING_APPROVAL.some(
      (d) => d.id === "approve-california-statewide-public-publication",
    ),
  );
  assert.ok(
    preview.remainingBlockers.includes("california-publication-blocked"),
  );
  assert.equal(CALIFORNIA_COVERAGE_TIER1_COUNTS.exclusionsActivated, false);
});
