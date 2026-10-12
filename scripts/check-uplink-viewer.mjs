/**
 * Loads the worked example Uplink into the BUILT /uplinks page, in a real
 * browser, and fails unless the page reads its spec sheet, runs its released
 * client and draws its widget. A build passes whatever the page does at run
 * time, so this is the check that sees a change to the externals, the host or
 * the loader break the viewer.
 *
 * The Uplink is served from a folder on this machine: its client bundled with
 * esbuild the way `uplink-tools bundle` does, its manifest carrying the real
 * hash, and its committed spec sheet. Before grading it, the same page is given
 * the folder with one byte of the bundle changed and must refuse to run it, or
 * the check reports BLIND.
 *
 *   npm run check:uplink-viewer        # after vitepress build
 *   SHOT=path.png npm run check:uplink-viewer   # also saves a screenshot
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
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
const tampered = Buffer.concat([bundle, Buffer.from("\n// changed\n")]);

/** One server: the built site under its base path, and the Uplink folders at /good and /tampered. */
const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, "http://x").pathname);
  const send = (body, type) => {
    response.writeHead(200, { "content-type": type, "access-control-allow-origin": "*" });
    response.end(body);
  };
  for (const [folder, code] of [["/good", bundle], ["/tampered", tampered]]) {
    if (path === `${folder}/spec.json`) return send(spec, TYPES[".json"]);
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

/** Opens /uplinks, adds the folder, and reports what the page shows once it settles. */
async function view(folder) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1400 } });
  const problems = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => message.type() === "error" && !message.location().url.endsWith("/render-shape.json") && problems.push(`${message.text()} ${message.location().url}`));
  await page.goto(`${origin}${BASE}uplinks`);
  await page.fill("#uplink-link", `${origin}${folder}`);
  await page.click("button[type=submit]");
  await page.waitForSelector(".uplink-viewer__uplink h3", { timeout: 20_000 });
  const outcome = await Promise.race([
    page.waitForFunction(() => document.querySelector(".uplink-widget__stage")?.shadowRoot?.querySelector("div")?.textContent?.trim(), null, { timeout: 30_000 }).then(() => "drawn"),
    page.waitForSelector(".uplink-viewer__problem", { timeout: 30_000 }).then(() => "refused"),
  ]).catch(() => "nothing");
  return { page, outcome, problems };
}

const good = await view("/good");
if (good.outcome !== "drawn") fail(`the example's widget was not drawn (page showed: ${good.outcome})`);
const text = await good.page.evaluate(() => document.querySelector(".uplink-widget__stage")?.shadowRoot?.querySelector("div")?.textContent ?? "");
if (!/Heartbeat/.test(text)) fail(`the drawn widget does not carry its title (it reads: ${text.slice(0, 120)})`);
if (good.problems.length > 0) fail(`the page reported errors: ${good.problems.join(" | ")}`);
if (process.env.SHOT) {
  mkdirSync(dirname(resolve(process.env.SHOT)), { recursive: true });
  await good.page.screenshot({ path: resolve(process.env.SHOT), fullPage: true });
}

const bad = await view("/tampered");
const refusal = await bad.page.evaluate(() => document.querySelector(".uplink-viewer__problem")?.textContent ?? "");
if (bad.outcome === "drawn" || !/was not run/.test(refusal)) fail("BLIND: a bundle that does not match its manifest's hash was run");

await browser.close();
server.close();
if (failures > 0) process.exit(1);
console.log("The viewer read the example's spec sheet, ran its client, drew its widget and refused a changed bundle.");
