import assert from "node:assert/strict";
import test from "node:test";
import { createAdminActionGate, createListingRequestGate, currentListingInput, runAdminAction } from "../../../lib/admin-listing-requests.ts";

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

test("rapid clicks send one review and leave the interface settled", async () => {
  const gate = createAdminActionGate();
  const hold = deferred<boolean>();
  let calls = 0;
  let notice = "";
  let busy = false;
  let dialog = "open";
  const first = runAdminAction(gate, async () => {
    calls += 1;
    busy = true;
    return hold.promise;
  }, async () => {
    notice = "Proposal approved. This records a decision but does NOT publish changes.";
    dialog = "closed";
  }, () => { busy = false; });
  const second = runAdminAction(gate, async () => {
    calls += 1;
    return true;
  }, async () => { notice = "duplicate"; }, () => { busy = false; });
  assert.equal(await second, "ignored");
  assert.equal(calls, 1);
  assert.equal(busy, true);
  assert.equal(dialog, "open");
  hold.resolve(true);
  assert.equal(await first, "done");
  assert.equal(calls, 1);
  assert.equal(notice, "Proposal approved. This records a decision but does NOT publish changes.");
  assert.equal(dialog, "closed");
  assert.equal(busy, false);
});

test("publication and withdrawal wait until the review in flight has settled", async () => {
  const gate = createAdminActionGate();
  const hold = deferred<string>();
  const sent: string[] = [];
  const review = runAdminAction(gate, async () => {
    sent.push("review");
    return hold.promise;
  }, async () => {}, () => {});
  const publication = runAdminAction(gate, async () => {
    sent.push("publish");
    return "published";
  }, async () => {}, () => {});
  const withdrawal = runAdminAction(gate, async () => {
    sent.push("withdraw");
    return "withdrawn";
  }, async () => {}, () => {});
  assert.equal(await publication, "ignored");
  assert.equal(await withdrawal, "ignored");
  hold.resolve("reviewed");
  assert.equal(await review, "done");
  assert.deepEqual(sent, ["review"]);
  const after = runAdminAction(gate, async () => {
    sent.push("publish");
    return "published";
  }, async () => {}, () => {});
  assert.equal(await after, "done");
  assert.deepEqual(sent, ["review", "publish"]);
});

test("settling the screen cannot leave the action lock held", async () => {
  const gate = createAdminActionGate();
  await assert.rejects(runAdminAction(gate, async () => true, async () => {}, () => { throw new Error("screen update failed"); }));
  const next = runAdminAction(gate, async () => "second", async () => {}, () => {});
  assert.equal(await next, "done");
});

test("a newer listing request cannot drop a delayed action or unlock a second submission", async () => {
  const actions = createAdminActionGate();
  const listings = createListingRequestGate();
  const hold = deferred<boolean>();
  let applied = 0;
  let busy = true;
  const action = runAdminAction(actions, () => {
    busy = true;
    return hold.promise;
  }, async () => { applied += 1; }, () => { busy = false; });
  const older = listings.start(currentListingInput("pending", null, null));
  const newer = listings.start(currentListingInput("approved", null, null));
  assert.equal(listings.isLatest(older.id), false);
  assert.equal(listings.isLatest(newer.id), true);
  assert.equal(actions.tryBegin(), null);
  assert.equal(busy, true);
  hold.resolve(true);
  assert.equal(await action, "done");
  assert.equal(applied, 1);
  assert.equal(busy, false);
  assert.equal(listings.isLatest(newer.id), true);
  const again = actions.tryBegin();
  assert.equal(typeof again, "number");
  actions.finish(again as number);
});
