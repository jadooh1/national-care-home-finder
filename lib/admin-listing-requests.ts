export type ListingCursor = { before: string; beforeId: string } | null;

export type ListingRequestInput = {
  status: string;
  proposalCursor: ListingCursor;
  historyCursor: ListingCursor;
};

export type ListingRequest = ListingRequestInput & { id: number };

export type ProposalTotals = { pending: number; approved: number; rejected: number };

export type ListingQuery = {
  data: unknown;
  error: { message: string } | null;
};

export type AdminListingSource = {
  listEdits(request: ListingRequest): Promise<ListingQuery>;
  listHistory(request: ListingRequest): Promise<ListingQuery>;
  countEdits(): Promise<ListingQuery>;
  listFacilities(ids: string[]): Promise<ListingQuery>;
};

export type FacilityDetails = { id: string; canonical_name: string; license_number: string | null };

export type ListingLoad =
  | { status: "stale" }
  | { status: "error"; error: string; loading: false }
  | {
      status: "ready";
      proposals: unknown[];
      history: unknown[];
      counts: ProposalTotals;
      facilities: Record<string, FacilityDetails> | null;
      error: "";
      loading: false;
    };

export type ListingRequestGate = {
  start(input: ListingRequestInput): ListingRequest;
  isLatest(id: number): boolean;
};

const PROPOSAL_ERROR = "Unable to load proposals. Check administrator access.";
const HISTORY_ERROR = "Unable to load publication history. Check administrator access.";

function copyCursor(cursor: ListingCursor): ListingCursor {
  if (!cursor) return null;
  return { before: cursor.before, beforeId: cursor.beforeId };
}

export function createListingRequestGate(): ListingRequestGate {
  let latest = 0;
  return {
    start(input) {
      latest += 1;
      return {
        id: latest,
        status: input.status,
        proposalCursor: copyCursor(input.proposalCursor),
        historyCursor: copyCursor(input.historyCursor),
      };
    },
    isLatest(id) {
      return id === latest;
    },
  };
}

export function currentListingInput(status: string, proposalCursor: ListingCursor, historyCursor: ListingCursor): ListingRequestInput {
  return {
    status,
    proposalCursor: copyCursor(proposalCursor),
    historyCursor: copyCursor(historyCursor),
  };
}

export function listingRequestAfterStatus(current: ListingRequestInput, status: string): ListingRequestInput {
  return {
    status,
    proposalCursor: null,
    historyCursor: copyCursor(current.historyCursor),
  };
}

export function listingRequestAfterProposalCursor(current: ListingRequestInput, proposalCursor: ListingCursor): ListingRequestInput {
  return {
    status: current.status,
    proposalCursor: copyCursor(proposalCursor),
    historyCursor: copyCursor(current.historyCursor),
  };
}

export function listingRequestAfterHistoryCursor(current: ListingRequestInput, historyCursor: ListingCursor): ListingRequestInput {
  return {
    status: current.status,
    proposalCursor: copyCursor(current.proposalCursor),
    historyCursor: copyCursor(historyCursor),
  };
}

export function olderCursor(row: { id?: string; created_at?: string } | undefined): ListingCursor {
  if (!row?.id || !row.created_at) return null;
  return { before: row.created_at, beforeId: row.id };
}

export function proposalTotals(data: unknown): ProposalTotals | null {
  if (!Array.isArray(data) || data.length !== 3) return null;
  const totals: ProposalTotals = { pending: Number.NaN, approved: Number.NaN, rejected: Number.NaN };
  for (const row of data) {
    if (!row || typeof row !== "object") return null;
    const record = row as { review_status?: unknown; proposal_count?: unknown };
    const name = record.review_status;
    if (name !== "pending" && name !== "approved" && name !== "rejected") return null;
    const count = typeof record.proposal_count === "number" ? record.proposal_count : typeof record.proposal_count === "string" ? Number(record.proposal_count) : Number.NaN;
    if (!Number.isFinite(count)) return null;
    totals[name] = count;
  }
  if (!Number.isFinite(totals.pending) || !Number.isFinite(totals.approved) || !Number.isFinite(totals.rejected)) return null;
  return totals;
}

function rowsOf(data: unknown): unknown[] {
  return Array.isArray(data) ? data : [];
}

export async function loadAdminListing(source: AdminListingSource, gate: ListingRequestGate, request: ListingRequest): Promise<ListingLoad> {
  const edits = await source.listEdits(request);
  if (!gate.isLatest(request.id)) return { status: "stale" };
  if (edits.error) return { status: "error", error: PROPOSAL_ERROR, loading: false };
  const proposals = rowsOf(edits.data);

  const events = await source.listHistory(request);
  if (!gate.isLatest(request.id)) return { status: "stale" };
  if (events.error) return { status: "error", error: HISTORY_ERROR, loading: false };
  const history = rowsOf(events.data);

  const totals = await source.countEdits();
  if (!gate.isLatest(request.id)) return { status: "stale" };
  const counts = totals.error ? null : proposalTotals(totals.data);
  if (!counts) return { status: "error", error: PROPOSAL_ERROR, loading: false };

  const ids = [...new Set([...proposals, ...history].map(row => {
    if (!row || typeof row !== "object") return "";
    const facilityId = (row as { facility_id?: unknown }).facility_id;
    return typeof facilityId === "string" ? facilityId : "";
  }).filter(Boolean))];

  let facilities: Record<string, FacilityDetails> | null = null;
  if (ids.length === 0) {
    facilities = {};
  } else {
    const homes = await source.listFacilities(ids);
    if (!gate.isLatest(request.id)) return { status: "stale" };
    if (!homes.error && Array.isArray(homes.data)) {
      facilities = {};
      for (const home of homes.data) {
        if (!home || typeof home !== "object") continue;
        const record = home as FacilityDetails;
        if (typeof record.id === "string") facilities[record.id] = record;
      }
    }
  }

  if (!gate.isLatest(request.id)) return { status: "stale" };
  return { status: "ready", proposals, history, counts, facilities, error: "", loading: false };
}

