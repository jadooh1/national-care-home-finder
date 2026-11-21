# California exclusion + status-conflict verification runbook

**Base:** `development` @ `41458b8` (#199)  
**Observed:** 2026-11-21  
**Scope:** Development-only. California unpublished. Exclusions remain inactive.

## Purpose

Classify the **88 offline listing exclusions** against authoritative CDSS
DownloadStateData / FacilityDetail evidence, encode the safeguard that
**undocumented ArcGIS STATUS integers cannot override official CDSS**, and
preserve the distinction between **offline Tier 1 candidates** (15,363) and
**publication-approved** facilities (0).

## Accounting

| Item | Count |
| --- | ---: |
| Active-restricted candidates (Phase 23) | 15,451 |
| Listing exclusions (offline) | **88** |
| — Provisional License conflicts | 5 |
| — Licensed/Pending Increase overlays | 66 |
| — Prior status conflicts | 3 |
| — Missing License First Date | 14 |
| Otherwise-clear offline / Tier 1 offline | 15,363 |
| Publication eligible | **0** |
| Exclusions activated in app/DB | **No** |

Withdrawn regression IDs (5) and invalid `95354` remain documented outside the
15,451 residual.

## CDSS evidence support (all 88)

| Category | Phase 18 rule | Authority | ArcGIS relied on? | Publication mapping |
| --- | --- | --- | --- | --- |
| Provisional (5) | unverified-or-conflicting-status | Download vs FacilityDetail conflict | No | Not approved |
| Pending Increase (66) | unverified-or-conflicting-status | FacilityDetail status | No | Not approved |
| Prior (3) | unverified-or-conflicting-status | Download vs FacilityDetail conflict | No | Not approved |
| Missing date (14) | missing-license-evidence | Download License First Date empty | No | Not approved |

### Live FacilityDetail re-probes (2026-11-21)

| ID | Role | FacilityDetail status | License First |
| --- | --- | --- | --- |
| 198320787 | provisional | Provisional License | 8/12/2026 |
| 134605014 | provisional | Provisional License | 8/6/2026 |
| 374604742 | pending-increase | Licensed/Pending Increase | 9/17/2024 |
| 015601083 | pending-increase | Licensed/Pending Increase | 11/23/2004 |
| 502701867 | prior | Pending Incomplete Application | (null) |
| 019201167 | prior | Licensed/Pending Increase | 8/1/2022 |
| 079201725 | missing-date | Licensed | (null) |
| 502701889 | missing-date | Licensed | 9/22/2026 *(FacilityDetail only)* |
| 100400070 | control | Licensed | 3/20/1985 |
| 015601302 | leading-zero | Licensed | 5/20/2010 |

**Stale-record note:** `502701889` now has a FacilityDetail license date while
the Phase 23 download ledger still treats License First Date as empty.
Safeguard: empty **download** date keeps the exclusion until a fresh
Transparency CSV confirms the date (or humans adopt FacilityDetail dates).
ArcGIS STATUS cannot clear it.

## Safeguards tested

1. **Conflicting licensing statuses** — Provisional, Pending Increase, Pending Incomplete → offline listing excluded; `publicationApproved=false`.
2. **Mismatched identifiers** — FacilityDetail number ≠ requested ID → `invalid-id-ineligible`.
3. **Invalid IDs** — `95354` refuse-closed.
4. **Stale / unresolved CDSS mismatch** — Download LICENSED vs non-mapped FacilityDetail → fail-closed.
5. **Duplicates** — `duplicateFacilityNumberCount > 1` → fail-closed.
6. **ArcGIS override** — any ArcGIS STATUS integer consulted is recorded but `arcgisOverrodeCdss` is always `false`; `tryClearCdssConflictWithArcGisStatus` never succeeds.
7. **Offline vs publication** — clear Licensed control is `offlineCandidate=true` and still `publicationApproved=false`.

## Resolved findings

- `listing-exclusions-classified-against-cdss-evidence`
- `arcgis-status-cannot-override-cdss-safeguard-encoded`
- `offline-vs-publication-approved-distinction-preserved`

## Remaining blockers

- California publication blocked / unpublished authorization
- Exclusion policy inactive (not activated in app/DB)
- Pending Increase mapping not approved for publication
- Missing-date needs fresh roster or human adoption of FacilityDetail dates
- ArcGIS rejected as roster + undocumented STATUS domain
- Tier 2 licensing-coordinate approval
- Separate publication approval

## Reproduce

```bash
node --experimental-strip-types --test \
  supabase/proposals/tests/california_exclusion_status_conflict.ts
```

Development preview: `/development/california-exclusion-conflict`

## Restrictions preserved

No production deploy, no DB writes, no California publication, no agency
outreach, no merge without approval. Washington, Oregon, Florida, Ohio,
authentication, billing, and Design 2 unchanged.
