import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { copy as directoryCopy } from "../../../lib/copy/washington-directory.ts";
import { copy as detailCopy } from "../../../lib/copy/washington-detail.ts";
import { washingtonVisitChecklistLink } from "../../../lib/family-journey.ts";
import { scrollToVisitChecklist, visitChecklistPrintCss } from "../../../lib/washington-visit-checklist.ts";

test("a comparison opens the same visit checklist and keeps the search", () => {
  assert.equal(
    washingtonVisitChecklistLink("/washington/100001", "/washington?city=Seattle&page=2"),
    "/washington/100001?from=%2Fwashington%3Fcity%3DSeattle%26page%3D2#visit-heading",
  );
  assert.equal(washingtonVisitChecklistLink("/washington/100001", "/washington"), "/washington/100001#visit-heading");
  assert.equal(directoryCopy.en.prepareVisit, "Prepare for a visit");
  assert.equal(directoryCopy.es.prepareVisit, "Prepárese para una visita");
  assert.deepEqual([...detailCopy.en.profile.visitQuestions], [
    "Are there current vacancies, and when could a resident move in?",
    "What is the monthly rate, and which charges are extra?",
    "Which care needs can the staff support, and who is on duty?",
    "How are medications managed, and what happens in an emergency?",
    "How do visits and tours work, including times and who may attend?",
    "Where can I review the current license and inspection record?",
  ]);
  assert.deepEqual([...detailCopy.es.profile.visitQuestions], [
    "¿Hay vacantes actuales y cuándo podría mudarse un residente?",
    "¿Cuál es la tarifa mensual y qué cargos son adicionales?",
    "¿Qué necesidades de cuidado puede atender el personal y quién está de turno?",
    "¿Cómo se administran los medicamentos y qué ocurre en una emergencia?",
    "¿Cómo funcionan las visitas y los recorridos, incluidos los horarios y quién puede asistir?",
    "¿Dónde puedo revisar la licencia vigente y el registro de inspecciones?",
  ]);
  assert.match(detailCopy.en.profile.printReminder, /Washington DSHS/);
  assert.match(detailCopy.en.profile.printReminder, /not verified facts/);
  assert.match(detailCopy.es.profile.printReminder, /DSHS de Washington/);
  assert.match(detailCopy.es.profile.printReminder, /no son datos verificados/);
  const directory = readFileSync("app/washington/page.tsx", "utf8");
  const profile = readFileSync("app/washington/[license]/page.tsx", "utf8");
  const home = readFileSync("lib/copy/home.ts", "utf8");
  assert.match(directory, /washingtonVisitChecklistLink\(profile, directoryPath\)/);
  assert.match(directory, /scroll=\{false\}/);
  assert.match(directory, /washingtonFacilityLink\(profile, directoryPath\)/);
  assert.doesNotMatch(directory, /washingtonFacilityLink\(profile, directoryPath\)\} scroll=\{false\}/);
  assert.match(profile, /scrollToVisitChecklist/);
  assert.match(profile, /visitChecklistPrintCss/);
  assert.match(profile, /text\.visitQuestions/);
  assert.match(profile, /text\.printReminder/);
  assert.match(profile, /className="print-only"/);
  assert.match(profile, /className="no-print"/);
  assert.match(profile, /className="print-omit"/);
  assert.doesNotMatch(profile, /body \* \{ display: none/);
  assert.doesNotMatch(visitChecklistPrintCss, /body \*/);
  assert.match(profile, /washingtonDirectoryReturnPath/);
  assert.doesNotMatch(profile, /<textarea|<input/);
  assert.doesNotMatch(profile, /public_phone/);
  assert.match(home, /Find the right care home for your loved one/);
});

test("the checklist scrolls only after the heading can render", () => {
  const calls: Array<{ block: string }> = [];
  const heading = { scrollIntoView(options: { block: "start" }) { calls.push(options); } };
  const doc = { getElementById(id: string) { return id === "visit-heading" ? heading : null; } };
  let tops = 0;
  const scrollToTop = () => { tops += 1; };
  const ready = { loading: false, hasFacility: true, hash: "#visit-heading" };

  assert.equal(scrollToVisitChecklist({ ...ready, loading: true }, doc, scrollToTop), "unchanged");
  assert.equal(calls.length, 0);
  assert.equal(scrollToVisitChecklist({ ...ready, hash: "" }, doc, scrollToTop), "unchanged");
  assert.equal(scrollToVisitChecklist({ loading: false, hasFacility: false, hash: "#visit-heading" }, doc, scrollToTop), "top");
  assert.equal(tops, 1);
  assert.equal(scrollToVisitChecklist(ready, doc, scrollToTop), "checklist");
  assert.deepEqual(calls, [{ block: "start" }]);
  assert.equal(scrollToVisitChecklist(ready, { getElementById: () => null }, scrollToTop), "top");
  assert.equal(tops, 2);
});

