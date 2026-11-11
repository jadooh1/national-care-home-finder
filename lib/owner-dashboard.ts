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
