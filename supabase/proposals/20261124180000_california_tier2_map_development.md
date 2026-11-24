# California Tier 2 — development map (ArcGIS exact-ID coordinates)

## Scope

Development-only interactive map for the 15,435 eligible CDSS Tier 1 facilities.
Coordinates are matched from the official CDSS CCL ArcGIS FeatureServer using
Phase 8 licensing-ID rules. CDSS DownloadStateData remains authoritative.
Public California maps, owner features, Oregon publication, and production
database/auth/billing are unchanged.

## Coverage (observed 2026-11-24)

| Metric | Count |
| --- | ---: |
| Eligible Tier 1 roster | 15,435 |
| Exact FAC_NBR + valid coords | 14,058 (91.08%) |
| Unique leading-zero GIS collapse + valid | 1,361 |
| Usable official coords (map points) | 15,419 (99.90%) |
| Unmatched (no map point) | 16 |
| Ambiguous / duplicate GIS | 0 |
| Invalid / missing GIS coords among matches | 0 |
| Fabricated / geocoded | 0 |

Fixture: `supabase/proposals/fixtures/california-tier2-map/`.
Route: `/development/california/map` (robots-disallowed `/development`).
`directoryContract('California').mapPath` remains `null`.

## Safeguards reconciled

- Oregon production-host / `VERCEL_ENV=production` fail-closed layout ported onto
  the development baseline (`app/oregon/layout.tsx`).
- Washington public map and sitemap paths preserved.
- California public routes absent on this branch; Tier 2 map is development-only.

## Remaining blockers

- Exact-ID gaps and GIS integer `FAC_NBR` leading-zero representation for 1,361
  facilities (usable but not string-exact).
- ArcGIS STATUS domain still undocumented (GIS is not the roster).
- Public California map remains disabled.
- 16 unmatched facilities have no verified coordinates — do not invent.
- Coordinates are a GIS enhancement; CDSS roster attributes stay authoritative.

## Validation

- `node --experimental-strip-types --test supabase/proposals/tests/california_tier2_map.ts`
- `npm run build`
- Protected preview only; no production deploy from this proposal.
