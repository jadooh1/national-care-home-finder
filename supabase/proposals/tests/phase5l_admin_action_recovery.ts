import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  INTERRUPTED_ADMIN_RELOAD,
  UNCERTAIN_ADMIN_ACTION,
  createAdminActionGate,
  publicationRetryGuard,
  rememberCompletedWrite,
  safeAdminActionError,
  settleAdminAction,
  withdrawalKey,
  writeAccepted,
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

test("an ownership-claim decision ignores a second click and keeps a failed result distinct from approval", async () => {
  const gate = createAdminActionGate();
  const view = screen();
  let resolveWrite: (result: { data: boolean; error: null }) => void = () => {};
  const pending = new Promise<{ data: boolean; error: null }>(resolve => { resolveWrite = resolve; });
  let writes = 0;
  let reloads = 0;
  const approved = "Claim approved. The owner can propose listing text. Approval does not publish it.";
  const first = settleAdminAction(gate, "review", async () => {
    writes += 1;
    return pending;
  }, async () => {
    reloads += 1;
    return "applied";
  }, approved, view.report, () => {}, () => {});
  const second = settleAdminAction(gate, "review", async () => {
    writes += 1;
    return { data: true, error: null };
  }, async () => {
    reloads += 1;
    return "applied";
  }, "duplicate", view.report, () => {}, () => {});
  assert.equal(await second, "ignored");
  assert.equal(writes, 1);
  resolveWrite({ data: true, error: null });
  assert.equal(await first, "done");
  assert.equal(reloads, 1);
  assert.equal(view.seen[0].error, "");
  assert.equal(view.seen[0].notice, approved);
  const raw = "permission denied for function admin_approve_owner_claim owner@example.com";
  const failed = await settleAdminAction(gate, "review", async () => ({ data: null, error: { message: raw } }), async () => {
    reloads += 1;
    return "applied";
  }, approved, view.report, () => {}, () => {});
  assert.equal(failed, "done");
  assert.equal(reloads, 1);
  assert.equal(view.seen[1].notice, "");
  assert.equal(view.seen[1].error.includes("owner@example.com"), false);
  assert.equal(view.seen[1].error.includes("admin_approve_owner_claim"), false);
  assert.match(view.seen[1].error, /The review was not completed/);
  const interrupted = await settleAdminAction(gate, "review", async () => ({ data: true, error: null }), async () => {
    reloads += 1;
    return "error";
  }, approved, view.report, () => {}, () => {});
  assert.equal(interrupted, "done");
  assert.equal(reloads, 2);
  assert.equal(view.seen[2].notice, "");
  assert.equal(view.seen[2].error, INTERRUPTED_ADMIN_RELOAD);
  const claims = readFileSync(new URL("../../../app/admin/claims/page.tsx", import.meta.url), "utf8");
  const gateCall = claims.indexOf("settleAdminAction(actions.current, \"review\"");
  const approve = claims.indexOf("admin_approve_owner_claim");
  const reject = claims.indexOf("admin_reject_owner_claim");
  assert.equal(gateCall >= 0 && gateCall < approve && approve < reject, true);
  assert.match(claims, /createAdminActionGate\(/);
  assert.match(claims, /return "error"/);
  assert.match(claims, /return "applied"/);
  assert.doesNotMatch(claims, /e\?\.message/);
});

test("a completed publication or withdrawal is not sent again before the list reloads", () => {
  assert.equal(publicationRetryGuard(new Set(), "edit-1"), "allow");
  assert.equal(writeAccepted({ data: true, error: null }), true);
  assert.equal(writeAccepted({ data: false, error: null }), false);
  assert.equal(writeAccepted({ data: null, error: { message: "duplicate publication owner@example.com" } }), false);
  const failed = rememberCompletedWrite(new Set(), "edit-1", false);
  assert.equal(failed.has("edit-1"), false);
  assert.equal(publicationRetryGuard(failed, "edit-1"), "allow");
  const published = rememberCompletedWrite(new Set(["edit-0"]), "edit-1", true);
  assert.equal(publicationRetryGuard(published, "edit-1"), "refresh");
  assert.equal(publicationRetryGuard(published, "edit-0"), "refresh");
  assert.equal(publicationRetryGuard(rememberCompletedWrite(published, "edit-2", false), "edit-2"), "allow");
  const description = withdrawalKey("facility-1", "description");
  const services = withdrawalKey("facility-1", "services");
  const withdrawn = rememberCompletedWrite(new Set(), description, true);
  assert.equal(publicationRetryGuard(withdrawn, description), "refresh");
  assert.equal(publicationRetryGuard(withdrawn, services), "allow");
  const page = readFileSync(new URL("../../../app/admin/listing-edits/page.tsx", import.meta.url), "utf8");
  const publishGuard = page.indexOf("publicationRetryGuard(completedPublications.current, publishId)");
  const publishRpc = page.indexOf('supabase.rpc("admin_publish_listing_edit"');
  const withdrawGuard = page.indexOf("publicationRetryGuard(completedWithdrawals.current, withdrawalKey(facilityId, fieldName))");
  const withdrawRpc = page.indexOf('supabase.rpc("admin_withdraw_published_owner_listing"');
  const staleReturn = page.indexOf('return "stale"');
  const errorReturn = page.indexOf('return "error"');
  const clearWrites = page.indexOf("completedPublications.current.clear()");
  const applied = page.indexOf('return "applied"');
  assert.equal(publishGuard >= 0 && publishGuard < publishRpc, true);
  assert.equal(withdrawGuard >= 0 && withdrawGuard < withdrawRpc, true);
  assert.equal(staleReturn < clearWrites && errorReturn < clearWrites && clearWrites < applied, true);
  assert.match(page, /rememberCompletedWrite\(completedPublications\.current, editId, writeAccepted\(response\)\)/);
  assert.match(page, /rememberCompletedWrite\(completedWithdrawals\.current, withdrawalKey\(facilityId, fieldName\), writeAccepted\(response\)\)/);
  assert.match(page, /completedWithdrawals\.current\.clear\(\)/);
});
