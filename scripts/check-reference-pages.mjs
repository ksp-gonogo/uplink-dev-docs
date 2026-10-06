/**
 * Fails on a reference page that is neither generated nor a listed hand page,
 * and on a generated page that was committed or edited by hand.
 *
 * Every page under `docs/reference/` is one of two things: written by
 * `npm run reference` from a module under `reference/pages/`, or a hand page
 * on the shrink-only list in `hand-pages-debt.mjs`. A generated page is build
 * output, so it is never tracked by git, and its content is what the generator
 * last wrote. The guide pages a module generates are held to the second rule
 * too.
 *
 * Before grading the tree it grades a planted one holding each fault, and
 * fails as BLIND unless it finds every one.
 *
 *   node scripts/check-reference-pages.mjs   # after `npm run reference`
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { PAGES } from "../reference/pages.mjs";
import { HAND_PAGES } from "./hand-pages-debt.mjs";
import { DOCS, GENERATED_HASHES, hashOf, ROOT } from "./reference/paths.mjs";

const REFERENCE = resolve(DOCS, "reference");

/**
 * The faults in one tree, each a `[kind, path, message]`. Pure, so the planted
 * tree is graded by the same code as the real one.
 *
 * - `onDisk`: every Markdown file under `docs/reference/`, from the repo root
 * - `generated`: every page a module under `reference/pages/` writes
 * - `tracked`: what git tracks
 * - `written`: each page's hash as the generator wrote it, or null before any run
 * - `hash` and `isGeneratedText`: a file's current hash, and whether it carries the generated frontmatter
 */
export function pageFaults({ onDisk, generated, tracked, written, hand, hash, isGeneratedText }) {
  const faults = [];
  for (const path of generated) {
    if (tracked.has(path)) faults.push(["committed", path, "is generated, so it is build output: git rm --cached it"]);
    if (written?.[path] === undefined) faults.push(["unwritten", path, "has not been generated: run npm run reference"]);
    else if (hash(path) !== written[path]) faults.push(["edited", path, "differs from what npm run reference wrote"]);
  }
  for (const path of onDisk) {
    if (generated.has(path)) continue;
    if (isGeneratedText(path)) faults.push(["orphan", path, "says it is generated, but no module under reference/pages/ writes it: delete it"]);
    else if (!hand.includes(path)) {
      faults.push(["unlisted", path, "is a hand page. A reference page is a module under reference/pages/, generated from doc comments"]);
    }
  }
  for (const path of hand) {
    if (generated.has(path)) faults.push(["listed", path, "is generated now: delete its entry in scripts/hand-pages-debt.mjs"]);
    else if (!onDisk.has(path)) faults.push(["listed", path, "is gone: delete its entry in scripts/hand-pages-debt.mjs"]);
  }
  return faults;
}

const PLANTED = {
  onDisk: new Set(["docs/reference/generated.md", "docs/reference/edited.md", "docs/reference/new-hand.md", "docs/reference/left-over.md"]),
  generated: new Set(["docs/reference/generated.md", "docs/reference/edited.md", "docs/reference/never-run.md"]),
  tracked: new Set(["docs/reference/generated.md"]),
  written: { "docs/reference/generated.md": "a", "docs/reference/edited.md": "b" },
  hand: ["docs/reference/deleted.md"],
  hash: (path) => (path === "docs/reference/edited.md" ? "changed" : "a"),
  isGeneratedText: (path) => path === "docs/reference/left-over.md",
};
const PLANTED_KINDS = ["committed", "unwritten", "edited", "unlisted", "orphan", "listed"];

function markdownUnder(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) return markdownUnder(full);
    return entry.name.endsWith(".md") ? [relative(ROOT, full)] : [];
  });
}

export function checkReferencePages() {
  const found = new Set(pageFaults(PLANTED).map(([kind]) => kind));
  const blind = PLANTED_KINDS.filter((kind) => !found.has(kind));
  if (blind.length > 0) {
    console.log(`BLIND: the planted tree's ${blind.join(", ")} fault went unseen, so a clean result would mean nothing.`);
    return ["reference pages (blind)"];
  }
  const tree = {
    onDisk: new Set(markdownUnder(REFERENCE)),
    generated: new Set(PAGES.map((page) => `docs/${page.path}`)),
    tracked: new Set(execFileSync("git", ["ls-files", "docs"], { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean)),
    written: existsSync(GENERATED_HASHES) ? JSON.parse(readFileSync(GENERATED_HASHES, "utf8")) : null,
    hand: HAND_PAGES,
    hash: (path) => (existsSync(resolve(ROOT, path)) ? hashOf(resolve(ROOT, path)) : null),
    isGeneratedText: (path) => /^---\ngenerated:/.test(readFileSync(resolve(ROOT, path), "utf8")),
  };
  const faults = pageFaults(tree);
  if (faults.length === 0) {
    console.log(
      `Reference pages: ${tree.generated.size} generated, ${HAND_PAGES.length} listed hand pages, none committed or edited (planted faults found: ${PLANTED_KINDS.length}).`,
    );
    return [];
  }
  console.log("A reference page is generated from doc comments, or a hand page waiting to be replaced:");
  for (const [, path, message] of faults) console.log(`  ${path} ${message}`);
  return ["reference pages"];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (checkReferencePages().length > 0) process.exit(1);
}
