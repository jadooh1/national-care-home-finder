/**
 * Pennsylvania address-exception ledger (development-only).
 * Preserves official source street / street-additional values.
 * Does not invent or infer house numbers. Intentionally free of sibling imports.
 *
 * Re-verified 2026-11-26: Download CSV byte-identical to the 989-row audit
 * (sha256 c9172269…). All 13 letter-only streets remain present and are
 * deterministically excluded from publication eligibility.
 */

export const PENNSYLVANIA_ADDRESS_EXCEPTION_OBSERVED_ON = "2026-11-26";

export const PENNSYLVANIA_ADDRESS_SOURCE_CAPTURE = {
  sourceUrl: "https://data.pa.gov/api/views/pqf4-d4xn/rows.csv?accessType=DOWNLOAD",
  datasetUrl:
    "https://data.pa.gov/Services-Near-You/Licensed-Personal-Care-Homes-Current-Statewide-Hum/pqf4-d4xn",
  rows: 989,
  usableStreetRows: 976,
  letterOnlyStreetRows: 13,
  letterOnlyWithAdditionalText: 6,
  letterOnlyNamedStreetWithoutNumber: 7,
  sha256: "c91722696b1accbe778f25189fc727e5bd55f5028bac3d529c54d3e8e8192973",
  bytes: 227204,
  originalFieldsRewritten: false as const,
  /** Content unchanged vs 2026-11-20 investigation capture. */
  contentUnchangedSincePriorAudit: true as const,
} as const;

export type PennsylvaniaAddressExceptionClass =
  | "letter-only-with-additional"
  | "letter-only-named-without-number";

export type PennsylvaniaAddressException = {
  objectId: string;
  name: string;
  originalStreet: string;
  originalStreetAdditional: string;
  city: string;
  zip: string;
  exceptionClass: PennsylvaniaAddressExceptionClass;
  usableStreet: null;
  rewritten: false;
  publicationEligible: false;
  /** Deterministic Tier 1 exclusion — not corrected, not published. */
  deterministicExclusion: true;
  note: string;
};

/**
 * All 13 letter-only street rows from the official Download CSV capture.
 * Street Additional Information is retained but never copied into Street.
 */
