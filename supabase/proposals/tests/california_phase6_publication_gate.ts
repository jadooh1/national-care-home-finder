import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import {
  CALIFORNIA_PHASE6_EXCEPTION_IDS,
  CALIFORNIA_PHASE6_EXCEPTIONS,
  describeCaliforniaPhase6Exception,
} from "../../../lib/california-phase6-exceptions.ts";
import {
  CALIFORNIA_PHASE6_DOWNLOAD_OBSERVED,
  CALIFORNIA_PHASE6_FRESHNESS_REQUIREMENT,
  CALIFORNIA_PHASE6_OBSERVED_COUNTS,
  CALIFORNIA_PHASE6_PUBLICATION_BLOCKERS,
  CALIFORNIA_PHASE6_PUBLICATION_GATE,
  adoptCaliforniaPhase6AuthoritativeExportDate,
  californiaPhase6AllowsPublication,
  californiaPhase6FreshnessSatisfied,
  classifyCaliforniaPhase6Category,
  classifyCaliforniaPhase6DownloadStatus,
  evaluateCaliforniaPhase6PublicationGate,
  evaluateCaliforniaPhase6Row,
  normalizeCaliforniaPhase6FacilityType,
} from "../../../lib/california-phase6-publication-gate.ts";
import { parseCaliforniaTransparencyDownloadCsv } from "../../../lib/california-transparency-download.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-phase6-publication-gate",
);

function loadText(name: string): string {
  return readFileSync(join(fixtureDir, name), "utf8");
}

function loadJson<T>(name: string): T {
  return JSON.parse(loadText(name)) as T;
}

test("Phase 6 publication gate stays unpublished and blocks without ISO export date", () => {
  assert.equal(CALIFORNIA_PHASE6_PUBLICATION_GATE.publication, "unpublished");
  assert.equal(CALIFORNIA_PHASE6_PUBLICATION_GATE.ownerClaimEligible, false);
  assert.equal(CALIFORNIA_PHASE6_PUBLICATION_GATE.freshnessRequirementSatisfied, false);
  assert.equal(CALIFORNIA_PHASE6_PUBLICATION_GATE.reliableSourceAndDate, false);
  assert.equal(CALIFORNIA_PHASE6_PUBLICATION_GATE.capacityAndCoordinatesFromDownload, false);
  assert.equal(CALIFORNIA_PHASE6_FRESHNESS_REQUIREMENT.currentAuthoritativeIsoExportDate, null);
  assert.equal(CALIFORNIA_PHASE6_DOWNLOAD_OBSERVED.authoritativeIsoExportDate, null);
  assert.ok(CALIFORNIA_PHASE6_PUBLICATION_BLOCKERS.some(
    blocker => blocker.id === "no-authoritative-iso-export-date",
  ));
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.ok(
    directoryContract("Oregon")?.publication === "public"
    || directoryContract("Oregon")?.publication === "development",
  );
});

