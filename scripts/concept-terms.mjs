/**
 * The words that name a concept, and how prose is read for them.
 *
 * A concept's terms are the parts of its name: "Augment, contribution and slot"
 * is three, `augment`, `contribution` and `slot`. `npm run reference` writes
 * each term with its concept page's URL, and the Markdown pass in the VitePress
 * config links the first use of each term on a page to that page.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const CONCEPT_TERMS = resolve(ROOT, ".reference/concept-terms.json");

/**
 * Terms that also mean something unrelated in ordinary prose, each with what
 * else it means. Prose naming one is never linked; link it by hand where the
 * concept is meant. `npm run reference` fails on an entry no concept's name
 * gives any more.
 */
export const AMBIGUOUS_TERMS = {
  action: "also a GitHub Actions workflow, and an action a command performs",
  binding: "also binding a member by name through reflection",
};

/** A concept name's terms, lower-cased: "Station and main screen" is `station` and `main screen`. */
export const termsOf = (conceptName) =>
  conceptName
    .split(/,\s*|\s+and\s+/)
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);

let cached = { mtime: 0, terms: null };

/** The term index `npm run reference` wrote, or an empty one before it has run. */
export function loadConceptTerms() {
  if (!existsSync(CONCEPT_TERMS)) return {};
  const text = readFileSync(CONCEPT_TERMS, "utf8");
  if (cached.text !== text) cached = { text, terms: JSON.parse(text) };
  return cached.terms;
}
