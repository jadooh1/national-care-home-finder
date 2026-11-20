# California Phase 22 — launch-blocker evidence runbook

**Scope:** Development-only, read-only. California stays unpublished. Gate stays **BLOCKED**.  
**Do not** send CDSS clarification email (already sent — no duplicates).  
**Do not** write to Supabase, production, or `main`.  
**Do not** activate exclusion policy in application or database.  
**Do not** repeat the statewide FacilityDetail crawl.

## Purpose

1. Reassess authoritative freshness evidence (ISO export/version stamp).  
2. Policy-bound unique-ID / capacity / facility-type review from official roster + Phase 20/21 evidence.  
3. Reassess five Provisional License conflicts + three prior controls (narrow probes only).  
4. Publish a readiness decision matrix separating statewide prerequisites from facility suppressions.  
5. Keep launch recommendation **STOP**.

## Commands

```bash
node --experimental-strip-types scripts/california-phase22-launch-blocker-evidence-run.mjs \
  --out california-phase22-audit-out
```

Reuse existing provisional probe evidence (skip live FacilityDetail probes):

```bash
node --experimental-strip-types scripts/california-phase22-launch-blocker-evidence-run.mjs \
  --out california-phase22-audit-out --skip-provisional-probe
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/california_phase22_launch_blocker_evidence.ts
```

## Probe controls (narrow only)

| Parameter | Value |
| --- | --- |
| Provisional conflict IDs | **5** (`198320787`, `455920513`, `197611076`, `197611060`, `134605014`) |
| Prior control IDs | **3** (`502701867`, `019201167`, `019201133`) |
| Concurrency | **1** |
| Min interval | ≥450 ms |
| Statewide crawl | **not repeated** |
| Exclusion activation | **false** |
| Gate | **blocked** |
| Stop / go | **STOP** |

## Freshness clock classes

Do not conflate:

| Clock class | Example | Authoritative ISO? |
| --- | --- | --- |
| dataset-export | Official ISO/version channel | Required (currently **absent**) |
| download-filename-stamp | `11152026` → `2026-11-15` | **No** |
| website-static-asset | `downloadstatedata.html` Last-Modified | **No** |
| http-transport | HTTP Date / Last-Modified / ETag | **No** |
| policy-cadence | FAQ “updated weekly” | **No** (policy only) |
| catalog-metadata | publish.data.ca.gov `metadata_modified` | **No** |

## Stop / go

**STOP.** Publication remains blocked until authoritative ISO export date / CDSS reply / exclusion activation / unique-ID-capacity policy / source licensing / QA (and other global blockers) are resolved by humans.
