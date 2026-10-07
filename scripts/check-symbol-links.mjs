/**
 * Fails the build on a documented symbol the built site names without
 * linking it, and on a symbol link that leads nowhere.
 *
 * It reads the built HTML rather than the Markdown, so a reference is caught
 * however it reached the page: guide prose, a generated doc comment, a table
 * cell or a Vue template. A code block is a sample, not a reference, and a
 * heading carries its own anchor, so neither is read. A name on its own
 * entry's page, with nowhere further to go, needs no link.
 *
 * A member's own name in its table row is not a reference, so it is never
 * linked; nor is a name on the ambiguous list unless a link was written.
 *
 * Before grading the site it grades a planted page holding one of each fault
 * and one of each exemption, and fails as BLIND unless it finds exactly the
 * faults.
 *
 *   node scripts/check-symbol-links.mjs   # after `vitepress build docs`
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AMBIGUOUS_SYMBOLS } from "./ambiguous-symbols.mjs";
import { isSelf, loadSymbolIndex, namedSymbol, pageOf, symbolOf } from "./symbol-links.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = resolve(ROOT, "docs/.vitepress/dist");
const BASE = "/uplink-dev-docs";

const ENTITIES = { "&lt;": "<", "&gt;": ">", "&amp;": "&", "&quot;": '"', "&#39;": "'" };
const decode = (html) => html.replace(/<[^>]+>/g, "").replace(/&(lt|gt|amp|quot|#39);/g, (e) => ENTITIES[e]);

/** A link's target as a site path: an anchor alone is on `page`, and the base is dropped. */
function sitePath(href, page) {
  if (href.startsWith("#")) return `${page}${href}`;
  if (href.startsWith(BASE)) return href.slice(BASE.length);
  return href;
}

/** The page a built file is, as `pageOf` writes it. */
const pageOfHtml = (file) => pageOf(`/${relative(DIST, file)}`);

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "assets" ? [] : htmlFiles(full);
    return entry.name.endsWith(".html") ? [full] : [];
  });
}

/** The article a page's content is rendered into, without its code blocks and headings. */
function prose(html) {
  const main = /<main[\s\S]*<\/main>/.exec(html)?.[0] ?? html;
  return main.replace(/<pre\b[\s\S]*?<\/pre>/g, "").replace(/<h([1-6])\b[\s\S]*?<\/h\1>/g, "");
}

/**
 * Every fault on one page. `site` maps each page to the ids its HTML carries,
 * so a link's anchor can be checked against the page it points at.
 */
function grade(page, html, index, site) {
  const faults = [];
  const resolves = (href) => {
    const path = sitePath(href, page);
    const [, anchor] = path.split("#");
    const ids = site.get(pageOf(path));
    return ids !== undefined && (!anchor || ids.has(decodeURIComponent(anchor)));
  };
  let href = null;
  for (const m of prose(html).matchAll(/<(\/?)(a|code)\b([^>]*)>/g)) {
    const [tag, close, name, attrs] = m;
    if (name === "a") {
      href = close ? null : (/href="([^"]*)"/.exec(attrs)?.[1] ?? null);
      continue;
    }
    if (close) continue;
    const end = m.input.indexOf("</code>", m.index);
    const text = decode(m.input.slice(m.index + tag.length, end));
    if (/\bclass="member"/.test(attrs)) {
      if (href !== null) faults.push(`member name \`${text}\` is linked to ${href}`);
      continue;
    }
    const symbol = symbolOf(text, index);
    if (symbol && href === null && !isSelf(index[symbol], page)) faults.push(`\`${text}\` is not linked to ${index[symbol]}`);
    if (namedSymbol(text, index) && href !== null && !href.startsWith("http") && !resolves(href)) {
      faults.push(`\`${text}\` links to ${href}, which does not resolve`);
    }
  }
  return faults;
}

const idsOf = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

const index = loadSymbolIndex();

const PLANTED_FAULTS = 3;
const ambiguous = Object.keys(AMBIGUOUS_SYMBOLS).find((name) => Object.hasOwn(index, name)) ?? "";
const planted = grade(
  "/planted",
  "<main><p><code>useTelemetry</code> and " +
    '<a href="/uplink-dev-docs/nowhere#x"><code>useTelemetry</code></a> and ' +
    '<a href="/uplink-dev-docs/nowhere#x"><code class="member">useTelemetry</code></a>, beside ' +
    `<code class="member">useTelemetry</code> and <code>${ambiguous}</code></p></main>`,
  index,
  new Map([["/planted", new Set()]]),
);
if (planted.length !== PLANTED_FAULTS) {
  console.error(`BLIND: the planted page has ${PLANTED_FAULTS} faults and the check found ${planted.length}. Fix the check before trusting it.`);
  process.exit(1);
}

if (!existsSync(DIST)) {
  console.error(`${relative(ROOT, DIST)} does not exist. Run \`vitepress build docs\` first.`);
  process.exit(1);
}
const files = htmlFiles(DIST);
const site = new Map(files.map((file) => [pageOfHtml(file), idsOf(readFileSync(file, "utf8"))]));
const faults = [];
for (const [name, url] of Object.entries(index)) {
  const [page, anchor] = url.split("#");
  const ids = site.get(pageOf(page));
  if (!ids || (anchor && !ids.has(anchor))) faults.push(`symbol index: ${name}'s entry ${url} is not on the built site`);
}
for (const file of files) {
  for (const fault of grade(pageOfHtml(file), readFileSync(file, "utf8"), index, site)) {
    faults.push(`${relative(DIST, file)}: ${fault}`);
  }
}
if (faults.length > 0) {
  console.error(`Symbol links: ${faults.length} fault${faults.length === 1 ? "" : "s"}\n  ${faults.join("\n  ")}`);
  process.exit(1);
}
console.log(`Symbol links: every reference to ${Object.keys(index).length} documented symbols across ${files.length} pages is linked and resolves (planted faults found: ${PLANTED_FAULTS}).`);
