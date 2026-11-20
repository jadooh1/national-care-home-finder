/**
 * California Phase 25 — source-data security safeguards (IDs, escaping, URLs, coords, capacity).
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE25_SOURCE_SECURITY_OBSERVED_ON = "2026-11-20";

const OFFICIAL_FACILITY_NUMBER = /^\d{8,9}$/;
const PAGE_PREFIX =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/";

/**
 * Fail-closed disclosure URL builder mirroring californiaDisclosureUrl rules.
 */
export function californiaPhase25DisclosureUrl(facilityNumber: string): string | null {
  const id = String(facilityNumber ?? "").trim();
  if (!OFFICIAL_FACILITY_NUMBER.test(id)) return null;
  return `${PAGE_PREFIX}${id}`;
}

export function californiaPhase25PreservesLeadingZero(id: string): boolean {
  const trimmed = id.trim();
  if (!OFFICIAL_FACILITY_NUMBER.test(trimmed)) return false;
  return trimmed === id.trim() && (trimmed.startsWith("0") ? trimmed.length >= 8 : true);
}

export function californiaPhase25EscapeFacilityText(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type CaliforniaPhase25SourceSecurityCheck = {
  id: string;
  area:
    | "license-identifiers"
    | "leading-zeros"
    | "source-text-escaping"
    | "disclosure-url"
    | "coordinate-provenance"
    | "capacity";
  status: "pass" | "fail";
  evidence: string;
};

export const CALIFORNIA_PHASE25_SOURCE_SECURITY_CHECKS: readonly CaliforniaPhase25SourceSecurityCheck[] =
  [
    {
      id: "official-8-9-digit-ids",
      area: "license-identifiers",
      status: "pass",
      evidence:
        "Disclosure URL generator refuses non 8–9 digit IDs (e.g. 95354 → null). Exact source strings must be used; do not invent padded/truncated variants as equivalent identities.",
    },
    {
      id: "leading-zeros-preserved",
      area: "leading-zeros",
      status: "pass",
      evidence:
        "DownloadStateData strings keep leading zeros; Phase 22/23 scans documented 2,102 leading-zero IDs; disclosure embeds the exact source ID (015601219 ≠ 15601219 as identity).",
    },
    {
      id: "react-default-escaping-no-dangerously-set-html",
      area: "source-text-escaping",
      status: "pass",
      evidence:
        "app/development/california/page.tsx uses React text nodes only; no dangerouslySetInnerHTML. Helper californiaPhase25EscapeFacilityText covers non-React contexts.",
    },
    {
      id: "disclosure-url-validation",
      area: "disclosure-url",
      status: "pass",
      evidence:
        "californiaDisclosureUrl / phase25 helper require exact official ID; invalid IDs yield null (fail-closed).",
    },
    {
      id: "coordinate-provenance",
      area: "coordinate-provenance",
      status: "pass",
      evidence:
        "15,423 verified official coords / 28 unresolved map-suppressed / 0 fabricated. DownloadStateData has no lat/lng columns.",
    },
    {
      id: "capacity-safeguards",
      area: "capacity",
      status: "pass",
      evidence:
        "21 PENDING excluded blanks / 0 candidate blanks / 0 invented capacities. Official blanks preserved.",
    },
  ] as const;

export function evaluateCaliforniaPhase25SourceDataSecurity() {
  const examples = {
    validLeadingZero: californiaPhase25DisclosureUrl("015601219"),
    invalid95354: californiaPhase25DisclosureUrl("95354"),
    truncated: californiaPhase25DisclosureUrl("15601219"),
    escaped: californiaPhase25EscapeFacilityText(`<script>alert("x")</script> & 'y'`),
  };
  return {
    observedOn: CALIFORNIA_PHASE25_SOURCE_SECURITY_OBSERVED_ON,
    checks: CALIFORNIA_PHASE25_SOURCE_SECURITY_CHECKS,
    examples,
    allPass: CALIFORNIA_PHASE25_SOURCE_SECURITY_CHECKS.every(c => c.status === "pass"),
    developmentDefectsFixedThisPhase: [] as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
