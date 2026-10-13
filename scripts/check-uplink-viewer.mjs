/**
 * Adds the worked example Uplink to the BUILT /uplinks page, in a real browser,
 * and fails unless the sidebar lists it under Custom Uplinks, its overview reads
 * the spec sheet, runs the released client and draws the widget, its README
 * page renders, a reload keeps it, and an address opened in a browser that has
 * not added it offers to add it. A build passes whatever the page does at run
 * time, so this is the check that sees a change to the externals, the host, the
 * loader or the routes break it.
 *
 * The Uplink is served from a folder on this machine: its client bundled with
 * esbuild the way `uplink-tools bundle` does, its manifest carrying the real
 * hash, its committed spec sheet and README. Before grading it, the same page is
 * given the folder with one byte of the bundle changed and must refuse to run
 * it, or the check reports BLIND.
 *
 *   npm run check:uplink-viewer        # after vitepress build
 *   SHOTS=dir npm run check:uplink-viewer   # also saves pictures of the pages
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright";
import { INSTALL, ROOT } from "./reference/paths.mjs";

const DIST = resolve(ROOT, "docs/.vitepress/dist");
const BASE = "/uplink-dev-docs/";
const CLIENT = resolve(ROOT, "example/client");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };

if (!existsSync(join(DIST, "uplinks.html"))) throw new Error("No built site: run vitepress build first.");

const { UPLINK_BUNDLE_EXTERNALS } = await import(
  pathToFileURL(resolve(INSTALL, "node_modules/@ksp-gonogo/sitrep-sdk/dist/uplink-externals.js")).href
);
const { CONTRACT_MAJOR, CONTRACT_MINOR, EXTENSION_API_VERSION } = await import(
  pathToFileURL(resolve(INSTALL, "node_modules/@ksp-gonogo/sitrep-sdk/dist/compat-versions.js")).href
);

const built = await build({
  entryPoints: [join(CLIENT, "src/index.ts")],
  bundle: true,
  write: false,
  format: "esm",
  platform: "browser",
  target: "es2022",
  jsx: "automatic",
  tsconfigRaw: "{}",
  external: [...UPLINK_BUNDLE_EXTERNALS],
  nodePaths: [resolve(INSTALL, "node_modules")],
  logLevel: "warning",
});
const bundle = Buffer.from(built.outputFiles[0].contents);
const manifest = {
  ...JSON.parse(readFileSync(join(CLIENT, "gonogo-uplink.json"), "utf8")),
  apiVersion: EXTENSION_API_VERSION,
  contractMajor: CONTRACT_MAJOR,
  contractMinor: CONTRACT_MINOR,
  bundleUrl: "example.client.js",
  integrity: `sha256-${createHash("sha256").update(bundle).digest("hex")}`,
};
const spec = readFileSync(join(CLIENT, "docs/spec.json"));
const readme = readFileSync(join(CLIENT, "README.md"));
const secondSpec = JSON.stringify({
  ...JSON.parse(spec.toString()),
  uplink: { ...JSON.parse(spec.toString()).uplink, id: "second", name: "Second Uplink", description: "A second Uplink that ships only a spec sheet." },
});
const tampered = Buffer.concat([bundle, Buffer.from("\n// changed\n")]);

/** One server: the built site under its base path, and the Uplink folders at /good and /tampered. */
const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, "http://x").pathname);
  const send = (body, type) => {
    response.writeHead(200, { "content-type": type, "access-control-allow-origin": "*" });
    response.end(body);
  };
  if (path === "/second/spec.json") return send(secondSpec, TYPES[".json"]);
  for (const [folder, code] of [["/good", bundle], ["/tampered", tampered]]) {
    if (path === `${folder}/spec.json`) return send(spec, TYPES[".json"]);
    if (path === `${folder}/README.md`) return send(readme, "text/markdown");
    if (path === `${folder}/gonogo-uplink.json`) return send(JSON.stringify(manifest), TYPES[".json"]);
    if (path === `${folder}/example.client.js`) return send(code, TYPES[".js"]);
  }
  if (path.startsWith(BASE)) {
    const relative = path.slice(BASE.length);
    for (const candidate of [relative, `${relative}.html`, join(relative, "index.html")]) {
      const file = join(DIST, candidate);
      if (candidate && existsSync(file) && file.startsWith(DIST) && extname(file)) return send(readFileSync(file), TYPES[extname(file)] ?? "application/octet-stream");
    }
  }
  response.writeHead(404).end();
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
let failures = 0;
const fail = (message) => {
  failures += 1;
  console.error(`FAIL ${message}`);
};

/** A 404 for a file an Uplink's folder may or may not carry is how the page finds out which it does. */
const optionalMiss = (message) =>
  /status of 404/.test(message.text()) && /\/(spec\.json|gonogo-uplink\.json|README\.md|render-shape\.json)$/.test(message.location().url);

const settled = (page) =>
  page.waitForFunction(() => !document.querySelector("[role=status]"), null, { timeout: 30_000 });

function watch(page) {
  const problems = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => message.type() === "error" && !optionalMiss(message) && problems.push(`${message.text()} ${message.location().url}`));
  return problems;
}

/** Opens /uplinks, adds the folder, and reports what the overview shows once it settles. */
async function add(page, folder) {
  await page.goto(`${origin}${BASE}uplinks`);
  await page.fill("#uplink-link", `${origin}${folder}`);
  await page.click("button[type=submit]");
  await page.waitForSelector(".cu h1", { timeout: 20_000 });
  await page.waitForFunction(() => location.hash.startsWith("#/u/"));
  return Promise.race([
    page.waitForFunction(() => document.querySelector(".uplink-widget__stage")?.shadowRoot?.querySelector("div")?.textContent?.trim(), null, { timeout: 30_000 }).then(() => "drawn"),
    page.waitForSelector(".cu-problem", { timeout: 30_000 }).then(() => "refused"),
  ]).catch(() => "nothing");
}

