/**
 * Fails when a doc page documents something the kit does not export.
 *
 * Three questions, all of them about the same promise: a name on a reference
 * page is a name an Uplink author is being told to import.
 *
 *   1. Every `docs/reference/ui-kit/*.md` has a live subject. A page for a
 *      component that has been deleted fails.
 *   2. Every symbol a page names as importable is importable. Imports in
 *      snippets and in the `template/` sources they are included from, the
 *      declarations a page writes out as the kit's type surface, and
 *      backticked names in the prose around them.
 *   3. Every internal link resolves to a page that exists.
 *
 * Read `doc-symbols-debt.mjs` for the rule, where the truth comes from and why
 * `node_modules` is not it, and for the two shrink-only debt lists.
 *
 * `node scripts/check-doc-symbols.mjs --sync` regenerates the export snapshot
 * from a gonogo checkout. That is the only sanctioned way to change it.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  EXTERNAL_IDENTIFIERS,
  FLOORS,
  MISSING_SYMBOL_DEBT,
  STALE_PAGE_DEBT,
} from "./doc-symbols-debt.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SNAPSHOT = resolve(ROOT, "scripts/ui-kit-exports.json");
const KIT_ENTRY = "packages/ui-kit/src/index.ts";
const EXTERNAL = new Set(EXTERNAL_IDENTIFIERS);

/* ------------------------------------------------------------------ *
 * The truth: what `@ksp-gonogo/ui-kit` exports.
 * ------------------------------------------------------------------ */

/**
 * The gonogo checkout, or null for "there isn't one".
 *
 * `GONOGO_REPO` first so a checkout anywhere works, then the sibling directory,
 * which is the layout a machine holding both repos uses. Absent is normal and
 * not fatal: CI has this repo only, which is exactly why the snapshot exists.
 *
 * A `GONOGO_REPO` that is set but wrong is an ERROR rather than a fall-through
 * to the sibling. Someone who names a checkout means that one, and quietly
 * grading a different tree is how a check comes to report on something nobody
 * asked about. `GONOGO_REPO=off` is the spelling for "pretend there is none",
 * which is how the CI path gets exercised on a machine that has both.
 */
/**
 * CI checks out gonogo on purpose, so a missing checkout there is a broken
 * workflow rather than the normal state of a machine that holds only this repo,
 * and every gate that needs one fails instead of skipping.
 */
export const IN_CI = process.env.CI === "true";

export function gonogoRoot() {
  const named = process.env.GONOGO_REPO;
  if (named === "off") return null;
  if (named) {
    if (existsSync(resolve(named, KIT_ENTRY))) return named;
    throw new Error(
      `GONOGO_REPO=${named} has no ${KIT_ENTRY}. Point it at a gonogo checkout, ` +
        "unset it to look for one beside this repo, or set it to `off`.",
    );
  }
  const sibling = resolve(ROOT, "..", "gonogo");
  return existsSync(resolve(sibling, KIT_ENTRY)) ? sibling : null;
}

/**
 * Every name the kit's root barrel exports, read with the TypeScript checker
 * rather than by reading `export` statements, so `export * from "./augments"`
 * is FOLLOWED. Guessing this breaks the check in both directions at once:
 * under-collect and it manufactures findings, over-collect and it masks the one
 * it exists to catch.
 */
async function exportsFromSource(root) {
  const { default: ts } = await import("typescript");
  const entry = resolve(root, KIT_ENTRY);
  const program = ts.createProgram([entry], {
    noEmit: true,
    jsx: ts.JsxEmit.Preserve,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
  });
  const checker = program.getTypeChecker();
  const symbol = checker.getSymbolAtLocation(program.getSourceFile(entry));
  if (!symbol) throw new Error(`${entry} is not a module`);
  return checker
    .getExportsOfModule(symbol)
    .map((s) => s.getName())
    .sort();
}

/**
 * The committed export list, so CI checks the pages at full strength without a
 * gonogo checkout, and the local run that HAS one verifies the snapshot against
 * source in the same pass. A transcription nobody regenerates agrees with
 * itself forever; this one is generated, and a stale copy fails here rather
 * than going quietly out of date.
 */
function readSnapshot() {
  const json = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
  return { names: new Set(json.exports), meta: json };
}

/* ------------------------------------------------------------------ *
 * What the docs claim.
 * ------------------------------------------------------------------ */

