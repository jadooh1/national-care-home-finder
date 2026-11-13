import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { copy } from "../../../lib/copy/account.ts";
import { copy as washingtonCopy } from "../../../lib/copy/washington-detail.ts";
import {
  CLAIM_LICENSE_STORAGE_KEY,
  claimStatusKind,
  duplicateClaimBlocks,
  ownerClaimHref,
  ownerSignInHref,
  readClaimLicense,
  writeClaimLicense,
} from "../../../lib/owner-claim.ts";

function memory() {
  const values = new Map<string, string>();
  return {
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
    removeItem(key: string) { values.delete(key); },
  };
}

test("a facility listing opens the existing owner claim path for that license", () => {
  assert.equal(ownerClaimHref("1234567"), "/owner/dashboard?license=1234567");
  assert.equal(ownerSignInHref("1234567"), "/owner?license=1234567");
  assert.equal(ownerClaimHref("12A"), "/owner/dashboard");
  assert.equal(ownerSignInHref(""), "/owner");
  const profile = readFileSync(new URL("../../../app/washington/[license]/page.tsx", import.meta.url), "utf8");
  assert.match(profile, /ownerClaimHref\(facility\.license_number\)/);
  assert.match(profile, /text\.claimReview/);
  assert.equal(washingtonCopy.en.profile.claimAction, "Claim this facility");
  assert.equal(washingtonCopy.es.profile.claimAction, "Reclamar este establecimiento");
  assert.match(washingtonCopy.en.profile.claimBody, /administrative review/);
  assert.match(washingtonCopy.es.profile.claimBody, /revisión administrativa/);
});

test("pending, approved, and rejected claims stay distinct in both languages", () => {
  assert.equal(claimStatusKind("pending"), "pending");
  assert.equal(claimStatusKind("approved"), "approved");
  assert.equal(claimStatusKind("rejected"), "rejected");
  assert.equal(claimStatusKind("submitted"), null);
  assert.notEqual(copy.en.dashboard.claimStatus.pending, copy.en.dashboard.claimStatus.approved);
  assert.notEqual(copy.en.dashboard.claimStatus.approved, copy.en.dashboard.claimStatus.rejected);
  assert.notEqual(copy.es.dashboard.claimStatus.pending, copy.es.dashboard.claimStatus.rejected);
  assert.match(copy.en.dashboard.claimStatusNote.pending, /administrator/);
  assert.match(copy.es.dashboard.claimStatusNote.approved, /DSHS/);
  const dashboard = readFileSync(new URL("../../../app/owner/dashboard/page.tsx", import.meta.url), "utf8");
  assert.match(dashboard, /text\.claimStatus\[/);
  assert.match(dashboard, /text\.claimStatusNote\[/);
});

test("a pending or approved claim blocks a duplicate and a rejected claim does not", () => {
  const facility = "facility-1";
  assert.equal(duplicateClaimBlocks([{ facility_id: facility, verification_status: "pending" }], facility), true);
  assert.equal(duplicateClaimBlocks([{ facility_id: facility, verification_status: "approved" }], facility), true);
  assert.equal(duplicateClaimBlocks([{ facility_id: facility, verification_status: "rejected" }], facility), false);
  assert.equal(duplicateClaimBlocks([{ facility_id: "facility-2", verification_status: "pending" }], facility), false);
  const dashboard = readFileSync(new URL("../../../app/owner/dashboard/page.tsx", import.meta.url), "utf8");
  assert.match(dashboard, /duplicateClaimBlocks\(claims, selected\.id\)/);
  assert.match(dashboard, /submit_owner_claim/);
  const storage = memory();
  writeClaimLicense(storage, "123456789012345678901");
  assert.equal(readClaimLicense(storage), null);
  writeClaimLicense(storage, "42");
  assert.equal(storage.getItem(CLAIM_LICENSE_STORAGE_KEY), "42");
  writeClaimLicense(storage, null);
  assert.equal(readClaimLicense(storage), null);
});
