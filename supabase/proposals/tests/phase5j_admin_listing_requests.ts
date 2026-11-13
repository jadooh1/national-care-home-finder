import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  authorizationDecision,
  createListingRequestGate,
  currentListingInput,
  listingRequestAfterHistoryCursor,
  listingRequestAfterProposalCursor,
  listingRequestAfterStatus,
  listingViewAfterRefresh,
  loadAdminListing,
  olderCursor,
  type AdminListingSource,
  type ListingQuery,
  type ListingRequest,
} from "../../../lib/admin-listing-requests.ts";

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

const counts = {
  data: [
    { review_status: "pending", proposal_count: 2 },
    { review_status: "approved", proposal_count: 5 },
    { review_status: "rejected", proposal_count: 1 },
  ],
  error: null,
};

function sourceFor(holds: Map<number, ReturnType<typeof deferred<ListingQuery>>>): AdminListingSource & { seen: ListingRequest[] } {
  const seen: ListingRequest[] = [];
  return {
    seen,
    listEdits(request) {
      seen.push(request);
      const hold = holds.get(request.id);
      if (!hold) return Promise.resolve({ data: [], error: null });
      return hold.promise;
    },
    listHistory(request) {
      return Promise.resolve({
        data: [{ id: `history-${request.historyCursor?.beforeId ?? "first"}`, facility_id: `home-${request.status}`, created_at: "2026-04-01T00:00:00Z", event_type: "published", published_value: request.status }],
        error: null,
      });
    },
    countEdits() {
      return Promise.resolve(counts);
    },
    listFacilities(ids) {
      return Promise.resolve({
        data: ids.map(id => ({ id, canonical_name: `Name ${id}`, license_number: "100" })),
        error: null,
      });
    },
  };
}

test("a slower status filter cannot replace the latest proposals, counts, history, facilities, or error", async () => {
  const gate = createListingRequestGate();
  const holds = new Map<number, ReturnType<typeof deferred<ListingQuery>>>();
  const source = sourceFor(holds);
  const pending = gate.start(currentListingInput("pending", null, { before: "2026-03-01T00:00:00Z", beforeId: "history-page" }));
  holds.set(pending.id, deferred());
  const pendingLoad = loadAdminListing(source, gate, pending);
  const approved = gate.start(listingRequestAfterStatus(pending, "approved"));
  holds.set(approved.id, deferred());
  const approvedLoad = loadAdminListing(source, gate, approved);

  approved.id && holds.get(approved.id)?.resolve({
    data: [{ id: "approved-row", facility_id: "home-approved", review_status: "approved", created_at: "2026-06-01T00:00:00Z" }],
    error: null,
  });
  const latest = await approvedLoad;
  holds.get(pending.id)?.resolve({ data: null, error: { message: "stale failure" } });
  const older = await pendingLoad;

  assert.equal(older.status, "stale");
  assert.equal(latest.status, "ready");
  if (latest.status !== "ready") return;
  assert.equal((latest.proposals[0] as { id: string }).id, "approved-row");
  assert.equal((latest.history[0] as { id: string }).id, "history-history-page");
  assert.equal(latest.counts.approved, 5);
  assert.equal(latest.counts.pending, 2);
  assert.equal(latest.facilities?.["home-approved"].canonical_name, "Name home-approved");
  assert.equal(latest.error, "");
  assert.equal(latest.loading, false);
  assert.equal(approved.historyCursor?.beforeId, "history-page");
  assert.equal(approved.proposalCursor, null);
  assert.equal(source.seen[1].status, "approved");
  assert.equal(source.seen[0].status, "pending");
});