test("observed live counts match deterministic Phase 6 gate evaluation", () => {
  const observed = loadJson<{
    download: {
      rcfeRows: number;
      arfRows: number;
      rcfeSha256: string;
      arfSha256: string;
      authoritativeIsoExportDate: null;
      freshness: {
        httpLastModifiedPresent: boolean;
        csvBodyFileDateColumnPresent: boolean;
        facilityDetailExportTimestampPresent: boolean;
      };
    };
    totals: {
      activeCandidates: number;
      restrictedCandidates: number;
      publicationCandidatesIfGateOpened: number;
      excluded: number;
      exceptions: number;
      invalidIdentifiers: number;
      duplicateLicenseIds: number;
      missingAddresses: number;
      capacityMissingFromDownload: number;
      coordinatesMissingFromDownload: number;
    };
    gate: {
      publication: string;
      allowsPublication: boolean;
      freshnessSatisfied: boolean;
    };
  }>("observed-live-counts.json");

  assert.equal(observed.download.rcfeRows, CALIFORNIA_PHASE6_OBSERVED_COUNTS.rcfeRows);
  assert.equal(observed.download.arfRows, CALIFORNIA_PHASE6_OBSERVED_COUNTS.arfRows);
  assert.equal(observed.download.rcfeSha256, CALIFORNIA_PHASE6_DOWNLOAD_OBSERVED.rcfe.sha256);
  assert.equal(observed.download.arfSha256, CALIFORNIA_PHASE6_DOWNLOAD_OBSERVED.arf.sha256);
  assert.equal(observed.download.authoritativeIsoExportDate, null);
  assert.equal(observed.download.freshness.httpLastModifiedPresent, false);
  assert.equal(observed.download.freshness.csvBodyFileDateColumnPresent, false);
  assert.equal(observed.download.freshness.facilityDetailExportTimestampPresent, false);

  assert.equal(observed.totals.activeCandidates, 15413);
  assert.equal(observed.totals.restrictedCandidates, 38);
  assert.equal(observed.totals.publicationCandidatesIfGateOpened, 15451);
  assert.equal(observed.totals.excluded, 8921);
  assert.equal(observed.totals.exceptions, 5);
  assert.equal(observed.totals.invalidIdentifiers, 1);
  assert.equal(observed.totals.duplicateLicenseIds, 0);
  assert.equal(observed.totals.missingAddresses, 38);
  assert.equal(observed.totals.capacityMissingFromDownload, 24377);
  assert.equal(observed.totals.coordinatesMissingFromDownload, 24377);
  assert.equal(observed.gate.publication, "unpublished");
  assert.equal(observed.gate.allowsPublication, false);
  assert.equal(observed.gate.freshnessSatisfied, false);

  assert.equal(
    CALIFORNIA_PHASE6_OBSERVED_COUNTS.activeCandidates,
    observed.totals.activeCandidates,
  );
  assert.equal(
    CALIFORNIA_PHASE6_OBSERVED_COUNTS.restrictedCandidates,
    observed.totals.restrictedCandidates,
  );
});

test("freshness adoption rejects filename and CHHS stamps; requires official ISO", () => {
  assert.equal(
    adoptCaliforniaPhase6AuthoritativeExportDate("2026-11-15", {
      source: "download-filename-mmddyyyy",
    }),
    null,
  );
  assert.equal(
    adoptCaliforniaPhase6AuthoritativeExportDate("2025-05-25", {
      source: "chhs-file-date-text",
    }),
    null,
  );
  assert.equal(
    adoptCaliforniaPhase6AuthoritativeExportDate("2026-11-12", {
      source: "gis-data-last-edit",
    }),
    null,
  );
  assert.equal(
    adoptCaliforniaPhase6AuthoritativeExportDate("2026-11-15", {
      source: "official-iso-export-timestamp",
    }),
    "2026-11-15",
  );
  const blocked = californiaPhase6FreshnessSatisfied({
    authoritativeIsoExportDate: null,
    observedOn: "2026-11-19",
  });
  assert.equal(blocked.satisfied, false);
  assert.match(blocked.reason, /No authoritative ISO export date/);
});

test("status classification: LICENSED active, ON PROBATION restricted, PENDING/CLOSED ineligible", () => {
  assert.equal(classifyCaliforniaPhase6DownloadStatus("LICENSED"), "active-candidate");
  assert.equal(classifyCaliforniaPhase6DownloadStatus("ON PROBATION"), "restricted-candidate");
  assert.equal(classifyCaliforniaPhase6DownloadStatus("PENDING"), "pending-ineligible");
  assert.equal(classifyCaliforniaPhase6DownloadStatus("CLOSED"), "closed-ineligible");
  assert.equal(classifyCaliforniaPhase6DownloadStatus("UNKNOWN"), "unknown-ineligible");
});