export function authorizationDecision(gate: ListingRequestGate, requestId: number, allowed: boolean): "stale" | "allowed" | "denied" {
  if (!gate.isLatest(requestId)) return "stale";
  return allowed ? "allowed" : "denied";
}

export type AdminActionGate = {
  tryBegin(): number | null;
  isCurrent(token: number): boolean;
  finish(token: number): void;
};

export function createAdminActionGate(): AdminActionGate {
  let next = 0;
  let held: number | null = null;
  return {
    tryBegin() {
      if (held !== null) return null;
      next += 1;
      held = next;
      return next;
    },
    isCurrent(token) {
      return held === token;
    },
    finish(token) {
      if (held === token) held = null;
    },
  };
}

export async function runAdminAction<T>(
  gate: AdminActionGate,
  perform: () => Promise<T>,
  apply: (result: T) => Promise<void> | void,
  onSettled: () => void,
): Promise<"ignored" | "done"> {
  const token = gate.tryBegin();
  if (token === null) return "ignored";
  try {
    const result = await perform();
    if (gate.isCurrent(token)) await apply(result);
    return "done";
  } finally {
    if (gate.isCurrent(token)) {
      try {
        onSettled();
      } finally {
        gate.finish(token);
      }
    }
  }
}

export type AdminActionKind = "review" | "publish" | "withdraw";
export type AdminWriteResult = { data: unknown; error: { message?: string } | null };
export type AdminReloadResult = "applied" | "stale" | "error";
export type AdminActionReport = { error: string; notice: string };

export const UNCERTAIN_ADMIN_ACTION = "The connection failed before the result was confirmed. It was not retried. Use Refresh to check the latest saved state.";
export const INTERRUPTED_ADMIN_RELOAD = "The action was recorded, but the latest list did not load. It was not retried. Use Refresh to check the latest saved state.";

const KNOWN_ACTION_ERRORS: Record<string, string> = {
  "administrator required": "Administrator access is required.",
  "self-review is not allowed": "You cannot review, publish, or withdraw your own submission.",
  "decision is not allowed": "That review decision is not available.",
  "listing edit was not found": "That proposal was not found.",
  "proposal is not pending": "That proposal is no longer pending.",
  "proposal is not approved": "Only an approved proposal can be published.",
  "field is not allowed": "That listing field cannot be changed.",
  "proposed text is not available": "The proposed text is not available.",
  "proposed text must be 1 to 2000 characters": "The proposed text must be 1 to 2000 characters.",
  "facility is not eligible": "That facility is not eligible.",
  "approved claim required": "An approved ownership claim is required.",
  "published owner text was not found": "There is no published owner text to withdraw.",
};

export function safeAdminActionError(kind: AdminActionKind, message: string | undefined): string {
  const known = typeof message === "string" ? KNOWN_ACTION_ERRORS[message.trim()] : undefined;
  const lead = known ?? (kind === "review" ? "The review was not completed." : kind === "publish" ? "Publication was not completed." : "Withdrawal was not completed.");
  return `${lead} It was not retried. Use Refresh to check the latest saved state.`;
}

export async function settleAdminAction(
  gate: AdminActionGate,
  kind: AdminActionKind,
  perform: () => Promise<AdminWriteResult>,
  reload: () => Promise<AdminReloadResult>,
  savedNotice: string,
  report: (update: AdminActionReport) => void,
  close: () => void,
  onSettled: () => void,
): Promise<"ignored" | "done"> {
  return runAdminAction(gate, async () => {
    try {
      return await perform();
    } catch {
      return { data: null, error: null, uncertain: true as const };
    }
  }, async (result) => {
    if ("uncertain" in result && result.uncertain) {
      report({ error: UNCERTAIN_ADMIN_ACTION, notice: "" });
      close();
      return;
    }
    if (result.error || result.data !== true) {
      report({ error: safeAdminActionError(kind, result.error?.message), notice: "" });
      close();
      return;
    }
    let loaded: AdminReloadResult;
    try {
      loaded = await reload();
    } catch {
      loaded = "error";
    }
    if (loaded === "stale") {
      close();
      return;
    }
    if (loaded === "error") {
      report({ error: INTERRUPTED_ADMIN_RELOAD, notice: "" });
      close();
      return;
    }
    report({ error: "", notice: savedNotice });
    close();
  }, onSettled);
}
