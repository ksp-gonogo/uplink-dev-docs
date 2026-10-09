/**
 * Holds the docs checks themselves to account: each debt list must refuse
 * growth and report a stale entry, every `check-*.mjs` script must be reached
 * by `npm run build`, and CI must run that build on every push.
 *
 * Before grading the repo it grades planted faults with the same functions and
 * fails as BLIND unless every one is found, because a ratchet that cannot see a
 * violation reports a clean tree.
 *
 *   node scripts/check-ratchets.mjs
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { againstDebt, linkDebtFaults } from "./debt-ratchet.mjs";
import { MISSING_SYMBOL_DEBT, STALE_PAGE_DEBT } from "./doc-symbols-debt.mjs";
import { UNRESOLVED_LINK_DEBT } from "./symbol-link-debt.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** The package scripts `command` runs, directly or through `npm run`, as one text. */
export function expandScripts(command, scripts, seen = new Set()) {
  let text = command;
  for (const [, name] of command.matchAll(/npm run ([\w:.-]+)/g)) {
    if (seen.has(name) || scripts[name] === undefined) continue;
    seen.add(name);
    text += `\n${expandScripts(scripts[name], scripts, seen)}`;
  }
  return text;
}

/** Check scripts nothing in the build reaches. `wired` is the build's text plus the aggregator's source. */
export function unwiredChecks(files, wired) {
  return files.filter((file) => !wired.includes(file));
}

/** Why a workflow would not run the build on every push, as a list of faults. */
export function workflowFaults(yml) {
  const faults = [];
  const on = /^on:\s*\n((?:[ \t]+.*\n|\s*\n)*)/m.exec(yml)?.[1] ?? "";
  if (!/^[ \t]+push:/m.test(on)) faults.push("does not trigger on push");
  if (/^[ \t]+push:\s*\n(?:[ \t]{4,}\S.*\n)*?[ \t]{4,}(branches|branches-ignore|paths|paths-ignore|tags):/m.test(on)) {
    faults.push("filters its push trigger by branch, path or tag");
  }
  if (!/^\s+- run: npm run build\s*$/m.test(yml) && !/^\s+- run: npm run build\n\s+env:/m.test(yml)) {
    faults.push("has no `npm run build` step");
  }
  if (/continue-on-error:\s*true/.test(yml)) faults.push("lets a step fail without failing the run");
  const build = /^ {2}build:\n([\s\S]*?)(?=^ {2}\S|$(?![\s\S]))/m.exec(yml)?.[1] ?? "";
  if (/^ {4}if:/m.test(build)) faults.push("gates the build job behind an `if`");
  return faults;
}

const PLANT_WORKFLOW = `name: x
on:
  push:
    branches: [main]
jobs:
  build:
    if: github.ref == 'refs/heads/main'
    steps:
      - run: npm run build
        continue-on-error: true
`;
const GOOD_WORKFLOW = `name: x
on:
  push:
  workflow_dispatch:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
        env:
          A: b
  deploy:
    if: github.ref == 'refs/heads/main'
    steps:
      - run: echo
`;

/** Every planted fault must be found and every planted clean case must stay clean. */
function blind() {
  const lost = [];
  if (againstDebt({ "a.md": 2 }, { "a.md": 1 }).over.length !== 1) lost.push("a debt count that grew");
  if (againstDebt({ "new.md": 1 }, {}).over.length !== 1) lost.push("a file with debt not on the list");
  if (againstDebt({ "a.md": 0 }, { "a.md": 1 }).stale.length !== 1) lost.push("a debt entry already fixed");
  const same = againstDebt({ "a.md": 1 }, { "a.md": 1 });
  if (same.over.length + same.stale.length !== 0) lost.push("(clean) a debt list equal to the scan was reported");
  if (linkDebtFaults(["New"], ["Old"]).unresolved.join() !== "New") lost.push("a new unresolved symbol link");
  if (linkDebtFaults(["New"], ["New", "Old"]).stale.join() !== "Old") lost.push("a symbol link entry that now resolves");
  const clean = linkDebtFaults(["A"], ["A"]);
  if (clean.unresolved.length + clean.stale.length !== 0) lost.push("(clean) a symbol link list equal to the scan was reported");
  const scripts = { build: "npm run a && npm run b", a: "node scripts/check-x.mjs", b: "node y.mjs" };
  const wired = expandScripts(scripts.build, scripts);
  if (unwiredChecks(["check-x.mjs", "check-lost.mjs"], wired).join() !== "check-lost.mjs") lost.push("a check script outside the build");
  if (workflowFaults(PLANT_WORKFLOW).length !== 3) lost.push("a workflow that filters, gates and tolerates failure");
  if (workflowFaults(GOOD_WORKFLOW).length !== 0) lost.push("(clean) a workflow that runs the build on every push was faulted");
  return lost;
}

export function checkRatchets() {
  const lost = blind();
  if (lost.length > 0) {
    console.log(`BLIND: the planted violations went unseen, so a clean result would mean nothing.\n  ${lost.join("\n  ")}`);
    return ["ratchets (blind)"];
  }
  const failures = [];
  const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
  const wired = `${expandScripts(pkg.scripts.build, pkg.scripts)}\n${readFileSync(resolve(ROOT, "scripts/check-snippets.mjs"), "utf8")}`;
  const checks = readdirSync(resolve(ROOT, "scripts")).filter((f) => /^check-.*\.mjs$/.test(f) && f !== "check-snippets.mjs");
  if (checks.length < 8) {
    console.log(`BLIND: only ${checks.length} check scripts found under scripts/.`);
    return ["ratchets (blind)"];
  }
  const unwired = unwiredChecks(checks, wired);
  if (unwired.length > 0) {
    console.log(`A check that \`npm run build\` never runs enforces nothing:\n  ${unwired.join("\n  ")}`);
    failures.push("ratchets (unwired check)");
  }
  const workflow = workflowFaults(readFileSync(resolve(ROOT, ".github/workflows/pages.yml"), "utf8"));
  if (workflow.length > 0) {
    console.log(`pages.yml must run \`npm run build\` on every push, and it ${workflow.join("; and it ")}.`);
    failures.push("ratchets (workflow)");
  }
  if (failures.length === 0) {
    const listed = Object.keys(STALE_PAGE_DEBT).length + Object.keys(MISSING_SYMBOL_DEBT).length + UNRESOLVED_LINK_DEBT.length;
    console.log(`Ratchets: ${checks.length} check scripts wired into the build, pages.yml builds on every push, ${listed} debt entries (planted faults found: 9).`);
  }
  return failures;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (checkRatchets().length > 0) process.exit(1);
}
