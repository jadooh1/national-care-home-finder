# California authoritative data verification runbook

**Prior:** PR #197 ArcGIS Tier 1 STOP @ `8f3945e`  
**Observed:** 2026-11-21  
**Scope:** Development-only. California remains unpublished / STOP.

## Purpose

Close the three outstanding ArcGIS/roster questions without repeating completed Phase 5/22–26 work or Florida/Ohio investigations:

1. Official documentation for ArcGIS numeric `STATUS`  
2. Character of the 1,240 leading-zero ID discrepancies (identifiers unaltered)  
3. Authoritative roster export date / version

## Verdicts

| Question | Result |
| --- | --- |
| ArcGIS STATUS domain | **Still undocumented** — `statusCodesAccepted=false` |
| Leading-zero IDs | **Representation mismatches only** — do not collapse or rewrite |
| ISO export / version | **Still absent** — all clock proxies rejected |
| California publication | **STOP** / unpublished |

## 1. STATUS documentation hunt

| Channel | Finding |
| --- | --- |
| ArcGIS layer field `STATUS` | `esriFieldTypeInteger`, **domain null** |
| PIN 24-01-CCLD | Text statuses only: Licensed, Pending, Closed, On Probation |
| Transparency FAQ | Text definitions (Pending, Probation, Suspended, …) |
| Hub / catalog notes | Mission text; no coded-value dictionary |

Stratified FacilityDetail sample (2 RCFE-like IDs × STATUS 3/4/5/6): **all eight** returned official `Licensed`. GIS integers therefore are **not** a 1:1 map onto the PIN text domain and must not be accepted from correlation.

## 2. Leading-zero discrepancies (n=1,240)

| Property | Value |
| --- | --- |
| Form | All 9-digit historical IDs with exactly one leading `0` |
| GIS form | Always 8-digit integer string (e.g. `015601302` ↔ `15601302`) |
| Exact GIS matches preserving zeros | **0** of 1,810 leading-zero eligible IDs |
| Representation mismatches | 1,240 |
| Missing even if zeros collapsed | 570 |
| Status mix | LICENSED 1,147 / PENDING 89 / ON PROBATION 4 |

FacilityDetail for truncated `15601302` returns canonical `015601302`. Policy: store canonical strings only; refuse truncated GIS integers; collapsing zeros is not a match.

## 3. Freshness / version

Authoritative ISO export date: **null**. Authoritative dataset version: **null**.

Rejected proxies include ArcGIS `dataLastEditDate` (`2026-11-20T16:08:37.663Z`), CHHS `Data as of 05252025` / `file_date`, catalog `dcat_modified`, FAQ “updated weekly”, and DownloadStateData filename stamps. CDSS clarification remains `sent-awaiting-response`; **no new email sent**.

## Reproduce

```bash
node --experimental-strip-types --test supabase/proposals/tests/california_authoritative_data_verification.ts
```

Module: `lib/california-authoritative-data-verification.ts`

## Remaining blockers / approvals

**Blockers:** undocumented ArcGIS STATUS; integer FAC_NBR truncation; no ISO/version; CDSS reply pending; CA publication blocked; exclusions inactive; Tier 2 coord approval separate.

**Approvals only a human can grant:** accept an official STATUS domain; mailbox check / follow-up send; adopt ISO/version channel; activate exclusions; open publication gate.

## Guardrails

No production/`main`, Supabase writes, auth/billing/Design 2, WA production, OR/FL/OH behavior changes, agency email, or merge without approval.
