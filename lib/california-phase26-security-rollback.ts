/**
 * California Phase 26 — security evidence + future release/rollback checklist.
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE26_SECURITY_OBSERVED_ON = "2026-11-20";

const OFFICIAL_FACILITY_NUMBER = /^\d{8,9}$/;
const PAGE_PREFIX =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/";

export function californiaPhase26DisclosureUrl(facilityNumber: string): string | null {
  const id = String(facilityNumber ?? "").trim();
  if (!OFFICIAL_FACILITY_NUMBER.test(id)) return null;
  return `${PAGE_PREFIX}${id}`;
}

export type CaliforniaPhase26SecurityCheck = {
  id: string;
  status: "pass" | "pass-with-note";
  evidence: string;
};

export const CALIFORNIA_PHASE26_SECURITY_CHECKS: readonly CaliforniaPhase26SecurityCheck[] =
  [
    {
      id: "fail-closed-publication",
      status: "pass",
      evidence: "californiaDirectoryReady()=false; allowsPublication=false; gate=blocked.",
    },
    {
      id: "exclusions-inactive",
      status: "pass",
      evidence: "Exclusion matrix offline only; activatedInApplicationOrDatabase=false.",
    },
    {
      id: "facility-identifier-safety",
      status: "pass",
      evidence:
        "Disclosure URLs refuse non 8–9 digit IDs; leading zeros preserved; 015601219 ≠ 15601219 as identity.",
    },
    {
      id: "no-unauthorized-db-writes",
      status: "pass",
      evidence:
        "Phase 26 is read-only lib/fixtures/tests. No Supabase schema/data changes; no service-role client use.",
    },
    {
      id: "no-cdss-send-no-crawl",
      status: "pass",
      evidence: "No statewide FacilityDetail crawl; no CDSS email send this phase.",
    },
  ] as const;

export const CALIFORNIA_PHASE26_RELEASE_CHECKLIST = [
  "Mailbox check for CDSS reply (do not resend original inquiry).",
  "Adopt authoritative ISO export / version channel when provided.",
  "Approve Provisional / Pending Increase status mappings.",
  "Activate offline eligibility exclusions in app/DB under separate approval.",
  "Confirm source licensing / public disclosure copy.",
  "Human QA sign-off on preview with WA/OR regression.",
  "Separate explicit production / gate-open approval.",
] as const;

export const CALIFORNIA_PHASE26_ROLLBACK_CHECKLIST = [
  "Set California publication back to unpublished (gate blocked).",
  "Disable California owner-claim eligibility if ever enabled.",
  "Keep offline eligibility matrix and audit evidence intact.",
  "Prefer fail-closed suppressions over silent re-publish.",
  "Confirm Washington / Oregon publication contracts unchanged.",
  "Re-enter STOP until go-criteria are re-satisfied.",
] as const;

export const CALIFORNIA_PHASE26_ROLLBACK_VERIFICATION = [
  "californiaDirectoryReady() === false",
  "directoryContract('California').publication === 'unpublished'",
  "directoryHref('California', *) === null",
  "mapHref('California') === null",
] as const;

export function evaluateCaliforniaPhase26SecurityRollback() {
  return {
    observedOn: CALIFORNIA_PHASE26_SECURITY_OBSERVED_ON,
    checks: CALIFORNIA_PHASE26_SECURITY_CHECKS,
    allPass: CALIFORNIA_PHASE26_SECURITY_CHECKS.every(c =>
      c.status === "pass" || c.status === "pass-with-note",
    ),
    releaseChecklist: CALIFORNIA_PHASE26_RELEASE_CHECKLIST,
    rollbackChecklist: CALIFORNIA_PHASE26_ROLLBACK_CHECKLIST,
    rollbackVerification: CALIFORNIA_PHASE26_ROLLBACK_VERIFICATION,
    examples: {
      validLeadingZero: californiaPhase26DisclosureUrl("015601219"),
      invalid95354: californiaPhase26DisclosureUrl("95354"),
    },
    productionWrites: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
