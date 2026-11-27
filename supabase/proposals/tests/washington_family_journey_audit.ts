import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { createContext, runInContext } from "node:vm";
import type { WashingtonShortlistItem } from "../../../lib/washington-shortlist.ts";

const component = readFileSync(new URL("../../../components/washington-print-comparison.tsx", import.meta.url), "utf8");
const directory = readFileSync(new URL("../../../app/washington/washington-directory-client.tsx", import.meta.url), "utf8");

function comparisonAddress(item: WashingtonShortlistItem, t: { missing: string }): string {
  const start = component.indexOf("export function comparisonAddress");
  const end = component.indexOf("export function WashingtonPrintComparison");
  const source = component.slice(start, end).replace(
    "export function comparisonAddress(item: WashingtonShortlistItem, t: { missing: string }): string",
    "function comparisonAddress(item, t)",
  );
  const sandbox: { comparisonAddress?: typeof comparisonAddress } = {};
  runInContext(`${source}; this.comparisonAddress = comparisonAddress;`, createContext(sandbox));
  if (!sandbox.comparisonAddress) throw new Error("comparison address helper was not readable");
  return sandbox.comparisonAddress(item, t);
}

function sample(overrides: Partial<WashingtonShortlistItem> = {}): WashingtonShortlistItem {
  return {
    license: "100001",
    name: "Example Home",
    addressLine: null,
    city: null,
    county: null,
    stateCode: null,
    postalCode: null,
    licensedCapacity: null,
    recordStatus: "unverified",
    ...overrides,
  };
}

test("a printed comparison address keeps long text and says when the address is missing", () => {
  const longStreet = `${"North ".repeat(40)}Avenue`;
  assert.ok(longStreet.length > 200);
  const printed = comparisonAddress(sample({
    addressLine: longStreet,
    city: "Seattle",
    stateCode: "WA",
    postalCode: "98101",
  }), { missing: "Not available" });
  assert.equal(printed, `${longStreet}, Seattle, WA, 98101`);
  assert.equal(printed.includes(longStreet), true);
  assert.equal(comparisonAddress(sample(), { missing: "Not available" }), "Not available");
  assert.equal(comparisonAddress(sample({ city: "Seattle", stateCode: "WA" }), { missing: "No disponible" }), "Seattle, WA");
});

test("comparison printing removes the surrounding directory from the page flow", () => {
  assert.match(component, /\.nchf-print-omit, \.nchf-print-trigger \{ display: none !important; \}/);
  assert.match(component, /position: static !important/);
  assert.match(component, /min-height: 0 !important/);
  assert.match(component, /minHeight: 44/);
  assert.match(directory, /className="nchf-print-omit"/);
  assert.match(directory, /<WashingtonPrintComparison items=\{shortlist\} locale=\{locale\}/);
  assert.match(directory, /minHeight: 44/);
  assert.doesNotMatch(component, /writeWashingtonShortlist|persistShortlist/);
});