const shot = async (page, name) => {
  if (!process.env.SHOTS) return;
  mkdirSync(resolve(process.env.SHOTS), { recursive: true });
  // The sidebar's links fade between states; a picture taken mid-fade marks the wrong page.
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(resolve(process.env.SHOTS), name), fullPage: false });
};

const sidebarText = (page) => page.evaluate(() => document.querySelector(".VPSidebar")?.innerText ?? "");
const navText = (page) => page.evaluate(() => document.querySelector(".cu-nav")?.innerText ?? "");

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const problems = watch(page);
const outcome = await add(page, "/good");
if (outcome !== "drawn") fail(`the example's widget was not drawn (page showed: ${outcome})`);
const drawn = await page.evaluate(() => document.querySelector(".uplink-widget__stage")?.shadowRoot?.querySelector("div")?.textContent ?? "");
if (!/Heartbeat/.test(drawn)) fail(`the drawn widget does not carry its title (it reads: ${drawn.slice(0, 120)})`);

let nav = await navText(page);
const sidebar = await sidebarText(page);
if (!/Custom Uplinks\s+Add an Uplink\s+Example\s+README/.test(sidebar)) fail(`the sidebar does not list the example under Custom Uplinks (it reads: ${sidebar})`);
await shot(page, "overview-one-uplink.png");

await page.getByRole("link", { name: "README", exact: true }).click();
await page.waitForSelector(".cu-doc table", { timeout: 20_000 });
const docText = await page.evaluate(() => document.querySelector(".cu-doc")?.innerText ?? "");
if (!/Uplink id/.test(docText) || /Generated by|<!--/.test(docText)) fail(`the README page did not render as Markdown (it reads: ${docText.slice(0, 120)})`);
if ((await page.getAttribute(".cu-nav a[aria-current=page]", "aria-current").catch(() => null)) !== "page") fail("the sidebar does not mark the README page as current");
await shot(page, "docs-page.png");

await page.reload();
await page.waitForSelector(".cu-doc table", { timeout: 20_000 });
nav = await navText(page);
if (!/Example/.test(nav)) fail("a reload lost the Uplink from the sidebar");

// A second Uplink, which ships only a spec sheet.
await page.goto(`${origin}${BASE}uplinks`);
await page.fill("#uplink-link", `${origin}/second`);
await page.click("button[type=submit]");
await page.waitForFunction(() => document.querySelector(".cu h1")?.textContent?.includes("Second Uplink"), null, { timeout: 20_000 });
nav = await navText(page);
if (!/Example/.test(nav) || !/Second Uplink/.test(nav)) fail(`the sidebar does not list both Uplinks (it reads: ${nav})`);
await shot(page, "sidebar-two-uplinks.png");

await page.goto(`${origin}${BASE}uplinks`);
await page.waitForSelector(".cu-item");
await shot(page, "home-list.png");

// An address opened where the Uplink was never added offers to add it.
const address = `${origin}${BASE}uplinks#/u/${encodeURIComponent(`${origin}/good`)}`;
const stranger = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await stranger.goto(address);
await stranger.waitForSelector("button.cu-primary", { timeout: 20_000 });
if (/Example/.test(await navText(stranger))) fail("a browser that never added the Uplink lists it in the sidebar");
await stranger.click("button.cu-primary");
await stranger.waitForFunction(() => document.querySelector(".cu h1")?.textContent?.includes("Example"), null, { timeout: 20_000 });
if (!/Example/.test(await navText(stranger))) fail("accepting the offer did not list the Uplink");
await stranger.close();

// A link that cannot be read stays listed, with its reason and a way to try again.
await page.goto(`${origin}${BASE}uplinks`);
await page.fill("#uplink-link", `${origin}/missing`);
await page.click("button[type=submit]");
await page.waitForSelector(".cu-problem", { timeout: 20_000 });
await page.reload();
await page.waitForSelector(".cu-problem", { timeout: 20_000 });
if (!(await page.getByRole("button", { name: "Try again" }).isVisible())) fail("a link that failed offers no way to try again");
if (!/missing/.test(await navText(page))) fail("a link that failed was dropped from the sidebar");

// Removing one keeps the others, and keeps it removed across a reload.
await page.getByRole("button", { name: /^Remove/ }).click();
await page.waitForFunction(() => location.hash === "#/");
await page.reload();
await page.waitForSelector(".cu h1");
nav = await navText(page);
if (/missing/.test(nav) || !/Example/.test(nav)) fail(`removal did not hold across a reload (the sidebar reads: ${nav})`);
if (problems.length > 0) fail(`the page reported errors: ${problems.join(" | ")}`);
await page.close();

// The same page given a bundle that does not match its manifest's hash.
const bad = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const badOutcome = await add(bad, "/tampered");
const refusal = await bad.evaluate(() => document.querySelector(".cu-problem")?.textContent ?? "");
if (badOutcome === "drawn" || !/was not run/.test(refusal)) fail("BLIND: a bundle that does not match its manifest's hash was run");
if (!/Example/.test(await navText(bad))) fail("an Uplink whose client was refused was dropped from the sidebar");

await browser.close();
server.close();
if (failures > 0) process.exit(1);
console.log("The sidebar listed the example under Custom Uplinks, its overview drew its widget, its README rendered, a reload kept it, a stranger was offered it, and a changed bundle was refused.");
