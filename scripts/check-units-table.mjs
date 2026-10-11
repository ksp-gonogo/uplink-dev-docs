/**
 * Holds the Guide's "How each unit is drawn" section to the contract's `Units`
 * class: every constant the contract declares is named there, and every
 * `Units.<Name>` the section names is one the contract still declares. A unit
 * added to the contract that the table does not list fails here.
 *
 * The constants come from the generated reference (`npm run reference`), so
 * this runs after it.
 *
 *   node scripts/check-units-table.mjs
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const UNITS_DIR = resolve(ROOT, ".reference/xmldocmd/Sitrep.Contract/Units");
const PAGE = resolve(ROOT, "docs/guide/topics.md");
const HEADING = "### How each unit is drawn";

/** The `Units` constants the contract declares, by name. */
function declared() {
  return readdirSync(UNITS_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

/** The `Units.<Name>` references in the section, by name. */
function named(markdown) {
  const start = markdown.indexOf(HEADING);
  if (start < 0) throw new Error(`${PAGE} has no "${HEADING}" section`);
  const end = markdown.indexOf("\n## ", start);
  const section = markdown.slice(start, end < 0 ? undefined : end);
  return new Set([...section.matchAll(/`Units\.(\w+)`/g)].map((m) => m[1]));
}

/** What is wrong, as sentences, or an empty list. */
export function problems(constants, listed) {
  return [
    ...constants.filter((name) => !listed.has(name)).map((name) => `Units.${name} is declared by the contract and missing from "${HEADING.slice(4)}"`),
    ...[...listed].filter((name) => !constants.includes(name)).map((name) => `Units.${name} is in "${HEADING.slice(4)}" and not declared by the contract`),
  ];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!existsSync(UNITS_DIR)) {
    console.error(`check-units-table: ${UNITS_DIR} is missing; run npm run reference first`);
    process.exit(1);
  }
  const constants = declared();
  if (constants.length < 20) {
    console.error(`check-units-table: only ${constants.length} Units constants were found, so the generated reference is not what this reads`);
    process.exit(1);
  }
  // A constant dropped from the list must be seen, or a clean result means nothing.
  const blind = problems(constants, new Set(constants.slice(1)));
  if (blind.length !== 1) {
    console.error("check-units-table: BLIND, a planted missing constant was not reported");
    process.exit(1);
  }
  const found = problems(constants, named(readFileSync(PAGE, "utf8")));
  for (const line of found) console.error(`check-units-table: ${line}`);
  if (found.length > 0) process.exit(1);
  console.log(`check-units-table: all ${constants.length} Units constants are in the Guide's table`);
}
