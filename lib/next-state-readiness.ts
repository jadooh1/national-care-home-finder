export const NEXT_STATE_CANDIDATES = [
  "Oregon",
  "Michigan",
  "California",
  "North Carolina",
  "Pennsylvania",
] as const;

export type NextStateCandidate = (typeof NEXT_STATE_CANDIDATES)[number];

export const NEXT_STATE_READINESS = [
  {
    state: "Oregon",
    rank: 1,
    recommended: true,
    observedRows: 1584,
    capacityRecorded: true,
    identifier: "accepted-source-id",
    status: "present-on-the-accepted-export",
    exportDate: "absent",
    address: "city-and-county-accepted-street-withheld",
    disclosure: "verified-facility-specific",
    coordinates: "absent",
    directory: "development",
    mandatoryRemaining: ["authoritative-iso-export-date"],
    optionalRemaining: [
      "coordinate-columns",
      "street-location",
      "gis-layer-reconciliation",
    ],
  },
  {
    state: "Michigan",
    rank: 2,
    recommended: false,
    observedRows: 4480,
    capacityRecorded: true,
    identifier: "license",
    status: "present-not-an-availability-claim",
    exportDate: "absent",
    address: "street-mostly-blank",
    disclosure: "verified-facility-specific",
    coordinates: "absent",
    directory: "none",
    mandatoryRemaining: [
      "authoritative-iso-export-date",
      "physical-street-completeness",
      "undescribed-type-code",
    ],
    optionalRemaining: ["coordinate-columns"],
  },
  {
    state: "California",
    rank: 3,
    recommended: false,
    observedRows: 21131,
    capacityRecorded: true,
    identifier: "license",
    status: "open-data-conflicts-with-live-checks",
    exportDate: "absent",
    address: "present-not-accepted",
    disclosure: "route-verified-status-not-confirmed",
    coordinates: "absent",
    directory: "none",
    mandatoryRemaining: [
      "authoritative-iso-export-date",
      "live-status-conflict",
      "inconclusive-live-checks",
    ],
    optionalRemaining: ["coordinate-columns", "withheld-address-and-contact-fields"],
  },
  {
    state: "North Carolina",
    rank: 4,
    recommended: false,
    observedRows: 1086,
    capacityRecorded: true,
    identifier: "license",
    status: "absent",
    exportDate: "absent",
    address: "site-address-complete",
    disclosure: "absent",
    coordinates: "absent",
    directory: "none",
    mandatoryRemaining: [
      "authoritative-iso-export-date",
      "per-row-licensing-status",
      "license-based-disclosure-link",
    ],
    optionalRemaining: ["coordinate-columns"],
  },
  {
    state: "Pennsylvania",
    rank: 5,
    recommended: false,
    observedRows: 989,
    capacityRecorded: true,
    identifier: "open-data-object-id",
    status: "absent",
    exportDate: "absent",
    address: "street-mostly-present",
    disclosure: "absent",
    coordinates: "georeferenced-not-licensing",
    directory: "none",
    mandatoryRemaining: [
      "license-identifier",
      "per-row-licensing-status",
      "facility-disclosure-link",
      "authoritative-iso-export-date",
    ],
    optionalRemaining: ["georeferenced-map", "letter-only-streets"],
  },
] as const;

export function missingCoordinatesBlockListDirectory(): false {
  return false;
}

export function recommendedNextState(): "Oregon" {
  const selected = NEXT_STATE_READINESS.filter(item => item.recommended);
  if (selected.length !== 1 || selected[0].state !== "Oregon") {
    throw new Error("The publication-readiness review recommends one state");
  }
  return "Oregon";
}

export function nextStatePublicationPermitted(state: NextStateCandidate): false {
  void state;
  return false;
}

export function oregonListPublicationTasks(): readonly string[] {
  return [
    "authoritative-iso-export-date",
    "approval-for-list-only-publication-without-street-or-coordinates",
  ];
}
