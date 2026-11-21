# California Pending Increase publication-policy proposal

**Base:** `development` @ `41338bb` (#201)  
**Observed:** 2026-11-21  
**Scope:** Development-only proposal. **Not approved. Not activated.** California unpublished.

## Exact decision requiring human approval

**ID:** `approve-licensed-pending-increase-future-publication-mapping`

Approve treating CDSS FacilityDetail status **"Licensed/Pending Increase"** (with Download **LICENSED**) as a recognized existing licensed facility for *future* California publication consideration, publishing only the **currently approved capacity** when Download Facility Capacity exactly equals FacilityDetail CAPACITY, **never inventing or displaying a proposed capacity increase** (not published in Transparency APIs), and only after all **CDSS source-agreement gates** pass — while California statewide publication remains STOP, exclusions remain inactive in app/DB until separately activated, and the **14 missing License First Date** facilities plus all other documented conflicts remain excluded.

**Alternative:** Reject and keep all 66 Pending Increase facilities offline listing-excluded until FacilityDetail clears to exact "Licensed".

## Proposed rules (inactive)

1. Recognize existing licensed status (Download `LICENSED` + FacilityDetail `Licensed/Pending Increase` or exact `Licensed`).
2. Require exact Facility Number match across CDSS sources.
3. Require non-empty Download License First Date.
4. Require Download Facility Capacity === FacilityDetail CAPACITY → publish that approved capacity only.
5. Never invent proposed capacity increase amounts.
6. Never substitute `LICENSEEFFECTIVEDATE` for License First Date.
7. Continue excluding all 14 missing-first-date facilities.
8. Continue excluding provisional (5) and prior conflicts (3).
9. ArcGIS STATUS cannot satisfy CDSS agreement.
10. Future consideration ≠ publication approval (statewide STOP remains).

## Hypothetical impact simulation

| Metric | Current | If policy approved + CDSS agree |
| --- | ---: | ---: |
| Listing exclusions | 88 | **22** |
| Pending Increase excluded | 66 | 0 (→ future candidates) |
| Missing first date excluded | 14 | 14 |
| Provisional excluded | 5 | 5 |
| Prior conflicts excluded | 3 | 3 |
| Otherwise-clear offline | 15,363 | **15,429** |
| Publication eligible | **0** | **0** |

## Reproduce

```bash
node --experimental-strip-types --test \
  supabase/proposals/tests/california_pending_increase_publication_policy.ts
```

Dev preview: `/development/california-pending-policy`

## Restrictions

No production changes, DB writes, exclusion activation, California publication, agency outreach, or merge without approval.
