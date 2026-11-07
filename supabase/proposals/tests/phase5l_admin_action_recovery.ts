import assert from "node:assert/strict";
import test from "node:test";
import {
  INTERRUPTED_ADMIN_RELOAD,
  UNCERTAIN_ADMIN_ACTION,
  createAdminActionGate,
  safeAdminActionError,
  settleAdminAction,
  type AdminActionReport,
} from "../../../lib/admin-listing-requests.ts";

function screen() {
  const seen: AdminActionReport[] = [];
  return {
    seen,
    report(update: AdminActionReport) {
      seen.push(update);
    },
  };
}

test("a network failure releases the lock, hides the raw error, and does not retry the write", async () => {
  const gate = createAdminActionGate();
  const view = screen();
  let writes = 0;
  let busy = true;
  const raw = "TypeError: Failed to fetch https://secret.example/rpc owner@example.com token=abc";
  const outcome = await settleAdminAction(gate, "review", async () => {
    writes += 1;
    throw new Error(raw);
  }, async () => {
    throw new Error("reload should not run");
  }, "saved", view.report, () => {}, () => { busy = false; });
  assert.equal(outcome, "done");
  assert.equal(writes, 1);
  assert.equal(busy, false);
  assert.equal(view.seen.length, 1);
  assert.equal(view.seen[0].error, UNCERTAIN_ADMIN_ACTION);
  assert.equal(view.seen[0].notice, "");
  assert.equal(view.seen[0].error.includes("secret"), false);
  assert.equal(view.seen[0].error.includes("owner@example.com"), false);
  assert.equal(view.seen[0].error.includes("token"), false);
  assert.notEqual(gate.tryBegin(), null);
});

test("a rejected publication shows a safe error and does not reload or retry", async () => {
  const gate = createAdminActionGate();
  const view = screen();
  let writes = 0;
  let reloads = 0;
  const raw = `duplicate key value violates unique constraint "published_owner_listings_pkey" for owner@example.com`;
  const outcome = await settleAdminAction(gate, "publish", async () => {
    writes += 1;
    return { data: null, error: { message: raw } };
  }, async () => {
    reloads += 1;
    return "applied";
  }, "saved", view.report, () => {}, () => {});
  assert.equal(outcome, "done");
  assert.equal(writes, 1);
  assert.equal(reloads, 0);
  assert.equal(view.seen[0].error, safeAdminActionError("publish", raw));
  assert.equal(view.seen[0].error.includes("published_owner_listings_pkey"), false);
  assert.equal(view.seen[0].error.includes("owner@example.com"), false);
  assert.equal(view.seen[0].notice, "");
  assert.match(safeAdminActionError("withdraw", "self-review is not allowed"), /^You cannot review/);
  assert.notEqual(gate.tryBegin(), null);
});

test("an interrupted reload does not repeat the withdrawal and leaves a manual refresh available", async () => {
  const gate = createAdminActionGate();
  const view = screen();
  let writes = 0;
  let reloads = 0;
  let closed = false;
  const outcome = await settleAdminAction(gate, "withdraw", async () => {
    writes += 1;
    return { data: true, error: null };
  }, async () => {
    reloads += 1;
    throw new Error("listing request failed after the write");
  }, "Owner text was removed from the public profile.", view.report, () => { closed = true; }, () => {});
  assert.equal(outcome, "done");
  assert.equal(writes, 1);
  assert.equal(reloads, 1);
  assert.equal(closed, true);
  assert.equal(view.seen[0].error, INTERRUPTED_ADMIN_RELOAD);
  assert.equal(view.seen[0].notice, "");
  const followed = await settleAdminAction(gate, "review", async () => {
    writes += 1;
    return { data: true, error: null };
  }, async () => {
    reloads += 1;
    return "stale";
  }, "checked the latest state", view.report, () => { closed = true; }, () => {});
  assert.equal(followed, "done");
  assert.equal(writes, 2);
  assert.equal(reloads, 2);
  assert.equal(view.seen.length, 1);
});
