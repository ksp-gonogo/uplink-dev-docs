/**
 * Every ui-kit COMPONENT has a reference page, and every reference page is
 * about something ui-kit actually exports.
 *
 * ## What counts as a component, and why it is not a list
 *
 * React gives a component exactly two shapes, so the gate asks for exactly
 * those two: a FUNCTION whose return is a React element, or an EXOTIC
 * COMPONENT object (what `forwardRef`, `memo` and styled-components' own
 * `createGlobalStyle` produce, marked by the `$$typeof` its type declares).
 * TypeScript decides, per export, by assignability. No name appears anywhere in
 * the rule, so a kit that grows a primitive is covered the day it publishes.
 *
 * Three sharper-looking rules were tried and are wrong:
 *
 *   - **assignable to `FunctionComponent`**: `formatNumber(value): string` IS.
 *     `never` widens into its parameter and `string` is a member of
 *     `ReactNode`, so the kit's number formatter reads as a component.
 *   - **writable in JSX** (`<kit.X {...p} />`): same defect, for the same
 *     reason. React 18.3's `JSX.ElementType` admits any function returning
 *     `ReactNode`, and `string` is one.
 *   - **returns `ReactElement | null`**: rejects `ScrollArea` and every other
 *     styled component, because `ForwardRefExoticComponent`'s call signature
 *     returns `ReactNode` in React 18.3's types. Measured, not guessed.
 *
 * A runtime `typeof` probe is not available: ui-kit cannot be imported by a
 * bare Node process at all, since it evaluates `styled.span` at module scope
 * and styled-components 6 ships no `exports` map, so Node loads its CJS half
 * and the default export arrives as the namespace rather than the factory.
 * gonogo's own extraction probe carries all five ui-kit entry points as runtime
 * -import exemptions for exactly this.
 *
 * ## What a PAGE is about
 *
 * Not one page per export. `PanelTitle`, `PanelSubtitle` and `ScrollArea` all
 * ship from `./Panel`, and `Panel.md` is where they belong. So the unit of
 * documentation is the MODULE the barrel exports a name from: the kit author's
 * own grouping, not one this script invents, and the page takes the module's
 * basename. Nine components collapse into five pages that way with no list
 * anywhere.
 *
 * A module exporting no component needs no page. That is how the theme
 * contract (interfaces only), `formatNumber` and the default theme object are
 * excluded without being named. They are still ALLOWED a page, because a page
 * named after a real public export is about something real, and
 * `formatNumber.md` is one.
 *
 * ## Reading a failure
 *
 * Four things can be wrong and they want different fixes:
 *   - a component with no page: write the page
 *   - a page about nothing: delete it, or add it to `NON_COMPONENT_PAGES` with
 *     the reason no export can name it
 *   - a component documented somewhere other than its own page: add it to
 *     `COVERED_ELSEWHERE`, which is checked, not taken on trust: the page it
 *     names has to mention the component or the gate still fails
 *   - a page the sidebar cannot reach: a file nobody can find, which is nearly
 *     the same as not having written it
 *
 * Both exception maps are SHRINK-ONLY and every entry says why. Neither is a
 * place to put a page the gate flagged.
 */
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const KIT = "@ksp-gonogo/ui-kit";
const KIT_DIST = join(root, "node_modules", KIT, "dist");
const PAGE_DIR = join(root, "docs", "reference", "ui-kit");
const CONFIG = join(root, "docs", ".vitepress", "config.mts");
const PAGE_DIR_LABEL = "docs/reference/ui-kit";

/** Pages that exist for a reason no export can produce. Shrink-only. */
const NON_COMPONENT_PAGES = {
  index:
    "the section's own landing page: installing the kit and getting a theme in scope. It is about the PACKAGE, so no one export can name it.",
  theme:
    'the theme contract. `export * from "./theme"` ships interfaces only, so there is no value called `theme` for a page to be named after, and an author still has to be told what shape a theme is.',
};

/**
 * Components documented on a page other than their own, with the page that
 * covers them. Checked rather than trusted: that page must mention the
 * component by name. Shrink-only.
 */
const COVERED_ELSEWHERE = {
  GonogoTokens: {
    page: "index",
    why: "part of getting a theme in scope rather than a primitive an author places in a widget, so it belongs beside the setup page's ThemeProvider snippet and not on a page of its own.",
  },
};

const failures = [];
const fail = (message) => failures.push(message);

// --------------------------------------------------------------------------
// The barrel, read as a syntax tree rather than with a regex. A regex over a
// `.d.ts` that stops matching reports zero exports, and zero exports reads as
// a clean bill of health from an instrument that has gone blind.
// --------------------------------------------------------------------------

