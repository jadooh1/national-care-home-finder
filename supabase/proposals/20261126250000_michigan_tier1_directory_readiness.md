# Michigan Tier 1 — directory publication readiness (development-only)

## Verdict

**STOP** for Michigan Tier 1 directory publication.

LARA `afc_sw.txt` is confirmed as the authoritative open roster for **Adult Foster
Care** and **Homes for the Aged (AH)**. Facility identifiers, capacity, status
domains, and FacilityProfile disclosure are verified on the 2026-11-26 capture.
Street resolution via supplemental sources was **attempted and refused** without
an authoritative physical/mailing definition. Freshness and XH/EXEMPT remain
blockers. `publicationEligible = 0`. Michigan stays **unpublished**.

## Evidence reused

- PR #62 — 4,480-row licensing validation (types, ZIP, XH/EXEMPT, capacity)
- PR #63 — address interpretation (supplemental not copied into Street)
- Nov 20 onboarding investigation (`lib/michigan-*.ts`, runbook)
- Nationwide publication eligibility readiness framework

## Authoritative source

| Field | Value |
| --- | --- |
| Agency | Michigan LARA / BCHS |
| File | https://documents.apps.lara.state.mi.us/bchs/afc_sw.txt |
| Scope | Adult Foster Care + Homes for the Aged |
| Capture | 2026-11-26; 4,476 rows; SHA-256 `cc46f26f…` |
| Last-Modified | `Thu, 26 Nov 2026 03:38:42 GMT` (**rejected** as export date) |
| recordedExportDateIso | `null` |
| Disclosure | `https://adultfostercare.apps.lara.state.mi.us/Home/FacilityProfile/{LICENSE}` verified |

## Inventory

| Bucket | Count |
| --- | ---: |
| Current roster rows | 4,476 |
| Prior PR #62 audit | 4,480 (net −4) |
| Described AFC types (AF–AI excl. AH) | 3,891 |
| Homes for the Aged (AH) | 351 |
| XH / EXEMPT (undescribed, ineligible) | 234 |
| Usable official Street (letter+digit) | 57 |
| Blank Street unresolved | 4,419 |
| Unique licenses / duplicates | 4,476 / 0 |
| **publicationEligible** | **0** |

## Street-resolution attempt (not adopted)

| Metric | Count |
| --- | ---: |
| Blank Street with supplemental letter+digit | 4,419 |
| Of those, supplemental = licensee address | 912 |
| Of those, supplemental PO Box | 0 |
| Remaining candidates (≠ licensee, non-PO Box) | 3,507 |
| **Supplemental adopted as physical** | **false** |

LARA record key labels column E “Facility Supplemental Address” and F “Street
Address” but does not define E as physical vs mailing. FacilityProfile shows an
unlabeled `Address:`. Per PR #63 policy, supplemental is not copied into Street.

## Outstanding blockers

1. Blank Street physical address unresolved (4,419)
2. Supplemental address not defined as physical or mailing
3. No authoritative ISO export/version stamp
4. Last-Modified / daily-update notice are not export dates
5. XH undescribed and EXEMPT ineligible (234)
6. State authorization remains unpublished

## Out of scope / preserved

No database writes, Michigan public/development route, production deploy,
geocoding, authentication, or billing changes. Washington public, California /
Design 2, and Oregon development host-gating unchanged.

## Next human actions

1. Obtain LARA definition of Facility Supplemental Address before any Street fill.
2. Obtain ISO export/version stamp for `afc_sw.txt`.
3. Obtain authoritative XH / EXEMPT definition before inclusion.
4. Keep disclosure verified but insufficient alone; authorize publication separately.
