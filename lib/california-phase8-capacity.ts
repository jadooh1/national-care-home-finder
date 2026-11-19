/**
 * California Phase 8 — official Facility Capacity verification (read-only).
 * Preserves DownloadStateData capacity values; quantifies missing / invalid /
 * zero / negative / valid / inconsistent-vs-historical / inconsistent-vs-GIS
 * separately for RCFE and ARF. Never overwrites official download capacity.
 */

export const CALIFORNIA_PHASE8_CAPACITY_OBSERVED_ON = "2026-11-19";

export const CALIFORNIA_PHASE8_CAPACITY_QUALITY_BUCKETS = [
  "missing",
  "invalid",
  "zero",
  "negative",
  "valid",
] as const;

export type CaliforniaPhase8CapacityQualityBucket =
  (typeof CALIFORNIA_PHASE8_CAPACITY_QUALITY_BUCKETS)[number];

export type CaliforniaPhase8File = "RCFE" | "ARF";

export type CaliforniaPhase8CapacityRow = {
  facilityNumber: string;
  facilityCapacity: string | number | null | undefined;
};

export type CaliforniaPhase8HistoricalCapacityRow = {
  facilityNumber: string;
  facilityCapacity: string | number | null | undefined;
};

export type CaliforniaPhase8GisCapacityRow = {
  FAC_NBR: string | number | null;
  CAPACITY?: string | number | null;
};

export type CaliforniaPhase8CapacityClassification = {
  facilityNumber: string;
  raw: string;
  bucket: CaliforniaPhase8CapacityQualityBucket;
  parsed: number | null;
  /** Official download capacity is always retained; never replaced. */
  officialValuePreserved: true;
};

export type CaliforniaPhase8CapacityQualityCounts = Record<
  CaliforniaPhase8CapacityQualityBucket,
  number
>;

export type CaliforniaPhase8CapacityCrossSource = {
  exactHistoricalCompared: number;
  inconsistentWithHistorical: number;
  historicalMissingForExactId: number;
  exactGisCompared: number;
  inconsistentWithGis: number;
  gisMissingForExactId: number;
  leadingZeroGisCollapsedCompared: number;
  inconsistentWithGisLeadingZeroCollapsed: number;
  /** Official download values are never overwritten by historical or GIS. */
  officialValuesOverwritten: 0;
};

export type CaliforniaPhase8FileCapacityAudit = {
  file: CaliforniaPhase8File;
  rowCount: number;
  quality: CaliforniaPhase8CapacityQualityCounts;
  qualitySumEqualsRowCount: boolean;
  crossSource: CaliforniaPhase8CapacityCrossSource;
};

function text(value: string | number | null | undefined): string {
  if (value == null) return "";
  return String(value).trim();
}

function emptyQuality(): CaliforniaPhase8CapacityQualityCounts {
  return { missing: 0, invalid: 0, zero: 0, negative: 0, valid: 0 };
}

/**
 * Classify an official Facility Capacity cell.
 * Valid = positive finite integer. Zero and negative are counted separately
 * from invalid non-numeric text. Missing = blank/whitespace.
 */
export function classifyCaliforniaPhase8Capacity(
  facilityNumber: string,
  facilityCapacity: string | number | null | undefined,
): CaliforniaPhase8CapacityClassification {
  const raw = text(facilityCapacity);
  if (!raw) {
    return {
      facilityNumber,
      raw,
      bucket: "missing",
      parsed: null,
      officialValuePreserved: true,
    };
  }
  // Reject non-integer / non-numeric forms (decimals, text, mixed).
  if (!/^-?\d+$/.test(raw)) {
    return {
      facilityNumber,
      raw,
      bucket: "invalid",
      parsed: null,
      officialValuePreserved: true,
    };
  }
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed)) {
    return {
      facilityNumber,
      raw,
      bucket: "invalid",
      parsed: null,
      officialValuePreserved: true,
    };
  }
  if (parsed < 0) {
    return {
      facilityNumber,
      raw,
      bucket: "negative",
      parsed,
      officialValuePreserved: true,
    };
  }
  if (parsed === 0) {
    return {
      facilityNumber,
      raw,
      bucket: "zero",
      parsed,
      officialValuePreserved: true,
    };
  }
  return {
    facilityNumber,
    raw,
    bucket: "valid",
    parsed,
    officialValuePreserved: true,
  };
}