/** Every value export of the barrel, with the module it came from. */
function readBarrel(file, seen = new Set()) {
  if (seen.has(file)) return [];
  seen.add(file);
  const sf = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const out = [];
  for (const statement of sf.statements) {
    if (!ts.isExportDeclaration(statement)) continue;
    const specifier = statement.moduleSpecifier;
    if (!specifier || !ts.isStringLiteral(specifier)) continue;
    const from = specifier.text;
    const clause = statement.exportClause;
    // `export * from "./theme"`: followed, so a star-exported component is not
    // invisible to the coverage half.
    if (!clause) {
      out.push(...readBarrel(join(KIT_DIST, `${from}.d.ts`), seen));
      continue;
    }
    if (!ts.isNamedExports(clause)) continue;
    for (const element of clause.elements) {
      if (statement.isTypeOnly || element.isTypeOnly) continue;
      out.push({ name: element.name.text, from });
    }
  }
  return out;
}

const barrel = readBarrel(join(KIT_DIST, "index.d.ts"));
if (barrel.length === 0) {
  fail(
    `read no value exports at all from ${KIT}'s barrel. That is an instrument failure, not a clean tree: the gate can say nothing about coverage.`,
  );
}

// --------------------------------------------------------------------------
// Which exports are components. One probe file, one line per export, plus
// three PLANTED lines the compiler has to get right: two non-components it
// must reject and one component it must accept. A probe that cannot be seen
// to discriminate reports every export as a component, and that reads as
// success.
// --------------------------------------------------------------------------

const PLANTS = {
  // A function returning a string: what defeated the two rules a reader would
  // reach for first, and the shape `formatNumber` really has.
  __plantReturnsString: { source: "() => \"not an element\"", component: false },
  // A plain object: what a theme or a token bundle is.
  __plantPlainObject: { source: "{ colors: {} }", component: false },
  // A real function component, so a probe that rejects EVERYTHING fails too.
  __plantComponent: { source: "() => null", component: true },
};

function componentExports(candidates) {
  // Inside the repo, not the system temp dir: `moduleResolution: bundler`
  // resolves a package by walking UP from the importing file, so a probe in
  // /tmp resolves neither the kit nor react's JSX runtime, every line errors
  // identically, and every export reads as a non-component. Caught by the
  // plants below rather than shipped, which is why it is written down.
  const dir = mkdtempSync(join(root, ".ui-kit-probe-"));
  const lines = [
    'import type { ExoticComponent, ReactElement } from "react";',
    `import * as kit from "${KIT}";`,
    "",
    "// The two shapes React gives a component, and nothing else.",
    "type Component =",
    "  | ((...args: never[]) => ReactElement | null)",
    "  | ExoticComponent<never>;",
    "",
  ];
  for (const [name, plant] of Object.entries(PLANTS)) {
    lines.push(`const ${name} = ${plant.source};`);
  }
  lines.push("");
  const lineOf = new Map();
  const probed = [...Object.keys(PLANTS), ...candidates];
  for (const name of probed) {
    const value = name in PLANTS ? name : `kit.${name}`;
    lineOf.set(lines.length + 1, name);
    lines.push(`const _probe_${name.replace(/\W/g, "_")}: Component = ${value};`);
  }
  lines.push("");
  writeFileSync(join(dir, "probe.tsx"), lines.join("\n"));
  writeFileSync(
    join(dir, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["ES2022", "DOM"],
          module: "ESNext",
          moduleResolution: "bundler",
          jsx: "react-jsx",
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          types: [],
        },
        include: ["probe.tsx"],
      },
      null,
      2,
    )}\n`,
  );

  let result;
  try {
    result = spawnSync(
      process.execPath,
      [join(root, "node_modules", "typescript", "bin", "tsc"), "-p", dir],
      { cwd: root, encoding: "utf8" },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  const rejected = new Set();
  const unattributed = [];
  for (const line of `${result.stdout}${result.stderr}`.split("\n")) {
    const at = /probe\.tsx\((\d+),\d+\): error/.exec(line);
    if (!at) continue;
    const name = lineOf.get(Number(at[1]));
    if (name) rejected.add(name);
    else unattributed.push(line.trim());
  }
  if (unattributed.length > 0) {
    fail(
      `the component probe reported ${unattributed.length} error(s) on no probed line, so its verdict is not about the kit:\n      ${unattributed.join("\n      ")}`,
    );
  }
  for (const [name, plant] of Object.entries(PLANTS)) {
    if (plant.component === rejected.has(name)) {
      fail(
        `the component probe got its planted ${plant.component ? "COMPONENT" : "non-component"} \`${plant.source}\` wrong, so it cannot tell a component from anything else and its verdict on the kit means nothing.`,
      );
    }
  }
  return new Set(candidates.filter((name) => !rejected.has(name)));
}

