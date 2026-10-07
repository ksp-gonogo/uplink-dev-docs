/**
 * Loads every live example on the BUILT site in a real browser, and fails on
 * one that throws, draws nothing or is not wired. A build passes whatever an
 * example does at runtime, so this is the only check that sees a harness or
 * fixture change break a render.
 *
 * Each example is graded on its own frame page (`/demo?id=`), served by
 * `vitepress preview`, several at once (`DEMO_PAGES`, default 6), each with
 * a hard limit that fails it by name rather than holding up the rest:
 * - any uncaught error, unhandled rejection or `console.error` fails it
 * - the "failed to load" or "No example is wired" note fails it
 * - a render with no text and no drawn graphic fails it
 *
 * The ids graded are the ones the built pages name, so an id a page names and
 * the registry lacks fails as unwired. Before grading them it grades three
 * planted examples, one of each fault, and reports BLIND unless all three
 * fail.
 *
 *   npm run check:demos                          # after vitepress build
 *   npm run check:demos -- --page widgets/crew   # only the examples on matching pages
 *
 * With no examples on the built site it skips, except under `CI=true`, where
 * that means the Storybook checkout went missing and it fails.
 */
import { spawn } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import { chromium } from "playwright";
import { PLANTED_DEMOS } from "./reference/paths.mjs";

const DIST = resolve(import.meta.dirname, "../docs/.vitepress/dist");
/** How long an example gets to draw before it counts as drawing nothing. */
const RENDER_LIMIT_MS = 20_000;
/** How long a drawn example is watched for an error that lands after it. */
const SETTLE_MS = 1_500;
/** The most one example may take, loading included, before it fails by name. */
const EXAMPLE_LIMIT_MS = 60_000;
/** How many examples are graded at once, each on its own page. */
const PAGES_AT_ONCE = Math.max(1, Number(process.env.DEMO_PAGES) || 6);
const PLANTED = [...Object.keys(PLANTED_DEMOS), "plant--missing"];

function builtPages(dir = DIST) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "assets" ? [] : builtPages(path);
    return entry.name.endsWith(".html") ? [path] : [];
  });
}

/** Every example id a built page names, with the pages naming it. */
function namedDemos() {
  const named = new Map();
  for (const file of builtPages()) {
    const page = file.slice(DIST.length);
    for (const [, id] of readFileSync(file, "utf8").matchAll(/id="demo-([^"]+)-panel-preview"/g)) {
      named.set(id, [...(named.get(id) ?? []), page]);
    }
  }
  return named;
}

function freePort() {
  return new Promise((done, fail) => {
    const server = createServer();
    server.once("error", fail);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => done(port));
    });
  });
}