type StyleRule = { selector: string; display: string; important: boolean; media: "all" | "print" };
type FixtureNode = { id: string; classes: string[]; tag: string; parent: FixtureNode | null };

function matchingBrace(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    else if (text[i] === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  throw new Error("unbalanced css");
}

function printRules(css: string): StyleRule[] {
  const rules: StyleRule[] = [];
  function walk(text: string, media: "all" | "print") {
    let i = 0;
    while (i < text.length) {
      while (i < text.length && /\s/.test(text[i])) i += 1;
      if (i >= text.length) break;
      if (text.startsWith("@media print", i)) {
        const open = text.indexOf("{", i);
        const close = matchingBrace(text, open);
        walk(text.slice(open + 1, close), "print");
        i = close + 1;
        continue;
      }
      if (text[i] === "@") {
        const open = text.indexOf("{", i);
        const close = matchingBrace(text, open);
        i = close + 1;
        continue;
      }
      const open = text.indexOf("{", i);
      if (open === -1) break;
      const close = matchingBrace(text, open);
      const selector = text.slice(i, open).trim();
      const body = text.slice(open + 1, close);
      const display = body.match(/display\s*:\s*([^;!]+?)(\s*!important)?\s*(?:;|$)/);
      if (selector && display) {
        rules.push({ selector, display: display[1].trim(), important: Boolean(display[2]), media });
      }
      i = close + 1;
    }
  }
  walk(css, "all");
  return rules;
}

function selectorMatches(selector: string, node: FixtureNode): boolean {
  return selector.split(",").some(part => {
    const token = part.trim();
    if (token.startsWith(".")) return node.classes.includes(token.slice(1));
    if (token.startsWith("#")) return node.id === token.slice(1);
    return false;
  });
}

function computedDisplay(node: FixtureNode, media: "screen" | "print", rules: StyleRule[]): string {
  let value = node.tag === "li" ? "list-item" : node.tag === "button" ? "inline-block" : "block";
  let important = false;
  for (const rule of rules) {
    if (rule.media === "print" && media !== "print") continue;
    if (!selectorMatches(rule.selector, node)) continue;
    if (rule.important || !important) {
      value = rule.display;
      important = rule.important;
    }
  }
  return value;
}

function rendered(node: FixtureNode, media: "screen" | "print", rules: StyleRule[]): boolean {
  let current: FixtureNode | null = node;
  while (current) {
    if (computedDisplay(current, media, rules) === "none") return false;
    current = current.parent;
  }
  return true;
}

function node(tag: string, classes: string[], id: string, parent: FixtureNode | null): FixtureNode {
  return { tag, classes, id, parent };
}

test("print rules show the checklist identity and hide unrelated content", () => {
  const rules = printRules(visitChecklistPrintCss);
  const main = node("main", [], "", null);
  const column = node("div", [], "", main);
  const omit = node("section", ["print-omit"], "", column);
  const omittedHeading = node("h2", [], "", omit);
  const sheet = node("section", [], "visit-sheet", column);
  const identity = node("div", ["print-only"], "identity", sheet);
  const reminder = node("p", ["print-only"], "reminder", sheet);
  const button = node("button", ["no-print"], "print-button", sheet);
  const missing = node("p", ["no-print"], "missing", sheet);
  const record = node("a", ["no-print"], "record", sheet);
  const question = node("li", [], "question", sheet);

  assert.equal(rendered(identity, "screen", rules), false);
  assert.equal(rendered(reminder, "screen", rules), false);
  assert.equal(rendered(identity, "print", rules), true);
  assert.equal(rendered(reminder, "print", rules), true);
  assert.equal(computedDisplay(identity, "print", rules), "block");
  assert.equal(rendered(button, "print", rules), false);
  assert.equal(rendered(missing, "print", rules), false);
  assert.equal(rendered(record, "print", rules), false);
  assert.equal(rendered(question, "print", rules), true);
  assert.equal(computedDisplay(question, "print", rules), "list-item");
  assert.equal(rendered(sheet, "print", rules), true);
  assert.equal(rendered(column, "print", rules), true);
  assert.equal(rendered(main, "print", rules), true);
  assert.equal(computedDisplay(sheet, "print", rules) === "none", false);
  assert.equal(rendered(omittedHeading, "print", rules), false);
  assert.equal(computedDisplay(omit, "print", rules), "none");
});

function findBrowser(): string | null {
  const candidates = [
    process.env.NCH_BROWSER,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter((value): value is string => Boolean(value));
  return candidates.find(candidate => existsSync(candidate)) ?? null;
}

test("a browser applies the print rules and scrolls after the checklist renders", { timeout: 30000 }, async (t) => {
  const browser = findBrowser();
  if (!browser) {
    t.skip("No local Chrome or Edge binary is available.");
    return;
  }
  const directory = mkdtempSync(join(tmpdir(), "nchf-visit-"));
  const htmlPath = join(directory, "checklist.html");
  const questions = detailCopy.en.profile.visitQuestions.map(question => `<li>${question}</li>`).join("");
  writeFileSync(htmlPath, `<!doctype html>
<meta charset="utf-8">
<title>checklist fixture</title>
<style>${visitChecklistPrintCss}</style>
<main id="main">
  <section class="print-omit" id="hero" style="height: 1600px">Directory header</section>
  <div id="column">
    <section id="visit-sheet">
      <div class="print-only" id="identity">${detailCopy.en.profile.printChecklist}</div>
      <h2 id="visit-heading">Prepare for a visit</h2>
      <button class="no-print" id="print-button" type="button">Print checklist</button>
      <p class="no-print" id="missing">${detailCopy.en.profile.contactAbsent}</p>
      <a class="no-print" id="record" href="#record">${detailCopy.en.profile.contactAction}</a>
      <ol id="questions">${questions}</ol>
      <p class="print-only" id="reminder">${detailCopy.en.profile.printReminder}</p>
    </section>
  </div>
</main>
<div id="after" class="print-omit" style="height: 2400px"></div>
<script>
window.scrollToVisitChecklist = ${browserFunction(scrollToVisitChecklist)};
</script>`);
  const userData = mkdtempSync(join(tmpdir(), "nchf-browser-"));
  const port = 9237 + (process.pid % 1000);
  const child = spawn(browser, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--remote-allow-origins=*",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userData}`,
    "about:blank",
  ], { stdio: "ignore", windowsHide: true });
  child.unref();
  try {
    const version = await waitForJson(`http://127.0.0.1:${port}/json/version`);
    const browserSocket = new WebSocket(version.webSocketDebuggerUrl);
    await socketOpen(browserSocket);
    const created = await cdp(browserSocket, "Target.createTarget", { url: pathToFileURL(htmlPath).href });
    const attached = await cdp(browserSocket, "Target.attachToTarget", { targetId: created.targetId, flatten: true });
    const sessionId = attached.sessionId as string;
    await cdp(browserSocket, "Page.enable", {}, sessionId);
    await cdp(browserSocket, "Runtime.enable", {}, sessionId);
    const ready = await evaluate(browserSocket, sessionId, `new Promise(resolve => {
      const start = Date.now();
      const tick = () => {
        if (typeof window.scrollToVisitChecklist === "function" || Date.now() - start > 5000) resolve(typeof window.scrollToVisitChecklist);
        else setTimeout(tick, 50);
      };
      tick();
    })`);
    assert.equal(ready, "function");
    const early = await evaluate(browserSocket, sessionId, `(() => {
      const tops = [];
      const result = window.scrollToVisitChecklist(
        { loading: true, hasFacility: true, hash: "#visit-heading" },
        document,
        () => tops.push(0),
      );
      return { result, scrollY: window.scrollY, tops: tops.length };
    })()`);
    assert.equal(early.result, "unchanged");
    assert.equal(early.scrollY, 0);
    const normalVisit = await evaluate(browserSocket, sessionId, `(() => {
      const result = window.scrollToVisitChecklist(
        { loading: false, hasFacility: true, hash: "" },
        document,
        () => window.scrollTo(0, 0),
      );
      return { result, scrollY: window.scrollY };
    })()`);
    assert.equal(normalVisit.result, "unchanged");
    assert.equal(normalVisit.scrollY, 0);
    const scrolled = await evaluate(browserSocket, sessionId, `(() => {
      history.replaceState(null, "", "#visit-heading");
      const result = window.scrollToVisitChecklist(
        { loading: false, hasFacility: true, hash: location.hash },
        document,
        () => window.scrollTo(0, 0),
      );
      const heading = document.getElementById("visit-heading").getBoundingClientRect();
      return { result, scrollY: window.scrollY, headingTop: heading.top, questionCount: document.querySelectorAll("#questions li").length };
    })()`);
    assert.equal(scrolled.result, "checklist");
    assert.ok(scrolled.scrollY > 400, `expected the checklist to move the window, scrollY=${scrolled.scrollY}`);
    assert.ok(Math.abs(scrolled.headingTop) < 40, `expected the heading near the top, top=${scrolled.headingTop}`);
    assert.equal(scrolled.questionCount, 6);
    const screenHeight = await evaluate(browserSocket, sessionId, "document.documentElement.scrollHeight");
    await cdp(browserSocket, "Emulation.setEmulatedMedia", { media: "print" }, sessionId);
    const printed = await evaluate(browserSocket, sessionId, `(() => {
      const shown = (id) => {
        let node = document.getElementById(id);
        while (node) {
          if (getComputedStyle(node).display === "none") return false;
          node = node.parentElement;
        }
        return true;
      };
      return {
        identity: shown("identity"),
        reminder: shown("reminder"),
        button: shown("print-button"),
        missing: shown("missing"),
        record: shown("record"),
        hero: shown("hero"),
        after: shown("after"),
        sheet: shown("visit-sheet"),
        main: shown("main"),
        column: shown("column"),
        question: getComputedStyle(document.querySelector("#questions li")).display,
        height: document.documentElement.scrollHeight,
      };
    })()`);
    assert.equal(printed.identity, true);
    assert.equal(printed.reminder, true);
    assert.equal(printed.button, false);
    assert.equal(printed.missing, false);
    assert.equal(printed.record, false);
    assert.equal(printed.hero, false);
    assert.equal(printed.after, false);
    assert.equal(printed.sheet, true);
    assert.equal(printed.main, true);
    assert.equal(printed.column, true);
    assert.equal(printed.question, "list-item");
    assert.ok(screenHeight > 3000);
    assert.ok(printed.height < 800, `print height ${printed.height} should collapse omitted sections`);
    browserSocket.close();
  } finally {
    if (process.platform === "win32" && child.pid) {
      spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore", windowsHide: true }).unref();
    } else {
      child.kill();
    }
    rmSync(directory, { recursive: true, force: true });
    try {
      rmSync(userData, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EBUSY") throw error;
    }
  }
});

function waitForJson(url: string): Promise<{ webSocketDebuggerUrl: string }> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const attempt = () => {
      fetch(url).then(async response => {
        resolve(await response.json() as { webSocketDebuggerUrl: string });
      }).catch(error => {
        if (Date.now() - started > 10000) reject(error);
        else setTimeout(attempt, 100);
      });
    };
    attempt();
  });
}