function walk(dir, keep) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      return entry === "cache" || entry === "dist" || entry === "node_modules"
        ? []
        : walk(full, keep);
    }
    return keep(full) ? [full] : [];
  });
}

const KIT_IMPORT =
  /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*["']@ksp-gonogo\/ui-kit["']/g;

/** A top-level declaration inside a page's type block: the page stating the kit's surface. */
const DECLARATION =
  /^(?:export\s+)?(?:declare\s+)?(?:abstract\s+)?(?:const|let|var|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/;

const TYPE_FENCE = /^(ts|tsx|typescript|js|jsx)$/;

const specifiers = (clause) =>
  clause
    .split(",")
    .map((s) => s.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim())
    .filter(Boolean);

/**
 * Whether a backticked word in prose is claiming to be a kit export.
 *
 * PascalCase carrying a lowercase letter, or a SCREAMING_SNAKE constant. Both
 * halves are deliberate. Plain lowercase is excluded because prose is full of
 * prop names and token values (`tone`, `gap`, `xs`, `go`) that are not exports
 * and never were. All-caps with no underscore is excluded because that is how
 * this kit's prose writes a state token (`GO`, `NOMINAL`, `ABORT`) while every
 * constant it actually exports is underscored (`NULL_DISPLAY`,
 * `ARM_TIMEOUT_MS`, `COL_WIDTH`).
 */
const claimsToBeAnExport = (name) =>
  (/^[A-Z][A-Za-z0-9]*$/.test(name) && /[a-z]/.test(name)) ||
  /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$/.test(name);

/**
 * Every claim the docs make, with where it was made.
 *
 * `template/` counts as doc content, not as a sample app: those files are
 * `<<<`-included into the pages, so an import in one is printed on a reference
 * page. It is also the half `tsc` cannot grade, because it compiles them
 * against the installed tarball.
 */
function collectClaims() {
  const claims = [];
  const pages = [];
  const links = [];
  const add = (file, line, name, kind) =>
    claims.push({ file: relative(ROOT, file), line, name, kind });

  for (const file of walk(resolve(ROOT, "docs"), (f) => f.endsWith(".md"))) {
    const rel = relative(ROOT, file);
    const body = readFileSync(file, "utf8");
    const lines = body.split("\n");
    // A generated page names what TypeDoc resolved in the package itself, so its names cannot be stale against it.
    const generated = /^---\ngenerated:/.test(body);
    const isReference = rel.startsWith("docs/reference/ui-kit/") && !generated;
    const declared = [];
    let fence = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const open = /^```(\w*)/.exec(line);
      if (open) {
        fence = fence === null ? open[1] : null;
        continue;
      }
      if (fence !== null) {
        if (!isReference || !TYPE_FENCE.test(fence)) continue;
        const declaration = DECLARATION.exec(line);
        if (declaration) {
          declared.push(declaration[1]);
          add(file, i + 1, declaration[1], "declared");
        }
        continue;
      }
      for (const m of line.matchAll(/\[[^\]]*\]\((\/[^)\s]+)\)/g)) {
        links.push({ file: rel, line: i + 1, target: m[1] });
      }
      if (!isReference) continue;
      for (const m of line.matchAll(/`([^`\n]+)`/g)) {
        const head = m[1]
          .trim()
          .replace(/^[<{(\s]+/, "")
          .match(/^[A-Za-z_$][\w$]*/);
        if (head && claimsToBeAnExport(head[0])) add(file, i + 1, head[0], "mention");
      }
    }

    for (const m of body.matchAll(KIT_IMPORT)) {
      const line = body.slice(0, m.index).split("\n").length;
      for (const name of specifiers(m[1])) add(file, line, name, "import");
    }

    pages.push({
      file: rel,
      isReference: isReference || (generated && rel.startsWith("docs/reference/ui-kit/")),
      // The page's subject, as the two places a page says what it is about.
      subjects: [
        rel.split("/").pop().replace(/\.md$/, ""),
        (/^#\s+(.+)$/m.exec(body)?.[1] ?? "").trim(),
      ],
      declared,
    });
  }

  const templateSources = walk(resolve(ROOT, "template"), (f) => /\.tsx?$/.test(f));
  for (const file of templateSources) {
    const body = readFileSync(file, "utf8");
    for (const m of body.matchAll(KIT_IMPORT)) {
      const line = body.slice(0, m.index).split("\n").length;
      for (const name of specifiers(m[1])) add(file, line, name, "import");
    }
  }

  return { claims, pages, links, templateSources: templateSources.length };
}

/* ------------------------------------------------------------------ *
 * Grading.
 * ------------------------------------------------------------------ */

/**
 * The two findings an export set produces. Taken as an argument rather than
 * read from a module global so the plants below can run the real grader over a
 * doctored set, which is the only way to watch this thing fail.
 */
function grade({ claims, pages }, exported) {
  const missing = claims.filter(
    (c) => !exported.has(c.name) && !EXTERNAL.has(c.name),
  );
  const deadSubjects = pages.filter((page) => {
    if (!page.isReference || page.file.endsWith("/index.md")) return false;
    if (page.subjects.some((s) => exported.has(s))) return false;
    // A page whose title is not itself an export (`theme.md` documents
    // `UiKitTheme`) is still live if it writes out a type the kit exports.
    return !page.declared.some((d) => exported.has(d));
  });
  return { missing, deadSubjects };
}

const tally = (rows, key) => {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] ?? 0) + 1;
  return out;
};

/** Counts over a ceiling, and entries whose violation is already gone. */
function againstDebt(counts, debt) {
  const over = [];
  const stale = [];
  for (const [file, count] of Object.entries(counts)) {
    const allowed = debt[file] ?? 0;
    if (count > allowed) over.push({ file, count, allowed });
  }
  for (const [file, allowed] of Object.entries(debt)) {
    const count = counts[file] ?? 0;
    if (count < allowed) stale.push({ file, count, allowed });
  }
  return { over, stale };
}

/* ------------------------------------------------------------------ *
 * Entry point.
 * ------------------------------------------------------------------ */

export async function checkDocSymbols(write = (s) => process.stdout.write(s)) {
  const failures = [];
  const fail = (label, detail) => {
    failures.push(label);
    write(`${detail}\n`);
  };

  const { names: exported, meta } = readSnapshot();
  const scan = collectClaims();
  const { claims, pages, links, templateSources } = scan;
  const referencePages = pages.filter((p) => p.isReference).length;

  write(
    `${exported.size} kit exports (snapshot of ${meta.source}), ` +
      `${pages.length} pages (${referencePages} ui-kit reference), ` +
      `${templateSources} template sources, ` +
      `${claims.length} symbol claims, ${links.length} internal links.\n`,
  );

  /* --- The instrument, before anything that could pass by finding nothing. --- */

  const census = {
    kitExports: exported.size,
    markdownPages: pages.length,
    referencePages,
    templateSources,
    claims: claims.length,
    internalLinks: links.length,
  };
  const under = Object.entries(FLOORS)
    .filter(([k, floor]) => census[k] < floor)
    .map(([k, floor]) => `${k}: ${census[k]} < ${floor}`);
  if (under.length > 0) {
    fail(
      "doc symbols (scan floor)",
      `BLIND: the scan walked less than it must.\n  ${under.join("\n  ")}\n` +
        "A scan that finds nothing and a scan that looked at nothing report the\n" +
        "same clean result. A wrong path, a renamed directory or a fence regex\n" +
        "that stopped matching all land here.",
    );
  }

  // Both directions on the export set. An over-broad one masks every real
  // finding and cannot be told from a correct one by counting.
  const shouldExport = ["Panel", "Stack", "Unit", "Badge", "Button"];
  const shouldNotExport = ["getHost", "registerComponent", "useTelemetry"];
  const wrong = [
    ...shouldExport.filter((n) => !exported.has(n)).map((n) => `missing ${n}`),
    ...shouldNotExport.filter((n) => exported.has(n)).map((n) => `unexpected ${n}`),
  ];
  if (wrong.length > 0) {
    fail(
      "doc symbols (export set)",
      `BLIND: the export set is not the kit's.\n  ${wrong.join("\n  ")}`,
    );
  }

  // The plants. Each one runs the REAL grader over a doctored export set and
  // has to come back with the finding. A checker that cannot be seen to fail is
  // not known to work.
  const without = (name) => new Set([...exported].filter((n) => n !== name));
  const plantedMissing = grade(scan, without("Panel")).missing;
  if (!plantedMissing.some((m) => m.name === "Panel")) {
    fail(
      "doc symbols (planted claim)",
      "BLIND: `Panel` removed from the export set produced no finding, and the\n" +
        "pages name it throughout. Check the fence walk and the claim regexes.",
    );
  }
  // The subject rule gets a synthetic page rather than a doctored export set,
  // and it is graded in BOTH directions. Deleting one name from the set does
  // not settle it: `Panel.md` writes out `PanelProps` too, and a page that
  // documents a type the kit still exports is correctly alive. Only a page
  // where nothing lands proves the rule can say no, and only the live twin
  // proves it can still say yes.
  const syntheticPage = (subject, declared) => ({
    claims: [],
    pages: [
      {
        file: `docs/reference/ui-kit/${subject}.md`,
        isReference: true,
        subjects: [subject, subject],
        declared,
      },
    ],
  });
  const dead = grade(syntheticPage("DeletedThing", ["DeletedThingProps"]), exported);
  const alive = grade(syntheticPage("Panel", ["PanelProps"]), exported);
  if (dead.deadSubjects.length !== 1 || alive.deadSubjects.length !== 0) {
    fail(
      "doc symbols (planted subject)",
      "BLIND: the subject rule does not separate a page for a deleted component\n" +
        `from a page for a live one (dead: ${dead.deadSubjects.length}, ` +
        `alive: ${alive.deadSubjects.length}; want 1 and 0).`,
    );
  }
  if (resolveLink({ target: "/reference/ui-kit/NoSuchPage" }) !== null) {
    fail(
      "doc symbols (planted link)",
      "BLIND: a link to a page that does not exist resolved anyway.",
    );
  }

  /* --- The findings. --- */

  const { missing, deadSubjects } = grade(scan, exported);

  const subjectDebt = againstDebt(
    tally(deadSubjects.map((p) => ({ file: p.file })), "file"),
    STALE_PAGE_DEBT,
  );
  if (subjectDebt.over.length > 0) {
    fail(
      "doc symbols (stale page)",
      "A reference page documents a symbol the kit does not export.\n\n" +
        subjectDebt.over.map((o) => `  ${o.file}`).join("\n") +
        "\n\nThe page promises an import that fails. Delete the page and its index\n" +
        "entry, or point it at what replaced the symbol. Do NOT add it to\n" +
        "STALE_PAGE_DEBT: that list is a ceiling, and raising it writes down the\n" +
        "bug instead of fixing it.",
    );
  }

  const symbolDebt = againstDebt(tally(missing, "file"), MISSING_SYMBOL_DEBT);
  if (symbolDebt.over.length > 0) {
    const byFile = new Map();
    for (const m of missing) {
      if (!byFile.has(m.file)) byFile.set(m.file, []);
      byFile.get(m.file).push(m);
    }
    fail(
      "doc symbols (missing symbol)",
      "A doc names a symbol `@ksp-gonogo/ui-kit` does not export.\n\n" +
        symbolDebt.over
          .map((o) => {
            const where = (byFile.get(o.file) ?? [])
              .map((m) => `      ${m.file}:${m.line} ${m.name} (${m.kind})`)
              .join("\n");
            return `  ${o.file}: ${o.count} claims, ${o.allowed} allowed\n${where}`;
          })
          .join("\n") +
        "\n\nAn author copying this gets a build error. Name what replaced it, or\n" +
        "drop the sentence. If the symbol is one the kit should export, the fix\n" +
        "is in gonogo and this check is right to be red until it lands.\n" +
        "`tsc` cannot see any of this: it compiles the template against the\n" +
        "installed tarball, which is months behind and still exports them.",
    );
  }

  const stale = [...subjectDebt.stale, ...symbolDebt.stale];
  if (stale.length > 0) {
    fail(
      "doc symbols (stale debt)",
      "The debt list allows more than the scan finds.\n\n" +
        stale.map((s) => `  ${s.file} allows ${s.allowed}, found ${s.count}`).join("\n") +
        "\n\nSomething fixed it. Lower the count or delete the entry, so the list\n" +
        "keeps telling the truth about what is left.",
    );
  }

  const broken = links
    .map((link) => ({ link, target: resolveLink(link) }))
    .filter((r) => r.target === null);
  if (broken.length > 0) {
    fail(
      "doc symbols (dead link)",
      "An internal link points at a page that does not exist.\n\n" +
        broken.map((b) => `  ${b.link.file}:${b.link.line} -> ${b.link.target}`).join("\n"),
    );
  }

  /* --- The snapshot, verified against source when a checkout is reachable. --- */

  let root;
  try {
    root = gonogoRoot();
  } catch (error) {
    fail("doc symbols (gonogo checkout)", `\n${error.message}`);
    return failures;
  }
  if (!root && IN_CI) {
    fail(
      "doc symbols (gonogo checkout)",
      "\nCI=true and no gonogo checkout, so the export snapshot cannot be verified\n" +
        "against source. The workflow checks one out and sets GONOGO_REPO; that step\n" +
        "is missing or broken.",
    );
  } else if (!root) {
    write(
      "\nNOTE: no gonogo checkout, so the export snapshot could not be verified\n" +
        "against source. The checks above still ran at full strength against it.\n" +
        `Set GONOGO_REPO, or clone gonogo beside this repo, to grade the\n` +
        `snapshot too. Regenerate with: node scripts/check-doc-symbols.mjs --sync\n`,
    );
  } else {
    const live = await exportsFromSource(root);
    const added = live.filter((n) => !exported.has(n));
    const removed = [...exported].filter((n) => !live.includes(n));
    if (added.length + removed.length > 0) {
      fail(
        "doc symbols (stale snapshot)",
        `The export snapshot no longer matches ${root}/${KIT_ENTRY}.\n\n` +
          `  ${removed.length} gone: ${removed.slice(0, 12).join(", ")}\n` +
          `  ${added.length} new:  ${added.slice(0, 12).join(", ")}\n\n` +
          "Regenerate it, then re-run: node scripts/check-doc-symbols.mjs --sync\n" +
          "A symbol in `gone` is a page waiting to go stale. Never hand-edit the\n" +
          "snapshot: it is generated so it cannot quietly agree with itself.",
      );
    } else {
      write(`\nSnapshot matches ${root}/${KIT_ENTRY}.\n`);
    }
  }

  if (failures.length === 0) {
    const files = Object.keys(MISSING_SYMBOL_DEBT).length;
    const symbols = Object.values(MISSING_SYMBOL_DEBT).reduce((a, b) => a + b, 0);
    write(
      `\nEvery documented symbol resolves and every link lands, bar the known\n` +
        `staleness in scripts/doc-symbols-debt.mjs: ${symbols} claims across ` +
        `${files} files,\nand ${Object.keys(STALE_PAGE_DEBT).length} pages whose ` +
        "subject the kit no longer exports.\n",
    );
  }
  return failures;
}

/** The file a `/reference/ui-kit/Panel` style link renders from, or null. */
function resolveLink({ target }) {
  const clean = target.split("#")[0].replace(/\/$/, "");
  for (const candidate of [
    resolve(ROOT, `docs${clean}.md`),
    resolve(ROOT, `docs${clean}/index.md`),
    resolve(ROOT, `docs${clean || "/index"}.md`),
  ]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

async function sync() {
  let root;
  try {
    root = gonogoRoot();
  } catch (error) {
    process.stdout.write(`${error.message}\n`);
    process.exit(1);
  }
  if (!root) {
    process.stdout.write(
      "No gonogo checkout. Set GONOGO_REPO to one, or clone gonogo beside this\n" +
        "repo. The snapshot is generated from source and must never be edited by\n" +
        "hand: the installed tarball is months behind and cannot stand in for it.\n",
    );
    process.exit(1);
  }
  const exports = await exportsFromSource(root);
  writeFileSync(
    SNAPSHOT,
    `${JSON.stringify(
      {
        _: "Generated. Do not edit: node scripts/check-doc-symbols.mjs --sync",
        source: `@ksp-gonogo/ui-kit ${KIT_ENTRY}`,
        count: exports.length,
        exports,
      },
      null,
      2,
    )}\n`,
  );
  process.stdout.write(`Wrote ${exports.length} exports from ${root}.\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  if (process.argv.includes("--sync")) {
    await sync();
  } else {
    const failures = await checkDocSymbols();
    process.stdout.write(
      failures.length > 0 ? `\nFAILED: ${failures.join(", ")}\n` : "",
    );
    process.exit(failures.length > 0 ? 1 : 0);
  }
}
