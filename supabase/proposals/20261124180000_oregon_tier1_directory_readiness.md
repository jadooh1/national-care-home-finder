# Oregon Tier 1 — directory publication readiness (development-only)

## Verdict

**STOP** for Oregon Tier 1 directory publication.

Development host-gated directory remains operational (`/oregon`, 1,584 accepted
rows). Framework Tier 1 requirements are **not** met. This package does **not**
publish Oregon, invent coordinates, or adopt a fabricated export date.

## Evidence reused

- ODHS provider export audits (`lib/oregon-export-date.ts`, roster + reconciliation)
- Reduced-field public directory contract (`lib/oregon-public-directory.ts`)
- Nationwide publication eligibility readiness (`lib/publication-eligibility-readiness.ts`)
- California / Florida Tier 1 readiness patterns (controls + checklist + separation)

## Directory vs map

| Surface | Status |
| --- | --- |
| Directory (dev host-gated) | Operational; Tier 1 STOP |
| Map | Disabled (`mapPath` null); separate from directory |

## Outstanding directory blockers

1. No authoritative ISO export/version stamp
2. Street withheld from public columns (framework Tier 1 wants street unless list-only policy is approved)
3. State authorization remains development-only

## Controls

See `lib/oregon-tier1-directory-readiness.ts`:
`publicPublicationAuthorized=false`, `oregonPublished=false`, `mapEnabled=false`,
`stopGo=STOP`.

## Out of scope

No Supabase schema/data changes. No Washington / California / Design 2 / owner /
auth / billing changes. No merge or production deploy from the agent.
