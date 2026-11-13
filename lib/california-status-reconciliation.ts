export const CALIFORNIA_LIVE_LICENSED = "Licensed";
export const CALIFORNIA_LIVE_PENDING = "Pending";
export const CALIFORNIA_LIVE_PROBATION = "Probation";

export const CALIFORNIA_STATUS_SAMPLE = {
  observedOn: "2026-11-13",
  rcfeRequested: 3,
  arfRequested: 3,
  completed: 0,
  timedOut: 6,
  forbidden: 0,
  retriedAfterForbidden: false,
} as const;

export type CaliforniaStatusClassification = "match" | "conflict" | "missing" | "inconclusive";

export type CaliforniaStatusObservation = {
  openDataStatus: string;
  httpStatus: number | null;
  liveStatus: string | null;
  identifierMatched: boolean;
};

export type CaliforniaStatusReconciliation = {
  classification: CaliforniaStatusClassification;
  openDataStatus: string;
  liveStatus: string | null;
  currentlyActive: false;
  confirmedClosure: boolean;
};

function normalizedLiveStatus(liveStatus: string | null): string | null {
  if (liveStatus == null) return null;
  const trimmed = liveStatus.trim();
  return trimmed === "" ? null : trimmed;
}

function responseUnavailable(httpStatus: number | null): boolean {
  return httpStatus == null || httpStatus === 0 || httpStatus === 403 || httpStatus >= 500;
}

function statusesAgree(openDataStatus: string, liveStatus: string): boolean {
  if (openDataStatus === "LICENSED") return liveStatus === CALIFORNIA_LIVE_LICENSED;
  if (openDataStatus === "PENDING") return liveStatus === CALIFORNIA_LIVE_PENDING;
  if (openDataStatus === "ON PROBATION") return liveStatus === CALIFORNIA_LIVE_PROBATION;
  if (openDataStatus === "CLOSED") return liveStatus.includes("Closed");
  return false;
}

export function reconcileCaliforniaStatus(
  observation: CaliforniaStatusObservation,
): CaliforniaStatusReconciliation {
  const liveStatus = normalizedLiveStatus(observation.liveStatus);
  const base = {
    openDataStatus: observation.openDataStatus,
    liveStatus,
    currentlyActive: false as const,
    confirmedClosure: false,
  };
  if (responseUnavailable(observation.httpStatus)) {
    return { ...base, classification: "inconclusive" };
  }
  if (observation.httpStatus !== 200 || !observation.identifierMatched) {
    return { ...base, classification: "missing" };
  }
  if (liveStatus == null) {
    return { ...base, classification: "inconclusive" };
  }
  const confirmedClosure = liveStatus.includes("Closed");
  return {
    ...base,
    classification: statusesAgree(observation.openDataStatus, liveStatus) ? "match" : "conflict",
    confirmedClosure,
  };
}
