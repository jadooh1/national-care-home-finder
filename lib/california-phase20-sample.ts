/**
 * California Phase 20 — staged statewide remaining-roster sample planner.
 * Excludes Phase 13–19 already-verified/probed IDs (coverage baseline 707).
 * Authorization: ≤14,744 additional unique facilities in batches ≤250.
 * California stays unpublished. Gate stays BLOCKED.
 *
 * Intentionally free of sibling runtime imports.
 */

import {
  CALIFORNIA_PHASE20_PHASE19_INCREMENTAL_IDS,
  CALIFORNIA_PHASE20_PRIOR_VERIFIED_EXCLUDE_IDS,
} from "./california-phase20-prior-verified-ids.ts";

export {
  CALIFORNIA_PHASE20_PHASE19_INCREMENTAL_IDS,
  CALIFORNIA_PHASE20_PRIOR_VERIFIED_EXCLUDE_IDS,
};

export const CALIFORNIA_PHASE20_COVERAGE_BASELINE = 707;
export const CALIFORNIA_PHASE20_PHASE16_BASELINE = 462;
export const CALIFORNIA_PHASE20_PHASE19_INCREMENTAL = 245;
export const CALIFORNIA_PHASE20_ROSTER_DENOMINATOR = 15451;
export const CALIFORNIA_PHASE20_AUTHORIZED_ADDITIONAL = 14744;
export const CALIFORNIA_PHASE20_BATCH_FACILITY_CAP = 250;

export const CALIFORNIA_PHASE20_STATUS_CONFLICT_IDS = [
  "502701867",
  "019201167",
  "019201133",
] as const;

export const CALIFORNIA_PHASE20_WITHDRAWN_REGRESSION_IDS = [
  "306006749",
  "306006799",
  "405802282",
  "374604911",
  "019201529",
] as const;

const FACILITY_NUMBER = /^\d{8,9}$/;

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function upper(value: unknown): string {
  return text(value).toUpperCase();
}

export type CaliforniaPhase20GeographicRegion =
  | "southern"
  | "central"
  | "bay-northern"
  | "unknown";

export type CaliforniaPhase20DownloadRowLike = {
  facilityNumber?: string | null;
  facilityStatus?: string | null;
  facilityType?: string | null;
  facilityZip?: string | null;
  licenseFirstDate?: string | null;
  closedDate?: string | null;
};

export type CaliforniaPhase20QueueTarget = {
  facilityNumber: string;
  file: "RCFE" | "ARF";
  downloadStatus: string;
  downloadType: string;
  stratum:
    | "active-licensed"
    | "restricted-probation"
    | "leading-zero-active"
    | "leading-zero-probation";
  label: string;
  publicationCandidate: true;
  geographicRegion: CaliforniaPhase20GeographicRegion;
  previouslyUnverified: true;
};

export const CALIFORNIA_PHASE20_PRIOR_VERIFIED_EXCLUDE_SET = new Set<string>(
  CALIFORNIA_PHASE20_PRIOR_VERIFIED_EXCLUDE_IDS,
);

export function isCaliforniaPhase20PreviouslyUnverified(
  facilityNumber: string,
): boolean {
  return !CALIFORNIA_PHASE20_PRIOR_VERIFIED_EXCLUDE_SET.has(text(facilityNumber));
}

export function classifyCaliforniaPhase20GeographicRegion(
  zip: string | null | undefined,
): CaliforniaPhase20GeographicRegion {
  const z = text(zip).replace(/\D/g, "");
  if (z.length < 1) return "unknown";
  const first = z[0];
  if (first === "9") {
    const second = z[1] ?? "";
    if (second === "0" || second === "1" || second === "2") return "southern";
    if (second === "3") return "central";
    if (second === "4" || second === "5" || second === "6") return "bay-northern";
  }
  return "unknown";
}