test("proposal and publication pages keep independent cursors when an older page returns late", async () => {
  const gate = createListingRequestGate();
  const holds = new Map<number, ReturnType<typeof deferred<ListingQuery>>>();
  const source = sourceFor(holds);
  const first = currentListingInput("pending", null, null);
  const proposalPage = listingRequestAfterProposalCursor(first, olderCursor({ id: "proposal-1", created_at: "2026-05-01T00:00:00Z" }));
  const startedProposal = gate.start(proposalPage);
  holds.set(startedProposal.id, deferred());
  const proposalLoad = loadAdminListing(source, gate, startedProposal);
  const historyPage = listingRequestAfterHistoryCursor(proposalPage, olderCursor({ id: "history-1", created_at: "2026-04-01T00:00:00Z" }));
  const startedHistory = gate.start(historyPage);
  holds.set(startedHistory.id, deferred());
  const historyLoad = loadAdminListing(source, gate, startedHistory);

  holds.get(startedHistory.id)?.resolve({
    data: [{ id: "proposal-page-2", facility_id: "home-pending", review_status: "pending", created_at: "2026-04-15T00:00:00Z" }],
    error: null,
  });
  const latest = await historyLoad;
  holds.get(startedProposal.id)?.resolve({
    data: [{ id: "should-not-apply", facility_id: "home-pending", review_status: "pending", created_at: "2026-05-01T00:00:00Z" }],
    error: null,
  });
  const older = await proposalLoad;

  assert.deepEqual(startedProposal.proposalCursor, { before: "2026-05-01T00:00:00Z", beforeId: "proposal-1" });
  assert.equal(startedProposal.historyCursor, null);
  assert.deepEqual(startedHistory.proposalCursor, { before: "2026-05-01T00:00:00Z", beforeId: "proposal-1" });
  assert.deepEqual(startedHistory.historyCursor, { before: "2026-04-01T00:00:00Z", beforeId: "history-1" });
  assert.equal(older.status, "stale");
  assert.equal(latest.status, "ready");
  if (latest.status !== "ready") return;
  assert.equal((latest.proposals[0] as { id: string }).id, "proposal-page-2");
  assert.equal((latest.history[0] as { id: string }).id, "history-history-1");
  assert.equal(source.seen[1].proposalCursor?.beforeId, "proposal-1");
  assert.equal(source.seen[1].historyCursor?.beforeId, "history-1");
});

test("a failed or superseded proposal view keeps the page still on screen", () => {
  const previous = currentListingInput("pending", { before: "2026-05-01T00:00:00Z", beforeId: "proposal-1" }, { before: "2026-03-01T00:00:00Z", beforeId: "history-1" });
  const approved = listingRequestAfterStatus(previous, "approved");
  const failed = listingViewAfterRefresh(previous, approved, "error");
  assert.equal(failed.status, "pending");
  assert.equal(failed.proposalCursor?.beforeId, "proposal-1");
  assert.equal(failed.historyCursor?.beforeId, "history-1");
  const superseded = listingViewAfterRefresh(previous, approved, "stale");
  assert.equal(superseded.status, "pending");
  assert.equal(superseded.proposalCursor?.beforeId, "proposal-1");
  const applied = listingViewAfterRefresh(previous, approved, "applied");
  assert.equal(applied.status, "approved");
  assert.equal(applied.proposalCursor, null);
  assert.equal(applied.historyCursor?.beforeId, "history-1");
  const olderHistory = listingRequestAfterHistoryCursor(previous, olderCursor({ id: "history-2", created_at: "2026-02-01T00:00:00Z" }));
  const historyFailed = listingViewAfterRefresh(previous, olderHistory, "error");
  assert.equal(historyFailed.proposalCursor?.beforeId, "proposal-1");
  assert.equal(historyFailed.historyCursor?.beforeId, "history-1");
  const historyApplied = listingViewAfterRefresh(previous, olderHistory, "applied");
  assert.equal(historyApplied.proposalCursor?.beforeId, "proposal-1");
  assert.deepEqual(historyApplied.historyCursor, { before: "2026-02-01T00:00:00Z", beforeId: "history-2" });
  historyApplied.historyCursor!.beforeId = "changed";
  assert.equal(olderHistory.historyCursor?.beforeId, "history-2");
  const page = readFileSync(new URL("../../../app/admin/listing-edits/page.tsx", import.meta.url), "utf8");
  assert.match(page, /if \(result !== "applied"\) return;/);
  assert.match(page, /listingViewAfterRefresh\(previous, next, result\)/);
  assert.doesNotMatch(page, /reviewStatus\.current = request\.status/);
  assert.doesNotMatch(page, /editCursor\.current = next/);
  assert.doesNotMatch(page, /historyCursor\.current = next/);
});

test("a copied cursor stays stable if the caller later changes the original", () => {
  const gate = createListingRequestGate();
  const cursor = { before: "2026-01-01T00:00:00Z", beforeId: "row-1" };
  const request = gate.start(currentListingInput("all", cursor, null));
  cursor.beforeId = "changed";
  assert.equal(request.proposalCursor?.beforeId, "row-1");
});

test("an older authorization result cannot deny or allow over a newer request", () => {
  const gate = createListingRequestGate();
  const first = gate.start(currentListingInput("pending", null, null));
  const second = gate.start(currentListingInput("pending", null, null));
  assert.equal(authorizationDecision(gate, first.id, false), "stale");
  assert.equal(authorizationDecision(gate, second.id, false), "denied");
  assert.equal(authorizationDecision(gate, second.id, true), "allowed");
});