function findBrowser(): string | null {
  const candidates = [
    process.env.NCH_BROWSER,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter((value): value is string => Boolean(value));
  return candidates.find(candidate => existsSync(candidate)) ?? null;
}

test("print media keeps a long comparison address without blank directory pages", { timeout: 45000 }, async (t) => {
  const browser = findBrowser();
  if (!browser) {
    t.skip("No local Chrome or Edge binary is available.");
    return;
  }
  const cssStart = component.indexOf(".nchf-print-sheet { display: none; }");
  const cssEnd = component.indexOf("`}</style>");
  const css = component.slice(cssStart, cssEnd);
  const directory = mkdtempSync(join(tmpdir(), "nchf-print-audit-"));
  const htmlPath = join(directory, "comparison.html");
  const longStreet = `${"North ".repeat(30)}Avenue`;
  writeFileSync(htmlPath, `<!doctype html><meta charset="utf-8"><style>${css}</style>
<main>
  <section class="nchf-print-omit" style="height:2200px">Directory results</section>
  <section class="nchf-print-sheet">
    <h1>Washington adult family home comparison</h1>
    <table><tbody><tr><th scope="row">Example Home</th><td id="address">${longStreet}, Seattle, WA, 98101</td><td>100001</td><td>Not available</td><td>DSHS license-number match — not independently verified</td></tr></tbody></table>
    <p>Recorded licensed capacity is not vacancy availability.</p>
  </section>
</main>`);
  const userData = mkdtempSync(join(tmpdir(), "nchf-print-browser-"));
  const port = 9400 + (process.pid % 500);
  const child = spawn(browser, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-background-networking",
    "--disable-software-rasterizer",
    "--remote-allow-origins=*",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userData}`,
    "about:blank",
  ], { stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  child.unref();
  let browserWsUrl: string;
  try {
    browserWsUrl = await waitForBrowserSocket(child, port);
  } catch (error) {
    if (process.platform === "win32" && child.pid) {
      spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore", windowsHide: true }).unref();
    } else {
      child.kill();
    }
    try {
      rmSync(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    } catch {
      /* best-effort cleanup before skip */
    }
    try {
      rmSync(userData, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    } catch {
      /* best-effort cleanup before skip */
    }
    t.skip(
      `Browser debugging endpoint did not open (${error instanceof Error ? error.message.split("\n")[0] : String(error)}). Non-browser print audit checks already passed.`,
    );
    return;
  }
  try {
    const socket = new WebSocket(browserWsUrl);
    await new Promise<void>((resolve, reject) => {
      socket.addEventListener("open", () => resolve(), { once: true });
      socket.addEventListener("error", () => reject(new Error("browser socket failed")), { once: true });
    });
    // Open about:blank first, enable Page/Runtime, then navigate so we do not
    // race Runtime.evaluate against Target.createTarget's in-flight file:// load
    // (CI surfaced that race as a bare "Uncaught" at the first evaluate).
    const target = await cdp(socket, "Target.createTarget", { url: "about:blank" });
    const attached = await cdp(socket, "Target.attachToTarget", { targetId: target.targetId, flatten: true });
    const sessionId = String(attached.sessionId);
    await cdp(socket, "Page.enable", {}, sessionId);
    await cdp(socket, "Runtime.enable", {}, sessionId);
    const loadWait = waitForCdpEvent(socket, "Page.loadEventFired", sessionId, 15000);
    await cdp(socket, "Page.navigate", { url: pathToFileURL(htmlPath).href }, sessionId);
    await loadWait;
    await waitUntilTrue(socket, sessionId, `Boolean(document.getElementById("address"))`, 10000);
    const screenHeight = await evaluate(socket, sessionId, "document.documentElement.scrollHeight");
    await cdp(socket, "Emulation.setEmulatedMedia", { media: "print" }, sessionId);
    const printed = await evaluate(socket, sessionId, `(() => {
      const address = document.getElementById("address");
      const sheet = document.querySelector(".nchf-print-sheet");
      let shown = true;
      let node = address;
      while (node) { if (getComputedStyle(node).display === "none") shown = false; node = node.parentElement; }
      return { shown, address: address.textContent, height: document.documentElement.scrollHeight, sheetDisplay: getComputedStyle(sheet).display, omitDisplay: getComputedStyle(document.querySelector(".nchf-print-omit")).display };
    })()`);
    assert.equal(printed.shown, true);
    assert.equal(printed.address, `${longStreet}, Seattle, WA, 98101`);
    assert.equal(printed.sheetDisplay, "block");
    assert.equal(printed.omitDisplay, "none");
    assert.ok(screenHeight > 2200);
    assert.ok(printed.height < 900, `printed height ${printed.height} still includes the directory`);
    socket.close();
  } finally {
    if (process.platform === "win32" && child.pid) {
      spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore", windowsHide: true }).unref();
    } else {
      child.kill();
    }
    try {
      rmSync(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    } catch (error) {
      if (!["EBUSY", "ENOTEMPTY", "EPERM"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error;
    }
    try {
      rmSync(userData, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    } catch (error) {
      if (!["EBUSY", "ENOTEMPTY", "EPERM"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error;
    }
  }
});

function waitForBrowserSocket(
  child: ReturnType<typeof spawn>,
  port: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    let output = "";
    let settled = false;
    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearInterval(poll);
      action();
    };
    const timer = setTimeout(() => {
      finish(() => reject(new Error(
        `browser debugging socket did not open on port ${port}\n${output.slice(-800)}`,
      )));
    }, 30000);
    const onData = (chunk: Buffer | string) => {
      output += String(chunk);
      const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match?.[1]) finish(() => resolve(match[1]));
    };
    const poll = setInterval(() => {
      fetch(`http://127.0.0.1:${port}/json/version`)
        .then(async response => {
          if (!response.ok) return;
          const payload = await response.json() as { webSocketDebuggerUrl?: unknown };
          const url = typeof payload.webSocketDebuggerUrl === "string"
            && payload.webSocketDebuggerUrl.startsWith("ws://")
            ? payload.webSocketDebuggerUrl
            : null;
          if (url) finish(() => resolve(url));
        })
        .catch(() => {
          /* endpoint not ready yet */
        });
    }, 250);
    child.stdout?.on("data", onData);
    child.stderr?.on("data", onData);
    child.once("exit", code => {
      finish(() => reject(new Error(
        `browser exited ${code} before its debugging socket opened\n${output.slice(-800)}`,
      )));
    });
  });
}