/**
 * Only publication-candidate statuses (LICENSED / ON PROBATION) enter the
 * Phase 20 remaining roster. Closed/pending/withdrawn are not in the 15,451.
 */
export function classifyCaliforniaPhase20RemainingCandidate(
  file: "RCFE" | "ARF",
  row: CaliforniaPhase20DownloadRowLike,
): CaliforniaPhase20QueueTarget | null {
  const facilityNumber = text(row.facilityNumber);
  if (!isCaliforniaPhase20PreviouslyUnverified(facilityNumber)) return null;
  if (!FACILITY_NUMBER.test(facilityNumber)) return null;

  const status = upper(row.facilityStatus);
  const type = text(row.facilityType);
  const leadingZero = facilityNumber.startsWith("0");
  const geographicRegion = classifyCaliforniaPhase20GeographicRegion(row.facilityZip);

  if (status === "ON PROBATION") {
    return {
      facilityNumber,
      file,
      downloadStatus: "ON PROBATION",
      downloadType: type,
      stratum: leadingZero ? "leading-zero-probation" : "restricted-probation",
      label: `${file.toLowerCase()}-prob-${facilityNumber}`,
      publicationCandidate: true,
      geographicRegion,
      previouslyUnverified: true,
    };
  }

  if (status === "LICENSED") {
    return {
      facilityNumber,
      file,
      downloadStatus: "LICENSED",
      downloadType: type,
      stratum: leadingZero ? "leading-zero-active" : "active-licensed",
      label: `${file.toLowerCase()}-lic-${facilityNumber}`,
      publicationCandidate: true,
      geographicRegion,
      previouslyUnverified: true,
    };
  }

  return null;
}

export function californiaPhase20StableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Deterministic ordering of remaining publication candidates.
 * Caps at the authorized additional unique-facility limit.
 */
export function planCaliforniaPhase20RemainingQueue(
  pool: readonly CaliforniaPhase20QueueTarget[],
  options?: {
    authorizedAdditional?: number;
    offset?: number;
    limit?: number;
  },
): CaliforniaPhase20QueueTarget[] {
  const authorized = options?.authorizedAdditional
    ?? CALIFORNIA_PHASE20_AUTHORIZED_ADDITIONAL;
  const offset = Math.max(0, options?.offset ?? 0);
  const limit = options?.limit ?? authorized;

  const sorted = pool.slice().sort((a, b) => {
    const ha = californiaPhase20StableHash(`${a.facilityNumber}|${a.file}|${a.stratum}`);
    const hb = californiaPhase20StableHash(`${b.facilityNumber}|${b.file}|${b.stratum}`);
    return ha - hb || a.facilityNumber.localeCompare(b.facilityNumber);
  });

  const seen = new Set<string>();
  const unique: CaliforniaPhase20QueueTarget[] = [];
  for (const row of sorted) {
    if (seen.has(row.facilityNumber)) continue;
    seen.add(row.facilityNumber);
    unique.push(row);
    if (unique.length >= authorized) break;
  }

  return unique.slice(offset, offset + Math.min(limit, Math.max(0, authorized - offset)));
}

export function sliceCaliforniaPhase20Batch(
  queue: readonly CaliforniaPhase20QueueTarget[],
  batchIndex: number,
  batchSize: number = CALIFORNIA_PHASE20_BATCH_FACILITY_CAP,
): CaliforniaPhase20QueueTarget[] {
  const start = batchIndex * batchSize;
  return queue.slice(start, start + batchSize);
}

export const CALIFORNIA_PHASE20_SAMPLE_NOTES = [
  "Phase 20 staged crawl excludes Phase 13–19 probed facility numbers (coverage baseline 707).",
  "Queue is publication-candidate LICENSED + ON PROBATION only (15,451 roster).",
  "Authorized additional unique facilities ≤14,744; batch cap ≤250; concurrency 1; minIntervalMs 450.",
  "California remains unpublished; exclusions offline-only; gate BLOCKED.",
] as const;
