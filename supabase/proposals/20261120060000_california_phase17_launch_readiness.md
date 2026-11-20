# California Phase 17 — launch-readiness dossier

**Issue:** #131  
**Base:** `development` including Phase 16 merge `c356693`  
**Scope:** Development-only, read-only. California remains unpublished. No production / main / Supabase writes / owner-claim activation. CDSS clarification already sent — **no duplicate inquiries**. Publication gate stays **BLOCKED** — not changed or opened.

## Objective

1. Audit and prioritize remaining California launch blockers (statewide vs facility-excludable).
2. Reassess authoritative CDSS freshness evidence; check for CDSS reply only if mailbox available.
3. Evaluate Phase 16 exception results for genuine eligibility risk without weakening fail-closed safeguards.
4. Decide disclosure-audit strategy for cumulative **462 / 15,451**.
5. Produce a practical launch-readiness dossier with stop/go conditions and human decisions.

## Decision matrix (summary)

| Rank | Kind | Item |
| ---: | --- | --- |
| 1 | Statewide blocker | Authoritative ISO export / version stamp — **absent** |
| 2 | Statewide blocker | Roster-wide FacilityDetail status verification — incomplete |
| 3 | Statewide blocker | Disclosure-link coverage **462/15451** — not roster-complete |
| 4 | Statewide blocker | CDSS clarification reply — unconfirmed (mailbox unavailable here) |
| 8–10 | Facility-excludable | 14 LICENSED-missing-date; sampled status conflicts; 502701867; 28 coords |

Facility exceptions can eventually be handled by exclusion under fail-closed rules; they do **not** alone clear statewide blockers.

## Freshness

- Live DownloadStateData sha256 **unchanged** vs Phase 10–16 baseline.
- Filename MMDDYYYY `11152026` → ISO candidate `2026-11-15` — **rejected**.
- FAQ still: “The data is updated weekly.” — policy-only.
- FAQ also notes first license dates may be unavailable (“No date on file”) — does not authorize publishing undated LICENSED rows.
- **No authorized connected mailbox** in this environment → CDSS reply not confirmed; status remains `sent-awaiting-response`.
- **No duplicate inquiry sent.**

## Disclosure strategy

- Additional small samples do **not** meaningfully improve launch readiness at ~3% coverage.
- **Pause** small incremental samples.
- Propose rate-limited full-roster verification via Phase 13 harness — **separate human approval required**; `performNow=false`.
- No uncontrolled statewide crawl performed.

## Exception safeguards preserved

- 14 statewide LICENSED-missing-date → unknown-ineligible / excludable
- Sampled status conflicts → unknown-ineligible / excludable
- `502701867` unknown-ineligible; `95354` refuse-closed; leading zeros preserved
- Five withdrawn controls withdrawn-ineligible
- 28 unresolved coords **not** re-probed

## Readiness / gate

Baseline preserved: **24,377** total; **15,451** active/restricted candidates; **15,423** verified coords; **28** unresolved; **21** missing capacities on excluded. Gate stays **BLOCKED**. Stop/go recommendation: **STOP**.

## Artifacts

- `lib/california-phase17-decision-matrix.ts`
- `lib/california-phase17-freshness.ts`
- `lib/california-phase17-exceptions.ts`
- `lib/california-phase17-disclosure-strategy.ts`
- `lib/california-phase17-quality.ts`
- `lib/california-phase17-readiness.ts`
- `lib/california-phase17-launch-readiness.ts`
- `scripts/california-phase17-launch-readiness-run.mjs`
- `docs/california-phase17-launch-readiness-runbook.md`
- Fixtures under `supabase/proposals/fixtures/california-phase17-launch-readiness/`
- Tests: `supabase/proposals/tests/california_phase17_launch_readiness.ts`
