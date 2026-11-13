export type SearchTicket = number;

export type RefreshState = {
  claimsError: boolean;
  facilitiesError: boolean;
  activityError: boolean;
};

export type SubmissionFeedback = "failed" | "submitted" | "submitted-refresh-failed";

type ClaimRow = {
  id: string;
  facility_id: string;
  verification_status: string;
  reviewed_at: string | null;
};

export function startSearch(latest: SearchTicket): SearchTicket {
  return latest + 1;
}

export function shouldApplySearch(ticket: SearchTicket, latest: SearchTicket, mounted: boolean): boolean {
  return mounted && ticket === latest;
}

export type FacilitySearchError = "" | "short" | "search" | "none";

export type FacilitySearchModel<T> = {
  query: string;
  ticket: SearchTicket;
  mounted: boolean;
  results: readonly T[];
  searching: boolean;
  error: FacilitySearchError;
};

export function facilitySearchTerm(raw: string): string {
  return raw.trim().replace(/[^a-zA-Z0-9\s-]/g, "").slice(0, 70);
}

export function createFacilitySearch<T>(): FacilitySearchModel<T> {
  return { query: "", ticket: 0, mounted: true, results: [], searching: false, error: "" };
}

export function reduceFacilitySearch<T>(
  state: FacilitySearchModel<T>,
  action:
    | { type: "edit"; query: string }
    | { type: "submit"; liveInput: string }
    | { type: "response"; ticket: SearchTicket; ok: boolean; results: readonly T[] }
    | { type: "unmount" },
): FacilitySearchModel<T> {
  if (action.type === "unmount") return { ...state, mounted: false };
  if (action.type === "edit") {
    if (action.query === state.query) return state;
    return {
      ...state,
      query: action.query,
      ticket: startSearch(state.ticket),
      results: [],
      searching: false,
      error: "",
    };
  }
  if (action.type === "submit") {
    const query = action.liveInput;
    const base = query === state.query
      ? state
      : { ...state, query, ticket: startSearch(state.ticket), results: [], searching: false, error: "" };
    const ticket = startSearch(base.ticket);
    if (facilitySearchTerm(query).length < 3) {
      return { ...base, query, ticket, results: [], searching: false, error: "short" };
    }
    return { ...base, query, ticket, results: [], searching: true, error: "" };
  }
  if (!shouldApplySearch(action.ticket, state.ticket, state.mounted)) return state;
  if (!action.ok) return { ...state, searching: false, error: "search", results: [] };
  if (action.results.length === 0) return { ...state, searching: false, error: "none", results: [] };
  return { ...state, searching: false, error: "", results: action.results };
}

export function claimSubmitGate(inFlight: boolean): "start" | "ignore" {
  return inFlight ? "ignore" : "start";
}

export function classifySubmission(rpcAccepted: boolean, refresh: RefreshState): SubmissionFeedback {
  if (!rpcAccepted) return "failed";
  if (refresh.claimsError || refresh.facilitiesError || refresh.activityError) return "submitted-refresh-failed";
  return "submitted";
}

export function rememberSubmittedClaim<T extends ClaimRow>(claims: readonly T[], facilityId: string): T[] {
  const local = {
    id: `local-${facilityId}`,
    facility_id: facilityId,
    verification_status: "pending",
    reviewed_at: null,
  } as T;
  return [local, ...claims.filter(claim => claim.id !== local.id)];
}
