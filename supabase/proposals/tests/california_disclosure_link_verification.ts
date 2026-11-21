import assert from "node:assert/strict";
import test from "node:test";
import {
  CALIFORNIA_DISCLOSURE_BASELINE,
  CALIFORNIA_DISCLOSURE_COUNTS,
  CALIFORNIA_DISCLOSURE_DECISIONS_REQUIRING_APPROVAL,
  CALIFORNIA_DISCLOSURE_FALLBACK_PROPOSAL,
  CALIFORNIA_DISCLOSURE_OFFICIAL_URLS,
  CALIFORNIA_DISCLOSURE_SAMPLE_OBSERVATIONS,
  CALIFORNIA_DISCLOSURE_TIER1_POLICY_ASSESSMENT,
  buildCaliforniaDisclosureLinkVerificationPreview,
  californiaDisclosureLinkVerificationAllowsPublication,
  californiaOfficialFacilityDetailApiUrl,
  californiaOfficialFacilityDetailPageUrl,
  californiaOfficialFacilityReportDocumentUrl,
  californiaRefuseUnverifiedDisclosureUrl,
  isCaliforniaFakeoutReportPageUrl,
  isCaliforniaOfficialFacilityNumber,
} from "../../../lib/california-disclosure-link-verification.ts";

test("baseline #203; publication stays STOP", () => {
  assert.equal(CALIFORNIA_DISCLOSURE_BASELINE, "f524b66");
  assert.equal(californiaDisclosureLinkVerificationAllowsPublication(), false);
});

test("canonical FacDetail URL preserves leading zeros; refuses invalid IDs", () => {
  assert.equal(
    californiaOfficialFacilityDetailPageUrl("015601302"),
    `${CALIFORNIA_DISCLOSURE_OFFICIAL_URLS.facilityDetailPagePrefix}015601302`,
  );
  assert.equal(
    californiaOfficialFacilityDetailApiUrl("015601083"),
    `${CALIFORNIA_DISCLOSURE_OFFICIAL_URLS.facilityDetailApi}015601083`,
  );
  assert.equal(californiaOfficialFacilityDetailPageUrl("95354"), null);
  assert.equal(californiaOfficialFacilityDetailPageUrl(""), null);
  // 8-digit truncated form is syntactically valid as its own ID, but is NOT
  // accepted as the disclosure URL for the leading-zero canonical ID.
  assert.equal(
    californiaOfficialFacilityDetailPageUrl("15601302"),
    `${CALIFORNIA_DISCLOSURE_OFFICIAL_URLS.facilityDetailPagePrefix}15601302`,
  );
  assert.equal(
    californiaRefuseUnverifiedDisclosureUrl({
      facilityNumber: "015601302",
      candidateUrl: californiaOfficialFacilityDetailPageUrl("15601302"),
    }).accepted,
    false,
  );
  assert.equal(isCaliforniaOfficialFacilityNumber("015601302"), true);
  assert.equal(isCaliforniaOfficialFacilityNumber("95354"), false);
});

test("report document URL uses facNum+inx; refuses negative index", () => {
  assert.equal(
    californiaOfficialFacilityReportDocumentUrl("015601302", 0),
    `${CALIFORNIA_DISCLOSURE_OFFICIAL_URLS.facilityReportDocumentApi}?facNum=015601302&inx=0`,
  );
  assert.equal(californiaOfficialFacilityReportDocumentUrl("95354", 0), null);
  assert.equal(californiaOfficialFacilityReportDocumentUrl("100400070", -1), null);
});

test("fakeout REPORTPAGE URLs are refused", () => {
  assert.equal(
    isCaliforniaFakeoutReportPageUrl(
      "http://www.fakeout.gov/WebReports/FASWebReportDisplay.nsf/0/abc?OpenDocument",
    ),
    true,
  );
  const refused = californiaRefuseUnverifiedDisclosureUrl({
    facilityNumber: "100400070",
    candidateUrl:
      "http://www.fakeout.gov/WebReports/FASWebReportDisplay.nsf/0/abc?OpenDocument",
  });
  assert.equal(refused.accepted, false);
  assert.equal(refused.reason, "fakeout-reportpage-refused");
});

test("only exact canonical FacDetail rewrite is accepted as facility-specific disclosure", () => {
  const ok = californiaRefuseUnverifiedDisclosureUrl({
    facilityNumber: "015601302",
    candidateUrl: californiaOfficialFacilityDetailPageUrl("015601302"),
  });
  assert.equal(ok.accepted, true);

  const truncated = californiaRefuseUnverifiedDisclosureUrl({
    facilityNumber: "015601302",
    candidateUrl: californiaOfficialFacilityDetailPageUrl("15601302"),
  });
  assert.equal(truncated.accepted, false);
});

test("sample covers Pending Increase, exclusions, and leading zeros", () => {
  const roles = new Set(
    CALIFORNIA_DISCLOSURE_SAMPLE_OBSERVATIONS.map((r) => r.role),
  );
  assert.ok(roles.has("pending-increase"));
  assert.ok(roles.has("leading-zero-licensed"));
  assert.ok(roles.has("leading-zero-pending-increase"));
  assert.ok(roles.has("missing-first-date"));
  assert.ok(roles.has("provisional"));
  assert.ok(roles.has("prior-pending-incomplete"));
  assert.ok(roles.has("invalid-id"));

  const working = CALIFORNIA_DISCLOSURE_SAMPLE_OBSERVATIONS.filter(
    (r) => r.classification === "working-facility-specific",
  );
  assert.ok(working.every((r) => r.identifierExactMatch));
  assert.ok(working.every((r) => r.apiHttpStatus === 200));
  assert.equal(CALIFORNIA_DISCLOSURE_COUNTS.invalidRefused, 1);
});

test("fallback satisfies offline Tier 1 but not publication-acceptance alone", () => {
  assert.equal(
    CALIFORNIA_DISCLOSURE_TIER1_POLICY_ASSESSMENT.offlineTier1DisclosureRequired,
    false,
  );
  assert.equal(
    CALIFORNIA_DISCLOSURE_TIER1_POLICY_ASSESSMENT.fallbackSatisfiesOfflineTier1,
    true,
  );
  assert.equal(
    CALIFORNIA_DISCLOSURE_TIER1_POLICY_ASSESSMENT
      .fallbackSatisfiesPublicationAcceptanceFacilitySpecificLink,
    false,
  );
  assert.equal(
    CALIFORNIA_DISCLOSURE_TIER1_POLICY_ASSESSMENT
      .fallbackNeedsSeparateApprovalToReplaceFacilitySpecificPublicationLinks,
    true,
  );
  assert.equal(
    CALIFORNIA_DISCLOSURE_FALLBACK_PROPOSAL.doesNotInventFacilityUrls,
    true,
  );
  assert.equal(
    CALIFORNIA_DISCLOSURE_DECISIONS_REQUIRING_APPROVAL[0].id,
    "approve-cdss-search-fallback-as-sole-public-disclosure-link",
  );
});

test("preview arithmetic; public STOP", () => {
  const preview = buildCaliforniaDisclosureLinkVerificationPreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.stopGoPublic, "STOP");
  assert.equal(preview.allowsPublication, false);
  assert.equal(preview.counts.tier1OfflineEligible, 15429);
  assert.equal(preview.counts.publicationEligible, 0);
});