export const PENNSYLVANIA_ADDRESS_EXCEPTIONS: readonly PennsylvaniaAddressException[] = [
  {
    objectId: "775745",
    name: "EASY LIVING COUNTRY ESTATES",
    originalStreet: "ONE EASY LIVING DRIVE",
    originalStreetAdditional: "",
    city: "HUNKER",
    zip: "15639",
    exceptionClass: "letter-only-named-without-number",
    usableStreet: null,
    rewritten: false,
    publicationEligible: false,
    deterministicExclusion: true,
    note: "Spelled-out ONE is not a digit; house number not invented.",
  },
  {
    objectId: "775340",
    name: "RUTH M SMITH CENTER",
    originalStreet: "BUILDING A",
    originalStreetAdditional: "407 SOUTH MAIN STREET",
    city: "SHEFFIELD",
    zip: "16347",
    exceptionClass: "letter-only-with-additional",
    usableStreet: null,
    rewritten: false,
    publicationEligible: false,
    deterministicExclusion: true,
    note: "Additional text retained in original column; not copied into Street.",
  },
  {
    objectId: "770471",
    name: "ST MARY'S VILLA RESIDENCE",
    originalStreet: "ONE PIONEER PLACE",
    originalStreetAdditional: "",
    city: "MOSCOW",
    zip: "18444",
    exceptionClass: "letter-only-named-without-number",
    usableStreet: null,
    rewritten: false,
    publicationEligible: false,
    deterministicExclusion: true,
    note: "Spelled-out ONE is not a digit; house number not invented.",
  },
  {
    objectId: "775342",
    name: "RUTH M SMITH CENTER",
    originalStreet: "BUILDING C",
    originalStreetAdditional: "407 SOUTH MAIN STREET",
    city: "SHEFFIELD",
    zip: "16347",
    exceptionClass: "letter-only-with-additional",
    usableStreet: null,
    rewritten: false,
    publicationEligible: false,
    deterministicExclusion: true,
    note: "Additional text retained in original column; not copied into Street.",
  },
  {
    objectId: "770160",
    name: "THE BUEHRLE CENTER",
    originalStreet: "ONE SOUTH HOME AVENUE",
    originalStreetAdditional: "",
    city: "TOPTON",
    zip: "19562",
    exceptionClass: "letter-only-named-without-number",
    usableStreet: null,
    rewritten: false,
    publicationEligible: false,
    deterministicExclusion: true,
    note: "Spelled-out ONE is not a digit; house number not invented.",
  },
  {
    objectId: "769759",
    name: "SIMPSON HOUSE",
    originalStreet: "BELMONT AVENUE & MONUMENT ROAD",
    originalStreetAdditional: "",
    city: "PHILADELPHIA",
    zip: "19131",
    exceptionClass: "letter-only-named-without-number",
    usableStreet: null,
    rewritten: false,
    publicationEligible: false,
    deterministicExclusion: true,
    note: "Intersection-style street with no house number digit.",
  },
  {
    objectId: "772664",
    name: "CORNWALL MANOR",
    originalStreet: "CORSON HALL",
    originalStreetAdditional: "1 BOYD STREET  PO BOX 125",
    city: "CORNWALL",
    zip: "17016",
    exceptionClass: "letter-only-with-additional",
    usableStreet: null,
    rewritten: false,
    publicationEligible: false,
    deterministicExclusion: true,
    note: "Additional text retained; Street stays CORSON HALL.",
  },
  {
    objectId: "772425",
    name: "GARDEN SPOT VILLAGE",
    originalStreet: "MOUNTAIN VIEW AND LAUREL VIEW",
    originalStreetAdditional: "433 S KINZER AVENUE",
    city: "NEW HOLLAND",
    zip: "17557",
    exceptionClass: "letter-only-with-additional",
    usableStreet: null,
    rewritten: false,
    publicationEligible: false,
    deterministicExclusion: true,
    note: "Additional text retained; Street stays campus labels.",
  },
  {
    objectId: "772456",
    name: "MASONIC VILLAGE AT ELIZABETHTOWN",
    originalStreet: "ONE MASONIC DRIVE",
    originalStreetAdditional: "",
    city: "ELIZABETHTOWN",
    zip: "17022",
    exceptionClass: "letter-only-named-without-number",
    usableStreet: null,
    rewritten: false,
    publicationEligible: false,
    deterministicExclusion: true,
    note: "Spelled-out ONE is not a digit; house number not invented.",
  },
  {
    objectId: "772326",
    name: "WESTMINSTER WOODS AT HUNTINGDON",
    originalStreet: "HOMESTEAD BUILDING",
    originalStreetAdditional: "360 WESTMINSTER DRIVE",
    city: "HUNTINGDON",
    zip: "16652",
    exceptionClass: "letter-only-with-additional",
    usableStreet: null,
    rewritten: false,
    publicationEligible: false,
    deterministicExclusion: true,
    note: "Additional text retained; Street stays building label.",
  },
  {
    objectId: "771154",
    name: "RIVERSTONE MANOR",
    originalStreet: "ONE MAIN STREET",
    originalStreetAdditional: "",
    city: "WALNUTPORT",
    zip: "18088",
    exceptionClass: "letter-only-named-without-number",
    usableStreet: null,
    rewritten: false,
    publicationEligible: false,
    deterministicExclusion: true,
    note: "Spelled-out ONE is not a digit; house number not invented.",
  },
  {
    objectId: "775207",
    name: "RIDGEWOOD AT SHENANGO VALLEY",
    originalStreet: "ONE ELSTON WAY",
    originalStreetAdditional: "",
    city: "HERMITAGE",
    zip: "16148",
    exceptionClass: "letter-only-named-without-number",
    usableStreet: null,
    rewritten: false,
    publicationEligible: false,
    deterministicExclusion: true,
    note: "Spelled-out ONE is not a digit; house number not invented.",
  },
  {
    objectId: "775341",
    name: "RUTH M SMITH CENTER",
    originalStreet: "BUILDING B",
    originalStreetAdditional: "407 SOUTH MAIN STREET",
    city: "SHEFFIELD",
    zip: "16347",
    exceptionClass: "letter-only-with-additional",
    usableStreet: null,
    rewritten: false,
    publicationEligible: false,
    deterministicExclusion: true,
    note: "Additional text retained in original column; not copied into Street.",
  },
] as const;

export function summarizePennsylvaniaAddressExceptions(
  exceptions: readonly PennsylvaniaAddressException[] = PENNSYLVANIA_ADDRESS_EXCEPTIONS,
) {
  const byClass: Record<string, number> = {};
  for (const row of exceptions) {
    byClass[row.exceptionClass] = (byClass[row.exceptionClass] ?? 0) + 1;
  }
  const objectIds = new Set(exceptions.map(e => e.objectId));
  return {
    total: exceptions.length,
    byClass,
    uniqueObjectIds: objectIds.size,
    anyRewritten: exceptions.some(e => e.rewritten),
    anyPublicationEligible: exceptions.some(e => e.publicationEligible),
    allDeterministicallyExcluded: exceptions.every(e => e.deterministicExclusion),
    residualOk:
      PENNSYLVANIA_ADDRESS_SOURCE_CAPTURE.usableStreetRows + exceptions.length
      === PENNSYLVANIA_ADDRESS_SOURCE_CAPTURE.rows,
  };
}

export function evaluatePennsylvaniaAddressExceptions() {
  const summary = summarizePennsylvaniaAddressExceptions();
  return {
    observedOn: PENNSYLVANIA_ADDRESS_EXCEPTION_OBSERVED_ON,
    capture: PENNSYLVANIA_ADDRESS_SOURCE_CAPTURE,
    exceptions: PENNSYLVANIA_ADDRESS_EXCEPTIONS,
    summary,
    /** Letter-only streets are resolved by deterministic exclusion, not correction. */
    addressExceptionsResolvedByExclusion: summary.allDeterministicallyExcluded && summary.total === 13,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