function capacityNumber(value: string | number | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) ? value : null;
  }
  const raw = text(value);
  if (!raw || !/^-?\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) ? n : null;
}

function collapseFacilityNumber(value: string): string {
  const id = text(value);
  if (!/^\d+$/.test(id)) return id;
  return id.replace(/^0+/, "") || "0";
}

function normalizeGisLicense(value: string | number | null | undefined): string | null {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 0 ? String(value) : null;
  }
  const id = text(value);
  return /^\d+$/.test(id) ? id : null;
}

/**
 * Compare official download capacity to historical and GIS without overwriting.
 * Exact licensing-ID string match is preferred; leading-zero collapsed GIS
 * comparisons are reported separately and never silent-overwrite.
 */
export function auditCaliforniaPhase8Capacity(input: {
  file: CaliforniaPhase8File;
  download: readonly CaliforniaPhase8CapacityRow[];
  historical?: readonly CaliforniaPhase8HistoricalCapacityRow[];
  gis?: readonly CaliforniaPhase8GisCapacityRow[];
}): CaliforniaPhase8FileCapacityAudit {
  const quality = emptyQuality();
  const classified = input.download.map(row =>
    classifyCaliforniaPhase8Capacity(text(row.facilityNumber), row.facilityCapacity),
  );
  for (const row of classified) quality[row.bucket] += 1;

  const downloadById = new Map(
    classified.map(row => [row.facilityNumber, row] as const),
  );

  const historicalById = new Map<string, number | null>();
  for (const row of input.historical ?? []) {
    const id = text(row.facilityNumber);
    if (!id || historicalById.has(id)) continue;
    historicalById.set(id, capacityNumber(row.facilityCapacity));
  }

  const gisByExactId = new Map<string, Array<number | null>>();
  for (const row of input.gis ?? []) {
    const id = normalizeGisLicense(row.FAC_NBR ?? null);
    if (!id) continue;
    const list = gisByExactId.get(id) ?? [];
    list.push(capacityNumber(row.CAPACITY ?? null));
    gisByExactId.set(id, list);
  }

  let exactHistoricalCompared = 0;
  let inconsistentWithHistorical = 0;
  let historicalMissingForExactId = 0;
  let exactGisCompared = 0;
  let inconsistentWithGis = 0;
  let gisMissingForExactId = 0;
  let leadingZeroGisCollapsedCompared = 0;
  let inconsistentWithGisLeadingZeroCollapsed = 0;

  for (const [id, downloadRow] of downloadById) {
    if (downloadRow.parsed == null || downloadRow.bucket === "invalid") continue;

    if (historicalById.has(id)) {
      const hist = historicalById.get(id) ?? null;
      if (hist == null) {
        historicalMissingForExactId += 1;
      } else {
        exactHistoricalCompared += 1;
        if (hist !== downloadRow.parsed) inconsistentWithHistorical += 1;
      }
    } else {
      historicalMissingForExactId += 1;
    }

    const exactGis = gisByExactId.get(id);
    if (exactGis && exactGis.length === 1) {
      const gisCap = exactGis[0] ?? null;
      if (gisCap == null) {
        gisMissingForExactId += 1;
      } else {
        exactGisCompared += 1;
        if (gisCap !== downloadRow.parsed) inconsistentWithGis += 1;
      }
      continue;
    }
    if (exactGis && exactGis.length > 1) {
      // Ambiguous GIS capacity — do not compare; count as missing-for-exact.
      gisMissingForExactId += 1;
      continue;
    }

    // Exact GIS id absent: optional collapsed leading-zero compare (reported only).
    if (id.startsWith("0")) {
      const collapsed = collapseFacilityNumber(id);
      const collapsedGis = gisByExactId.get(collapsed);
      if (collapsedGis && collapsedGis.length === 1) {
        const gisCap = collapsedGis[0] ?? null;
        if (gisCap != null) {
          leadingZeroGisCollapsedCompared += 1;
          if (gisCap !== downloadRow.parsed) {
            inconsistentWithGisLeadingZeroCollapsed += 1;
          }
        } else {
          gisMissingForExactId += 1;
        }
      } else {
        gisMissingForExactId += 1;
      }
    } else {
      gisMissingForExactId += 1;
    }
  }

  const qualitySum =
    quality.missing + quality.invalid + quality.zero + quality.negative + quality.valid;

  return {
    file: input.file,
    rowCount: input.download.length,
    quality,
    qualitySumEqualsRowCount: qualitySum === input.download.length,
    crossSource: {
      exactHistoricalCompared,
      inconsistentWithHistorical,
      historicalMissingForExactId,
      exactGisCompared,
      inconsistentWithGis,
      gisMissingForExactId,
      leadingZeroGisCollapsedCompared,
      inconsistentWithGisLeadingZeroCollapsed,
      officialValuesOverwritten: 0,
    },
  };
}

