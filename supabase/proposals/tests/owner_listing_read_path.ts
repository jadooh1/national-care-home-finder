import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CLAIMED_OWNER_CONTENT_VIEW,
  manageableOwnerContentView,
  ownerListingRefreshError,
  publishedContentOutcome,
} from "../../../lib/premium-option-a.ts";
import { PREMIUM_OWNER_CONTENT_VIEW } from "../../../lib/premium-owner-content.ts";

const ownerEdits = readFileSync("app/owner/listing-edits/page.tsx", "utf8");
const profile = readFileSync("app/washington/[license]/page.tsx", "utf8");
const adminEdits = readFileSync("app/admin/listing-edits/page.tsx", "utf8");
const helper = readFileSync("lib/premium-option-a.ts", "utf8");
const copy = readFileSync("lib/copy/account.ts", "utf8");

test("signed-in owners read only the claimed view", () => {
  assert.equal(CLAIMED_OWNER_CONTENT_VIEW, "wa_afh_claimed_owner_content");
  assert.equal(PREMIUM_OWNER_CONTENT_VIEW, "wa_afh_premium_owner_content");
  for (const supabaseUrl of [
    "https://yiehgstweswxjakbcdzc.supabase.co",
    "https://ajjsyloyihcqdomywhik.supabase.co",
    "https://www.nationalcarehomefinder.com",
    "not a url",
    "",
  ]) {
    assert.equal(manageableOwnerContentView(supabaseUrl), "wa_afh_claimed_owner_content");
  }
  assert.match(ownerEdits, /manageableOwnerContentView\(process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(ownerEdits, /verification_status", "approved"/);
  assert.match(ownerEdits, /\.in\("facility_id", ids\)/);
  assert.match(ownerEdits, /auth\.error \|\| !auth\.data\.user/);
  assert.match(ownerEdits, /router\.replace\("\/owner"\)/);
  assert.doesNotMatch(ownerEdits, /wa_afh_published_owner_content/);
  assert.doesNotMatch(helper, /wa_afh_published_owner_content/);
  assert.doesNotMatch(helper, /developmentBillingAllowed|stripe|sk_live|sk_test/i);
});

test("a failed owner-text read stays distinct from an empty listing", () => {
  assert.equal(publishedContentOutcome(true, 0), "unavailable");
  assert.equal(publishedContentOutcome(true, 2), "unavailable");
  assert.equal(publishedContentOutcome(false, 0), "empty");
  assert.equal(publishedContentOutcome(false, 1), "listed");
  assert.equal(ownerListingRefreshError({ publishedFailed: true, facilitiesFailed: false }), "published");
  assert.equal(ownerListingRefreshError({ publishedFailed: false, facilitiesFailed: true }), "facilities");
  assert.equal(ownerListingRefreshError({ publishedFailed: true, facilitiesFailed: true }), "facilities");
  assert.equal(ownerListingRefreshError({ publishedFailed: false, facilitiesFailed: false }), "");
  assert.match(ownerEdits, /publishedContentOutcome\(Boolean\(content\.error\)/);
  assert.match(ownerEdits, /catch \{[\s\S]*publishedFailed = true/);
  assert.match(ownerEdits, /published\.length === 0 && !error/);
  assert.match(copy, /Unable to load published owner text/);
  assert.match(copy, /No se puede cargar el texto publicado del propietario/);
});

test("public and administrator pages keep their existing restrictions", () => {
  assert.match(profile, /PREMIUM_OWNER_CONTENT_VIEW/);
  assert.doesNotMatch(profile, /wa_afh_published_owner_content/);
  assert.doesNotMatch(profile, /wa_afh_claimed_owner_content/);
  assert.doesNotMatch(adminEdits, /wa_afh_published_owner_content/);
  assert.match(adminEdits, /Self-review is prohibited/);
  assert.match(adminEdits, /admin_review_listing_edit/);
  assert.match(adminEdits, /admin_withdraw_published_owner_listing/);
});
