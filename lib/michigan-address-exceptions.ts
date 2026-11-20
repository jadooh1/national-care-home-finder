/**
 * Michigan address-exception ledger (development-only).
 * Does not invent physical addresses or promote supplemental/mailing fields.
 * Intentionally free of sibling runtime imports.
 */

export const MICHIGAN_ADDRESS_EXCEPTION_OBSERVED_ON = "2026-11-20";

export const MICHIGAN_ADDRESS_CAPTURE = {
  rows: 4476,
  streetBlank: 4419,
  streetLetterAndDigit: 57,
  usablePhysicalStreetRows: 57,
  unresolvedBlankStreetRows: 4419,
  publicationEligibleRows: 0,
  supplementalEqualsLicenseeAddressPrior: 904,
  streetEqualsLicenseeAddressPrior: 4,
  addressInterpretation: "unresolved" as const,
  supplementalRole: null,
} as const;

export type MichiganAddressExceptionClass =
  | "blank-street-unresolved"
  | "usable-street-but-blocked";

export type MichiganAddressProfileSample = {
  license: string;
  kind: "blank-street" | "street-text" | "xh-exempt";
  httpStatus: 200;
  addressLabel: "Address:";
  physicalOrMailingLabelPresent: false;
  evidence: string;
};

/**
 * Representative FacilityProfile samples from this investigation.
 * Profiles show a single "Address:" label; they do not define supplemental as physical.
 */
export const MICHIGAN_ADDRESS_PROFILE_SAMPLES: readonly MichiganAddressProfileSample[] = [
  {
    license: "AM410008657",
    kind: "blank-street",
    httpStatus: 200,
    addressLabel: "Address:",
    physicalOrMailingLabelPresent: false,
    evidence:
      "Blank official Street column; profile displays supplemental-looking text under unlabeled Address:. Not adopted as physical.",
  },
  {
    license: "AM410079586",
    kind: "blank-street",
    httpStatus: 200,
    addressLabel: "Address:",
    physicalOrMailingLabelPresent: false,
    evidence: "Same unlabeled Address: pattern on blank-street row.",
  },
  {
    license: "AS790309069",
    kind: "blank-street",
    httpStatus: 200,
    addressLabel: "Address:",
    physicalOrMailingLabelPresent: false,
    evidence: "Same unlabeled Address: pattern on blank-street row.",
  },
  {
    license: "AS810405904",
    kind: "street-text",
    httpStatus: 200,
    addressLabel: "Address:",
    physicalOrMailingLabelPresent: false,
    evidence: "Official Street already had letter+digit text; profile still uses unlabeled Address:.",
  },
  {
    license: "XH220394302",
    kind: "xh-exempt",
    httpStatus: 200,
    addressLabel: "Address:",
    physicalOrMailingLabelPresent: false,
    evidence: "XH/EXEMPT profile reachable; address display does not authorize publication.",
  },
] as const;

export const MICHIGAN_STREET_TEXT_BY_TYPE_CURRENT = {
  AF: 6,
  AS: 17,
  AM: 7,
  AL: 19,
  AG: 0,
  AI: 0,
  AH: 6,
  XH: 2,
} as const;

export function summarizeMichiganAddressExceptions() {
  const streetTextSum = (Object.values(MICHIGAN_STREET_TEXT_BY_TYPE_CURRENT) as number[]).reduce(
    (a, b) => a + b,
    0,
  );
  return {
    blankStreetRows: MICHIGAN_ADDRESS_CAPTURE.streetBlank,
    usableStreetRows: MICHIGAN_ADDRESS_CAPTURE.streetLetterAndDigit,
    streetTextByTypeSum: streetTextSum,
    residualOk:
      MICHIGAN_ADDRESS_CAPTURE.streetBlank + MICHIGAN_ADDRESS_CAPTURE.streetLetterAndDigit
      === MICHIGAN_ADDRESS_CAPTURE.rows,
    streetTextMatches57: streetTextSum === 57,
    supplementalAdoptedAsPhysical: false as const,
    mailingAdoptedAsPhysical: false as const,
    profileDefinesPhysicalVsMailing: false as const,
    publicationEligibleRows: 0 as const,
  };
}

export function evaluateMichiganAddressExceptions() {
  return {
    observedOn: MICHIGAN_ADDRESS_EXCEPTION_OBSERVED_ON,
    capture: MICHIGAN_ADDRESS_CAPTURE,
    profileSamples: MICHIGAN_ADDRESS_PROFILE_SAMPLES,
    streetTextByType: MICHIGAN_STREET_TEXT_BY_TYPE_CURRENT,
    summary: summarizeMichiganAddressExceptions(),
    policy:
      "Blank Street rows stay unresolved. Supplemental / licensee / profile Address: text is not substituted as physical without an authoritative field definition.",
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