export function mergeCaliforniaPhase8CapacityAudits(
  rcfe: CaliforniaPhase8FileCapacityAudit,
  arf: CaliforniaPhase8FileCapacityAudit,
): {
  rowCount: number;
  quality: CaliforniaPhase8CapacityQualityCounts;
  qualitySumEqualsRowCount: boolean;
  crossSource: CaliforniaPhase8CapacityCrossSource;
  rcfe: CaliforniaPhase8FileCapacityAudit;
  arf: CaliforniaPhase8FileCapacityAudit;
} {
  const quality: CaliforniaPhase8CapacityQualityCounts = {
    missing: rcfe.quality.missing + arf.quality.missing,
    invalid: rcfe.quality.invalid + arf.quality.invalid,
    zero: rcfe.quality.zero + arf.quality.zero,
    negative: rcfe.quality.negative + arf.quality.negative,
    valid: rcfe.quality.valid + arf.quality.valid,
  };
  const rowCount = rcfe.rowCount + arf.rowCount;
  const qualitySum =
    quality.missing + quality.invalid + quality.zero + quality.negative + quality.valid;
  return {
    rowCount,
    quality,
    qualitySumEqualsRowCount:
      qualitySum === rowCount
      && rcfe.qualitySumEqualsRowCount
      && arf.qualitySumEqualsRowCount,
    crossSource: {
      exactHistoricalCompared:
        rcfe.crossSource.exactHistoricalCompared
        + arf.crossSource.exactHistoricalCompared,
      inconsistentWithHistorical:
        rcfe.crossSource.inconsistentWithHistorical
        + arf.crossSource.inconsistentWithHistorical,
      historicalMissingForExactId:
        rcfe.crossSource.historicalMissingForExactId
        + arf.crossSource.historicalMissingForExactId,
      exactGisCompared:
        rcfe.crossSource.exactGisCompared + arf.crossSource.exactGisCompared,
      inconsistentWithGis:
        rcfe.crossSource.inconsistentWithGis + arf.crossSource.inconsistentWithGis,
      gisMissingForExactId:
        rcfe.crossSource.gisMissingForExactId + arf.crossSource.gisMissingForExactId,
      leadingZeroGisCollapsedCompared:
        rcfe.crossSource.leadingZeroGisCollapsedCompared
        + arf.crossSource.leadingZeroGisCollapsedCompared,
      inconsistentWithGisLeadingZeroCollapsed:
        rcfe.crossSource.inconsistentWithGisLeadingZeroCollapsed
        + arf.crossSource.inconsistentWithGisLeadingZeroCollapsed,
      officialValuesOverwritten: 0,
    },
    rcfe,
    arf,
  };
}