function cdp(socket: WebSocket, method: string, params: Record<string, unknown>, sessionId?: string): Promise<Record<string, unknown>> {
  const id = Math.floor(Math.random() * 1_000_000_000);
  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent) => {
      const message = JSON.parse(String(event.data)) as {
        id?: number;
        sessionId?: string;
        result?: Record<string, unknown>;
        error?: { message: string };
      };
      if (message.id !== id) return;
      socket.removeEventListener("message", onMessage);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result ?? {});
    };
    socket.addEventListener("message", onMessage);
    socket.send(JSON.stringify({ id, method, params, sessionId }));
  });
}

function waitForCdpEvent(
  socket: WebSocket,
  method: string,
  sessionId: string,
  timeoutMs: number,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.removeEventListener("message", onMessage);
      reject(new Error(`timed out waiting for ${method}`));
    }, timeoutMs);
    const onMessage = (event: MessageEvent) => {
      const message = JSON.parse(String(event.data)) as {
        method?: string;
        sessionId?: string;
        params?: Record<string, unknown>;
      };
      if (message.method !== method) return;
      if (message.sessionId && message.sessionId !== sessionId) return;
      clearTimeout(timer);
      socket.removeEventListener("message", onMessage);
      resolve(message.params ?? {});
    };
    socket.addEventListener("message", onMessage);
  });
}

async function waitUntilTrue(
  socket: WebSocket,
  sessionId: string,
  expression: string,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      const value = await evaluate(socket, sessionId, expression);
      if (value) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  const detail = lastError instanceof Error ? lastError.message : String(lastError ?? "false");
  throw new Error(`timed out waiting for (${expression}): ${detail}`);
}

async function evaluate(socket: WebSocket, sessionId: string, expression: string): Promise<any> {
  const result = await cdp(socket, "Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  }, sessionId);
  const details = result.exceptionDetails as {
    text?: string;
    exception?: { description?: string; value?: unknown };
  } | undefined;
  if (details) {
    const detailText = details.exception?.description
      ?? (typeof details.exception?.value === "string" ? details.exception.value : null)
      ?? details.text
      ?? "browser evaluation failed";
    throw new Error(detailText);
  }
  return (result.result as { value?: unknown }).value;
}
