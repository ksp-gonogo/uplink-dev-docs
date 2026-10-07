/**
 * Fails the build on a page the server render left empty, and on a link in a
 * page's article to a page or anchor the built site does not have. VitePress
 * logs a page whose render throws and writes it anyway, with nothing in its
 * article, and exits 0, so the build alone passes a site with a blank page on
 * it; and it checks no anchor at all.
 *
 * Every Markdown page under `docs/` is graded on the HTML it was built to: a
 * page in the doc layout must open its article with its title, a home page
 * must carry its hero, and a page with no layout (the example frame) is not
 * graded. Before grading the site it grades a planted empty page and a
 * planted dead anchor, and fails as BLIND unless it finds both.
 *
 *   node scripts/check-rendered.mjs   # after `vitepress build docs`
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pageOf } from "./symbol-links.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = resolve(ROOT, "docs");
const DIST = resolve(DOCS, ".vitepress/dist");
const BASE = "/uplink-dev-docs";

function markdownFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".") || entry.name === "node_modules") return [];
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) return markdownFiles(full);
    return entry.name.endsWith(".md") ? [full] : [];
  });
}

/** A page's layout, from its frontmatter: `doc` unless it names another. */
function layoutOf(markdown) {
  const frontmatter = /^---\n([\s\S]*?)\n---/.exec(markdown)?.[1] ?? "";
  return /^layout:\s*(\S+)/m.exec(frontmatter)?.[1] ?? "doc";
}

/** What is wrong with one built page, or null when it rendered. */
function fault(layout, html) {
  if (layout === "false") return null;
  if (layout === "home") return html.includes('class="VPHero') ? null : "has no hero";
  const article = /<div[^>]*class="vp-doc[^"]*"[^>]*>([\s\S]*?)<\/main>/.exec(html)?.[1];
  if (article === undefined) return "has no article";
  return /<h1\b/.test(article) ? null : "rendered no title: its server render threw or wrote nothing";
}

/** Every link in a page's article to this site that leads to no page, or to no such anchor on it. */
function deadLinks(page, html, site) {
  const article = /<main[\s\S]*<\/main>/.exec(html)?.[0] ?? "";
  const dead = [];
  for (const [, href] of article.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) {
    if (!href.startsWith(`${BASE}/`) && !href.startsWith("#")) continue;
    const path = href.startsWith("#") ? `${page}${href}` : href.slice(BASE.length);
    const [target, anchor] = path.split("#");
    if (/\.(png|svg|json|js|css)$/.test(target)) continue;
    const ids = site.get(pageOf(target));
    if (!ids) dead.push(`${href} leads to no page`);
    else if (anchor && !ids.has(decodeURIComponent(anchor))) dead.push(`${href} leads to no such anchor`);
  }
  return dead;
}

const planted = fault("doc", '<main class="main"><div style="position:relative;" class="vp-doc _planted"></div></main>');
const plantedLinks = deadLinks("/planted", '<main><a href="#nowhere">x</a><a href="#here">y</a></main>', new Map([["/planted", new Set(["here"])]]));
if (planted === null || plantedLinks.length !== 1) {
  console.error("BLIND: a planted empty page or dead anchor passed. Fix the check before trusting it.");
  process.exit(1);
}
if (!existsSync(DIST)) {
  console.error(`${relative(ROOT, DIST)} does not exist. Run \`vitepress build docs\` first.`);
  process.exit(1);
}

const builtHtml = (file) => resolve(DIST, relative(DOCS, file).replace(/\.md$/, ".html"));
const pageOfMd = (file) => pageOf(`/${relative(DOCS, file).replace(/\.md$/, "")}`);
const faults = [];
const pages = markdownFiles(DOCS);
const site = new Map(
  pages
    .filter((file) => existsSync(builtHtml(file)))
    .map((file) => [pageOfMd(file), new Set([...readFileSync(builtHtml(file), "utf8").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]),
);
for (const file of pages) {
  const built = resolve(DIST, relative(DOCS, file).replace(/\.md$/, ".html"));
  if (!existsSync(built)) {
    faults.push(`${relative(DOCS, file)} was not built`);
    continue;
  }
  const html = readFileSync(built, "utf8");
  const problem = fault(layoutOf(readFileSync(file, "utf8")), html);
  if (problem) faults.push(`${relative(DIST, built)} ${problem}`);
  for (const dead of deadLinks(pageOfMd(file), html, site)) faults.push(`${relative(DIST, built)}: ${dead}`);
}
if (faults.length > 0) {
  console.error(`Rendered pages: ${faults.length} fault${faults.length === 1 ? "" : "s"}\n  ${faults.join("\n  ")}`);
  process.exit(1);
}
console.log(`Rendered pages: all ${pages.length} pages rendered their content and every link in them lands (planted faults found: 2).`);
