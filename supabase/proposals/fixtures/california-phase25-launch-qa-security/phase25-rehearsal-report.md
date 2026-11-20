# California Phase 25 — launch QA / security rehearsal

**Observed:** 2026-11-20  
**Gate:** BLOCKED  
**Stop/go:** STOP  
**Allows publication:** false  

## Security

- Findings: 11
- Unpublished leak possible: 0
- Credentialed probes executed: false

## Eligibility regression

| Metric | Count |
| --- | ---: |
| Candidates | 15451 |
| Listing exclusions | 88 |
| Otherwise-clear offline | 15363 |
| Unresolved coordinates | 28 |
| Map-only | 27 |

Matches targets: true

## Source-data security

All pass: true  
Development defects fixed this phase: 0

## Indexing

- /development in PRIVATE_INDEX_PREFIXES: true
- robots disallow /development: true
- sitemap California: false
- sitemap /development: false

## Acceptance

```json
{
  "pass": 4,
  "blocked": 1,
  "future-approval": 2,
  "documented-risk": 1
}
```

## Constraints honored

- No crawl
- No CDSS send
- No exclusion activation
- No production / Supabase writes
- California unpublished