/** `vitepress preview` on a free port, resolved with the site's root URL once it is serving. */
async function preview() {
  const port = await freePort();
  const child = spawn("npx", ["vitepress", "preview", "docs", "--port", String(port)], {
    cwd: resolve(import.meta.dirname, ".."),
    stdio: ["ignore", "pipe", "pipe"],
  });
  const url = await new Promise((done, fail) => {
    let out = "";
    const timer = setTimeout(() => fail(new Error(`vitepress preview did not start:\n${out}`)), 30_000);
    const read = (chunk) => {
      out += chunk;
      const match = /(http:\/\/localhost:\d+\/\S*)/.exec(out.replace(/\x1b\[[0-9;]*m/g, ""));
      if (!match) return;
      clearTimeout(timer);
      done(match[1].endsWith("/") ? match[1] : `${match[1]}/`);
    };
    child.stdout.on("data", read);
    child.stderr.on("data", read);
    child.once("exit", (code) => fail(new Error(`vitepress preview exited with ${code}:\n${out}`)));
  });
  return { url, stop: () => child.kill() };
}

/** Runs in every frame: collects what an example throws or logs as an error. */
function recordErrors() {
  const errors = [];
  Object.defineProperty(window, "__demoErrors", { value: errors });
  window.addEventListener("error", (e) => errors.push(String(e.error ?? e.message)));
  window.addEventListener("unhandledrejection", (e) => errors.push(`unhandled rejection: ${String(e.reason)}`));
  const original = console.error;
  console.error = (...args) => {
    errors.push(args.map(String).join(" "));
    original.apply(console, args);
  };
}

/** What the frame page shows: a note, a drawn render, or nothing yet. */
function stageState() {
  const note = document.querySelector(".demo-stage__missing");
  if (note) return { note: note.textContent.replace(/\s+/g, " ").trim() };
  const root = document.querySelector(".demo-stage__host")?.shadowRoot;
  // The render's own element: the shadow root also holds the app's stylesheet and styled-components' sheets.
  const stage = root && [...root.children].find((el) => el.tagName !== "STYLE");
  if (!stage) return {};
  const text = stage.textContent.replace(/\s+/g, " ").trim();
  const graphic = [...stage.querySelectorAll("svg, canvas, img")].some((el) => {
    const box = el.getBoundingClientRect();
    return box.width > 0 && box.height > 0;
  });
  return { drawn: text.length > 0 || graphic };
}

/** The faults one example shows, or an empty list when it drew and stayed quiet; never longer than the example limit. */
async function grade(browser, url, id) {
  let timer;
  const limit = new Promise((done) => {
    timer = setTimeout(() => done([`did not finish within ${EXAMPLE_LIMIT_MS / 1000}s`]), EXAMPLE_LIMIT_MS);
  });
  const faults = await Promise.race([gradeOnce(browser, url, id).catch((error) => [`could not be graded: ${error.message}`]), limit]);
  clearTimeout(timer);
  return faults;
}

/** Every id graded, `PAGES_AT_ONCE` at a time, with its faults, in the order given. */
async function gradeAll(browser, url, ids) {
  const results = new Array(ids.length);
  let next = 0;
  const worker = async () => {
    while (next < ids.length) {
      const i = next++;
      results[i] = await grade(browser, url, ids[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(PAGES_AT_ONCE, ids.length) }, worker));
  return results;
}

async function gradeOnce(browser, url, id) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.addInitScript(recordErrors);
  const faults = [];
  page.on("pageerror", (error) => faults.push(`uncaught: ${error.message}`));
  await page.goto(`${url}demo?id=${encodeURIComponent(id)}`, { waitUntil: "load" });
  const settled = await page
    .waitForFunction(`(() => { const s = (${stageState})(); return Boolean(s.note || s.drawn); })()`, null, {
      timeout: RENDER_LIMIT_MS,
      polling: 200,
    })
    .then(() => true, () => false);
  const state = settled ? await page.evaluate(stageState) : {};
  if (state.note) faults.push(state.note);
  if (settled && !state.note && !state.drawn) faults.push("drew nothing");
  if (!settled) faults.push(`drew nothing within ${RENDER_LIMIT_MS / 1000}s`);
  await page.waitForTimeout(SETTLE_MS);
  faults.push(...(await page.evaluate(() => window.__demoErrors)));
  await page.close().catch(() => {});
  return [...new Set(faults)];
}

const pageFilter = process.argv.includes("--page") ? process.argv[process.argv.indexOf("--page") + 1] : null;
const named = new Map([...namedDemos()].filter(([, pages]) => !pageFilter || pages.some((page) => page.includes(pageFilter))));
if (named.size === 0) {
  if (process.env.CI === "true" && !pageFilter) {
    console.error("FAILED: the built site names no live examples, so the reference was generated without a Storybook checkout.");
    process.exit(1);
  }
  console.log(`SKIPPED: no live examples on ${pageFilter ? `a page matching ${pageFilter}` : "the built site (no Storybook checkout when the reference was generated)"}.`);
  process.exit(0);
}

const server = await preview();
const browser = await chromium.launch();
let failed = false;
try {
  const plantedFaults = await gradeAll(browser, server.url, PLANTED);
  const blind = PLANTED.filter((_, i) => plantedFaults[i].length === 0);
  if (blind.length > 0) {
    console.error(`BLIND: the planted example(s) ${blind.join(", ")} passed. Fix the check before trusting it.`);
    failed = true;
  } else {
    const entries = [...named];
    const graded = await gradeAll(browser, server.url, entries.map(([id]) => id));
    const broken = entries.flatMap(([id, pages], i) =>
      graded[i].length === 0 ? [] : [`  ${id} (on ${pages.join(", ")})\n${graded[i].map((f) => `      ${f}`).join("\n")}`],
    );
    if (broken.length > 0) {
      console.error(`Live examples that do not render cleanly:\n${broken.join("\n")}`);
      failed = true;
    } else {
      console.log(`Live examples: all ${named.size} render with no errors (planted faults found: ${PLANTED.length}).`);
    }
  }
} finally {
  await browser.close();
  server.stop();
}
process.exit(failed ? 1 : 0);