test("category eligibility enforces RCFE/ARF aliases and excludes ADP/SRF/RCFCI/MFHV/blank", () => {
  assert.equal(
    normalizeCaliforniaPhase6FacilityType("RCFE-CCRC"),
    "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
  );
  assert.equal(
    normalizeCaliforniaPhase6FacilityType("EBSH-ARF"),
    "ENHANCED BEHAVIORAL SUPPORTS HOME - ARF",
  );
  assert.equal(
    normalizeCaliforniaPhase6FacilityType("ARFPSHN"),
    "ADULT RESIDENTIAL FACILITY FOR PERSONS WITH SPECIAL HEALTH CARE NEEDS",
  );
  assert.equal(
    normalizeCaliforniaPhase6FacilityType("CCH-ARF"),
    "COMMUNITY CRISIS HOME - ARF",
  );
  assert.equal(
    classifyCaliforniaPhase6Category("RCFE", "RESIDENTIAL CARE ELDERLY").eligibility,
    "eligible-rcfe",
  );
  assert.equal(
    classifyCaliforniaPhase6Category("RCFE", "RCFE-CCRC").eligibility,
    "eligible-rcfe",
  );
  assert.equal(
    classifyCaliforniaPhase6Category("ARF", "ADULT RESIDENTIAL").eligibility,
    "eligible-arf-family",
  );
  assert.equal(
    classifyCaliforniaPhase6Category("ARF", "EBSH-ARF").eligibility,
    "eligible-arf-family",
  );
  assert.equal(
    classifyCaliforniaPhase6Category("ARF", "ADULT DAY PROGRAM").eligibility,
    "out-of-scope",
  );
  assert.equal(
    classifyCaliforniaPhase6Category("ARF", "SOCIAL REHABILITATION FACILITY").eligibility,
    "out-of-scope",
  );
  assert.equal(
    classifyCaliforniaPhase6Category("ARF", "RESIDENTIAL FACILITY CHRONICALLY ILL").eligibility,
    "out-of-scope",
  );
  assert.equal(
    classifyCaliforniaPhase6Category("ARF", "MEDICAL FOSTER HOMES FOR VETERANS").eligibility,
    "out-of-scope",
  );
  assert.equal(
    classifyCaliforniaPhase6Category("RCFE", "").eligibility,
    "blank-type-ineligible",
  );
});

test("fixture roster evaluation produces candidates, exclusions, and exception outcomes", () => {
  const rcfeRows = parseCaliforniaTransparencyDownloadCsv(loadText("rcfe-gate-sample.csv"));
  const arfRows = parseCaliforniaTransparencyDownloadCsv(loadText("arf-gate-sample.csv"));
  const evaluation = evaluateCaliforniaPhase6PublicationGate({
    observedOn: "2026-11-19",
    rcfeRows,
    arfRows,
    exceptions: CALIFORNIA_PHASE6_EXCEPTIONS,
    authoritativeIsoExportDate: null,
  });

  assert.equal(evaluation.publication, "unpublished");
  assert.equal(evaluation.ownerClaimEligible, false);
  assert.equal(evaluation.allowsPublication, false);
  assert.equal(evaluation.freshness.satisfied, false);
  assert.equal(californiaPhase6AllowsPublication(evaluation), false);

  assert.ok(evaluation.rcfe.activeCandidates >= 2);
  assert.ok(evaluation.rcfe.restrictedCandidates >= 1);
  assert.ok(evaluation.arf.activeCandidates >= 4);
  assert.ok(evaluation.arf.restrictedCandidates >= 1);
  assert.ok(evaluation.totals.exceptions >= 5);
  assert.ok(evaluation.arf.invalidIdentifiers.includes("95354"));
  assert.ok(evaluation.arf.duplicateFacilityNumbers.includes("199999002"));
  assert.ok(evaluation.rcfe.exclusionReasons["missing-address"] >= 1);
  assert.equal(
    evaluation.totals.capacityMissingFromDownload,
    evaluation.totals.rowCount,
  );
  assert.equal(
    evaluation.totals.coordinatesMissingFromDownload,
    evaluation.totals.rowCount,
  );

  const missingAddr = evaluateCaliforniaPhase6Row(
    "RCFE",
    rcfeRows.find(row => row.facilityNumber === "199999001")!,
  );
  assert.equal(missingAddr.outcome, "excluded");
  assert.ok(missingAddr.exclusionReasons.includes("missing-address"));

  const licensedArf = evaluateCaliforniaPhase6Row(
    "ARF",
    arfRows.find(row => row.facilityNumber === "361800222")!,
    { exceptionsById: new Map(CALIFORNIA_PHASE6_EXCEPTIONS.map(e => [e.facilityNumber, e])) },
  );
  assert.equal(licensedArf.outcome, "active-candidate");
  assert.equal(licensedArf.publicationCandidate, false);
});

