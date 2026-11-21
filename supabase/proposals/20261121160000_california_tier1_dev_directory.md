# California Tier 1 development-only directory

**Baseline:** PR #209 merged at `c5d6ca4`  
**Observed:** 2026-11-21  
**Mode:** Development-only fixtures. No California publication, no exclusion/eligibility activation, no Supabase writes.

## What shipped

- Fixture-backed listing + search at `/development/california`
- Detail navigation at `/development/california/[facilityNumber]`
- Exact CDSS Facility Numbers (leading zeros preserved)
- Official FacDetail disclosure links
- Approved licensed capacity shown separately from Pending Increase status
- Residual-22 / invalid / unknown IDs fail closed
- Public routes, sitemap, map, and owner workflows remain without California

## Scope notice

**7 development fixtures** from verified live samples — **not** the 15,429 statewide offline Tier 1 set.

## Prepublication checklist (remaining)

- Reconfirm DownloadStateData source freshness
- Activate residual exclusion ledger + wire gates before public listing
- Replace fixtures with approved statewide roster only under separate publication approval

## Artifacts

- `lib/california-tier1-dev-directory.ts`
- `app/development/california/page.tsx` (searchable fixtures)
- `app/development/california/[facilityNumber]/page.tsx`
- `supabase/proposals/tests/california_tier1_dev_directory.ts`