function socketOpen(socket: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.addEventListener("open", () => resolve(), { once: true });
    socket.addEventListener("error", () => reject(new Error("browser socket failed")), { once: true });
  });
}

type CdpResult = Record<string, unknown>;

function cdp(socket: WebSocket, method: string, params: Record<string, unknown>, sessionId?: string): Promise<CdpResult> {
  const id = Math.floor(Math.random() * 1_000_000_000);
  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent) => {
      const message = JSON.parse(String(event.data)) as { id?: number; result?: CdpResult; error?: { message: string } };
      if (message.id !== id) return;
      socket.removeEventListener("message", onMessage);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result ?? {});
    };
    socket.addEventListener("message", onMessage);
    socket.send(JSON.stringify({ id, method, params, sessionId }));
  });
}

function browserFunction(fn: (...args: never[]) => unknown): string {
  return fn.toString().replace(
    /\(\s*state:\s*ChecklistScrollState,\s*doc:\s*\{ getElementById\(id: string\): ChecklistHeading \| null \},\s*scrollToTop:\s*\(\) => void,\s*\):\s*"checklist" \| "top" \| "unchanged"/,
    "(state, doc, scrollToTop)",
  );
}

async function evaluate(socket: WebSocket, sessionId: string, expression: string): Promise<any> {
  const result = await cdp(socket, "Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId);
  const details = result.exceptionDetails as { text?: string } | undefined;
  if (details) throw new Error(details.text ?? "browser evaluation failed");
  const remote = result.result as { value?: unknown };
  return remote.value;
}