test("exceptional IDs are documented with FacilityDetail-backed classifications", () => {
  assert.deepEqual(
    [...CALIFORNIA_PHASE6_EXCEPTION_IDS],
    ["366401835", "374604731", "198601400", "306006749", "306006799", "95354"],
  );
  assert.equal(
    describeCaliforniaPhase6Exception("366401835")?.classification,
    "historical-data-defect",
  );
  assert.equal(
    describeCaliforniaPhase6Exception("374604731")?.gateImpact,
    "exclude-out-of-scope",
  );
  assert.equal(
    describeCaliforniaPhase6Exception("198601400")?.gateImpact,
    "exclude-ineligible-status",
  );
  assert.equal(
    describeCaliforniaPhase6Exception("306006749")?.liveStatus,
    "Application Withdrawn",
  );
  assert.equal(
    describeCaliforniaPhase6Exception("306006799")?.gateImpact,
    "exclude-withdrawn-mapping-gap",
  );
  assert.equal(
    describeCaliforniaPhase6Exception("95354")?.gateImpact,
    "exclude-invalid-id",
  );

  const arfRows = parseCaliforniaTransparencyDownloadCsv(loadText("arf-gate-sample.csv"));
  const byId = new Map(CALIFORNIA_PHASE6_EXCEPTIONS.map(e => [e.facilityNumber, e]));
  assert.equal(
    evaluateCaliforniaPhase6Row(
      "ARF",
      arfRows.find(row => row.facilityNumber === "366401835")!,
      { exceptionsById: byId },
    ).outcome,
    "active-candidate",
  );
  assert.equal(
    evaluateCaliforniaPhase6Row(
      "ARF",
      arfRows.find(row => row.facilityNumber === "374604731")!,
      { exceptionsById: byId },
    ).outcome,
    "exception",
  );
  assert.equal(
    evaluateCaliforniaPhase6Row(
      "ARF",
      arfRows.find(row => row.facilityNumber === "198601400")!,
      { exceptionsById: byId },
    ).outcome,
    "exception",
  );
  assert.equal(
    evaluateCaliforniaPhase6Row(
      "ARF",
      arfRows.find(row => row.facilityNumber === "95354")!,
      { exceptionsById: byId },
    ).outcome,
    "exception",
  );
});

test("readiness report fixture remains unpublished with blockers", () => {
  const readiness = loadJson<{
    publication: string;
    allowsPublication: boolean;
    freshness: { satisfied: boolean };
    totals: { publicationCandidatesIfGateOpened: number };
    blockers: { id: string }[];
  }>("readiness-report.json");
  assert.equal(readiness.publication, "unpublished");
  assert.equal(readiness.allowsPublication, false);
  assert.equal(readiness.freshness.satisfied, false);
  assert.equal(readiness.totals.publicationCandidatesIfGateOpened, 15451);
  assert.ok(readiness.blockers.some(b => b.id === "no-authoritative-iso-export-date"));
  assert.ok(
    readiness.blockers.some(b => b.id === "capacity-and-coordinates-absent-from-download"),
  );
});
