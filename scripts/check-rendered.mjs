/**
 * Fails the build on a page the server render left empty. VitePress logs a
 * page whose render throws and writes it anyway, with nothing in its article,
 * and exits 0, so the build alone passes a site with a blank page on it.
 *
 * Every Markdown page under `docs/` is graded on the HTML it was built to: a
 * page in the doc layout must open its article with its title, a home page
 * must carry its hero, and a page with no layout (the example frame) is not
 * graded. Before grading the site it grades a planted empty page, and fails
 * as BLIND unless it finds the fault.
 *
 *   node scripts/check-rendered.mjs   # after `vitepress build docs`
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = resolve(ROOT, "docs");
const DIST = resolve(DOCS, ".vitepress/dist");

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

const planted = fault("doc", '<main class="main"><div style="position:relative;" class="vp-doc _planted"></div></main>');
if (planted === null) {
  console.error("BLIND: the planted empty page passed. Fix the check before trusting it.");
  process.exit(1);
}
if (!existsSync(DIST)) {
  console.error(`${relative(ROOT, DIST)} does not exist. Run \`vitepress build docs\` first.`);
  process.exit(1);
}

const faults = [];
const pages = markdownFiles(DOCS);
for (const file of pages) {
  const built = resolve(DIST, relative(DOCS, file).replace(/\.md$/, ".html"));
  if (!existsSync(built)) {
    faults.push(`${relative(DOCS, file)} was not built`);
    continue;
  }
  const problem = fault(layoutOf(readFileSync(file, "utf8")), readFileSync(built, "utf8"));
  if (problem) faults.push(`${relative(DIST, built)} ${problem}`);
}
if (faults.length > 0) {
  console.error(`Rendered pages: ${faults.length} fault${faults.length === 1 ? "" : "s"}\n  ${faults.join("\n  ")}`);
  process.exit(1);
}
console.log(`Rendered pages: all ${pages.length} pages rendered their content (planted fault found: 1).`);
