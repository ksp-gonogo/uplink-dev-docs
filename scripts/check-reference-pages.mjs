/**
 * Fails on a reference page that is not generated, on a generated page that
 * was committed or edited by hand, and on a widget
 * page whose header is not the one its record in the packed
 * `@ksp-gonogo/uplink-tools/widgets.json` writes.
 *
 * Every page under `docs/reference/` is written by `npm run reference` from a
 * module under `reference/pages/`; there is no hand page and no list that
 * could admit one. A generated page is build output, so it is never tracked
 * by git, and its content is what the generator last wrote. The guide pages a
 * module generates are held to the same rules.
 *
 * Before grading the tree it grades a planted one holding each fault, and
 * fails as BLIND unless it finds every one.
 *
 *   node scripts/check-reference-pages.mjs   # after `npm run reference`
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { isDeclaration } from "./reference/csharp.mjs";
import { PAGES } from "../reference/pages.mjs";
import { DOCS, GENERATED_HASHES, hashOf, ROOT } from "./reference/paths.mjs";
import { loadWidgetRecords, opensWithHeader, WIDGET_RECORDS, widgetHeaderMd } from "./reference/widgets.mjs";

const REFERENCE = resolve(DOCS, "reference");

/**
 * The `csharp` blocks of a page that hold a type's member list but do not open
 * with its declaration: a doc comment's own diagram or example fused into the
 * declaration block, which leaves the declaration line stranded below it.
 */
export function fusedDeclarations(markdown) {
  return [...markdown.matchAll(/```csharp\n([\s\S]*?)\n```/g)]
    .map(([, block]) => block)
    .filter((block) => /\n\{\n {4}\S[\s\S]*\n\}$/.test(block) && !isDeclaration(block));
}

/**
 * The faults in one tree, each a `[kind, path, message]`. Pure, so the planted
 * tree is graded by the same code as the real one.
 *
 * - `onDisk`: every Markdown file under `docs/reference/`, from the repo root
 * - `generated`: every page a module under `reference/pages/` writes
 * - `tracked`: what git tracks
 * - `written`: each page's hash as the generator wrote it, or null before any run
 * - `hash` and `isGeneratedText`: a file's current hash, and whether it carries the generated frontmatter
 * - `widgets`: each widget page's path, with its record from the packed `widgets.json` or null when it has none
 * - `read`: a file's text, or null when it does not exist
 */
export function pageFaults({ onDisk, generated, tracked, written, hash, isGeneratedText, widgets, read }) {
  const faults = [];
  for (const path of generated) {
    if (tracked.has(path)) faults.push(["committed", path, "is generated, so it is build output: git rm --cached it"]);
    if (written?.[path] === undefined) faults.push(["unwritten", path, "has not been generated: run npm run reference"]);
    else if (hash(path) !== written[path]) faults.push(["edited", path, "differs from what npm run reference wrote"]);
  }
  for (const path of onDisk) {
    if (generated.has(path)) continue;
    if (isGeneratedText(path)) faults.push(["orphan", path, "says it is generated, but no module under reference/pages/ writes it: delete it"]);
    else faults.push(["unlisted", path, "is a hand page. A reference page is a module under reference/pages/, generated from doc comments"]);
  }
  for (const path of generated) {
    const markdown = read(path);
    if (markdown !== null && fusedDeclarations(markdown).length > 0) {
      faults.push(["fused", path, "has a C# block that holds a type's member list under something other than its declaration: a doc comment's code block was taken for the declaration"]);
    }
  }
  for (const [path, record] of widgets) {
    const markdown = read(path);
    if (record === null) faults.push(["unrecorded", path, `is a widget page for a widget ${WIDGET_RECORDS} does not list`]);
    else if (markdown !== null && !opensWithHeader(markdown, record)) {
      faults.push(["header", path, `does not open with the header its record in ${WIDGET_RECORDS} writes: run npm run reference`]);
    }
  }
  return faults;
}

const PLANTED_RECORD = {
  id: "planted",
  name: "Planted",
  description: "A widget no page shows.",
  channels: ["vessel.crew"],
  tags: [],
  optionalChannels: [],
  commands: [],
  channelFamilies: [],
  optionalChannelFamilies: [],
  readsFromConfig: false,
  fields: [],
  dataRequirements: [],
  actions: [],
  augmentSlots: [],
  contributionSlots: [],
  requires: [],
  replaces: null,
  pushable: false,
  defaultSize: { w: 4, h: 4 },
  minSize: null,
  tiny: false,
};

const PLANTED = {
  onDisk: new Set(["docs/reference/generated.md", "docs/reference/edited.md", "docs/reference/new-hand.md", "docs/reference/left-over.md"]),
  generated: new Set(["docs/reference/generated.md", "docs/reference/edited.md", "docs/reference/never-run.md"]),
  tracked: new Set(["docs/reference/generated.md"]),
  written: { "docs/reference/generated.md": "a", "docs/reference/edited.md": "b" },
  hash: (path) => (path === "docs/reference/edited.md" ? "changed" : "a"),
  isGeneratedText: (path) => path === "docs/reference/left-over.md",
  widgets: new Map([
    ["docs/reference/generated.md", PLANTED_RECORD],
    ["docs/reference/edited.md", null],
  ]),
  read: () => `---\ngenerated: npm run reference\n---\n\n${widgetHeaderMd({ ...PLANTED_RECORD, name: "Renamed by hand" })}\n\n## Example\n\n\`\`\`csharp\n0  1  MAGIC\n{\n    public const byte Magic;\n}\n\`\`\`\n`,
};
const PLANTED_KINDS = ["committed", "unwritten", "edited", "unlisted", "orphan", "unrecorded", "header", "fused"];

function markdownUnder(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) return markdownUnder(full);
    return entry.name.endsWith(".md") ? [relative(ROOT, full)] : [];
  });
}

/** Each widget page by path, with the record the packed `widgets.json` holds for its widget. */
async function widgetPages() {
  const records = await loadWidgetRecords();
  const pages = PAGES.filter((page) => page.kind === "widget");
  return new Map(pages.map((page) => [`docs/${page.path}`, records.get(page.widget) ?? null]));
}

export async function checkReferencePages() {
  const widgets = await widgetPages();
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
    hash: (path) => (existsSync(resolve(ROOT, path)) ? hashOf(resolve(ROOT, path)) : null),
    isGeneratedText: (path) => /^---\ngenerated:/.test(readFileSync(resolve(ROOT, path), "utf8")),
    widgets,
    read: (path) => (existsSync(resolve(ROOT, path)) ? readFileSync(resolve(ROOT, path), "utf8") : null),
  };
  const faults = pageFaults(tree);
  if (faults.length === 0) {
    console.log(
      `Reference pages: ${tree.generated.size} generated, no hand page, none committed or edited, ${tree.widgets.size} widget pages headed by their records (planted faults found: ${PLANTED_KINDS.length}).`,
    );
    return [];
  }
  console.log("Every reference page is generated from doc comments:");
  for (const [, path, message] of faults) console.log(`  ${path} ${message}`);
  return ["reference pages"];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if ((await checkReferencePages()).length > 0) process.exit(1);
}