const components = componentExports(barrel.map((entry) => entry.name));

// --------------------------------------------------------------------------
// Modules are the unit of documentation; a page takes the module's basename.
// --------------------------------------------------------------------------

const unitOf = (from) => from.split("/").pop();
/** page name -> the components it covers */
const componentUnits = new Map();
for (const { name, from } of barrel) {
  if (!components.has(name)) continue;
  if (Object.hasOwn(COVERED_ELSEWHERE, name)) continue;
  const unit = unitOf(from);
  if (!componentUnits.has(unit)) componentUnits.set(unit, []);
  componentUnits.get(unit).push(name);
}

const exportedNames = new Set(barrel.map((entry) => entry.name));
const pages = readdirSync(PAGE_DIR)
  .filter((file) => file.endsWith(".md"))
  .map((file) => file.slice(0, -3));

for (const [unit, covered] of [...componentUnits].sort()) {
  if (pages.includes(unit)) continue;
  fail(
    `no page for ui-kit component${covered.length > 1 ? "s" : ""} ${covered.join(", ")}: write ${PAGE_DIR_LABEL}/${unit}.md`,
  );
}

for (const page of [...pages].sort()) {
  if (componentUnits.has(page)) continue;
  if (exportedNames.has(page)) continue;
  if (Object.hasOwn(NON_COMPONENT_PAGES, page)) continue;
  fail(
    `${PAGE_DIR_LABEL}/${page}.md is about nothing ${KIT} exports. Delete it, or add "${page}" to NON_COMPONENT_PAGES with the reason no export can name it.`,
  );
}

// An exception is a claim about where something IS documented, so the claim is
// checked. Otherwise the map is just a way of not writing the page.
for (const [name, { page }] of Object.entries(COVERED_ELSEWHERE)) {
  if (!components.has(name)) {
    fail(
      `COVERED_ELSEWHERE names ${name}, which ${KIT} no longer exports as a component. Drop the entry.`,
    );
    continue;
  }
  if (!pages.includes(page)) {
    fail(
      `COVERED_ELSEWHERE says ${name} is documented on ${PAGE_DIR_LABEL}/${page}.md, which does not exist.`,
    );
    continue;
  }
  const body = readFileSync(join(PAGE_DIR, `${page}.md`), "utf8");
  if (!body.includes(name)) {
    fail(
      `COVERED_ELSEWHERE says ${name} is documented on ${PAGE_DIR_LABEL}/${page}.md, and that page never mentions it.`,
    );
  }
}

// --------------------------------------------------------------------------
// A page the sidebar cannot reach is a file nobody finds.
// --------------------------------------------------------------------------

const config = readFileSync(CONFIG, "utf8");
const primitives = /const primitives = \[([^\]]*)\]/s.exec(config);
if (!primitives) {
  fail(
    "could not find the `primitives` sidebar array in docs/.vitepress/config.mts, so sidebar reachability went unchecked.",
  );
} else {
  const listed = new Set(
    [...primitives[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]),
  );
  if (listed.size === 0) {
    fail(
      "read no names out of the `primitives` sidebar array, so sidebar reachability went unchecked.",
    );
  }
  for (const unit of componentUnits.keys()) {
    if (!listed.has(unit)) {
      fail(
        `${unit} has a page but the sidebar's \`primitives\` array does not list it, so nothing links to it.`,
      );
    }
  }
  for (const name of listed) {
    if (!componentUnits.has(name)) {
      fail(
        `the sidebar's \`primitives\` array lists ${name}, which is not a ui-kit component module. Give it its own sidebar entry (as Theme and formatNumber have) or drop it.`,
      );
    }
  }
}

// --------------------------------------------------------------------------

const summary = [...componentUnits]
  .sort()
  .map(([unit, covered]) => `${unit}.md (${covered.join(", ")})`);
process.stdout.write(
  `${KIT} exports ${barrel.length} values; ${components.size} are components, in ${componentUnits.size} page(s):\n  ${summary.join("\n  ")}\n`,
);
const elsewhere = Object.keys(COVERED_ELSEWHERE);
if (elsewhere.length > 0) {
  process.stdout.write(
    `Documented elsewhere by exception: ${elsewhere
      .map((name) => `${name} (on ${COVERED_ELSEWHERE[name].page}.md)`)
      .join(", ")}\n`,
  );
}

if (failures.length > 0) {
  process.stdout.write(`\nFAILED (${failures.length}):\n`);
  for (const message of failures) process.stdout.write(`  - ${message}\n`);
  process.exit(1);
}
process.stdout.write(
  "\nEvery component has a page, every page has a subject, and the sidebar reaches all of them.\n",
);
