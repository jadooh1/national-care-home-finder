import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { copy as directoryCopy } from "../../../lib/copy/washington-directory.ts";
import { copy as detailCopy } from "../../../lib/copy/washington-detail.ts";
import { washingtonVisitChecklistLink } from "../../../lib/family-journey.ts";

test("a comparison opens the same visit checklist and keeps the search", () => {
  assert.equal(
    washingtonVisitChecklistLink("/washington/100001", "/washington?city=Seattle&page=2"),
    "/washington/100001?from=%2Fwashington%3Fcity%3DSeattle%26page%3D2#visit-heading",
  );
  assert.equal(washingtonVisitChecklistLink("/washington/100001", "/washington"), "/washington/100001#visit-heading");
  assert.equal(directoryCopy.en.prepareVisit, "Prepare for a visit");
  assert.equal(directoryCopy.es.prepareVisit, "Prepárese para una visita");
  assert.equal(detailCopy.en.profile.visitQuestions.length, 6);
  assert.equal(detailCopy.es.profile.visitQuestions.length, 6);
  assert.deepEqual([...detailCopy.en.profile.visitQuestions], [...detailCopy.en.profile.visitQuestions]);
  assert.match(detailCopy.en.profile.printReminder, /Washington DSHS/);
  assert.match(detailCopy.en.profile.printReminder, /not verified facts/);
  assert.match(detailCopy.es.profile.printReminder, /DSHS de Washington/);
  assert.match(detailCopy.es.profile.printReminder, /no son datos verificados/);
  const directory = readFileSync("app/washington/page.tsx", "utf8");
  const profile = readFileSync("app/washington/[license]/page.tsx", "utf8");
  const home = readFileSync("lib/copy/home.ts", "utf8");
  assert.match(directory, /washingtonVisitChecklistLink\(profile, directoryPath\)/);
  assert.match(directory, /t\.prepareVisit/);
  assert.match(directory, /writeWashingtonShortlist\(window\.sessionStorage/);
  assert.match(directory, /t\.vacanciesNotShown/);
  assert.match(profile, /window\.print\(\)/);
  assert.match(profile, /id="visit-sheet"/);
  assert.match(profile, /location\.hash !== "#visit-heading"/);
  assert.match(profile, /scrollIntoView/);
  assert.match(profile, /body \* \{ display: none !important; \}/);
  assert.match(profile, /position: static !important/);
  assert.match(profile, /text\.printReminder/);
  assert.match(profile, /text\.licenseNumber/);
  assert.match(profile, /text\.address/);
  assert.match(profile, /displayName\(facility\.canonical_name\)/);
  assert.match(profile, /text\.visitQuestions/);
  assert.doesNotMatch(profile, /<textarea|<input/);
  assert.doesNotMatch(profile, /public_phone/);
  assert.match(profile, /washingtonDirectoryReturnPath/);
  assert.match(home, /Find the right care home for your loved one/);
});
