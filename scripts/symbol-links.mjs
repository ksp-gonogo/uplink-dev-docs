/**
 * Every documented symbol and the URL of its reference entry, and how a
 * code span on a page is read as a reference to one.
 *
 * `npm run reference` writes the index; the Markdown pass in the VitePress
 * config links each reference through it, and `check-symbol-links.mjs` fails
 * the build on one the built site leaves unlinked or links wrongly.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AMBIGUOUS_SYMBOLS } from "./ambiguous-symbols.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const SYMBOL_INDEX = resolve(ROOT, ".reference/symbols.json");

/**
 * The documented symbol a code span names, or null. A span names one when it
 * is the name alone, the name called (`useTelemetry()`), or the name given
 * type arguments (`SlotProps<"crew-status.avatar">`).
 */
export function namedSymbol(text, index) {
  const match = /^([A-Za-z_$][\w$]*)(?:\(\)|<.*>)?$/s.exec(text.trim());
  if (!match || !Object.hasOwn(index, match[1])) return null;
  return match[1];
}

/**
 * The symbol a code span refers to, or null: the one it names, unless that
 * name is ambiguous, in which case only an explicit link refers to it.
 */
export function symbolOf(text, index) {
  const name = namedSymbol(text, index);
  return name && !Object.hasOwn(AMBIGUOUS_SYMBOLS, name) ? name : null;
}

/** A site-relative URL's page, without its anchor or a trailing `index`. */
export function pageOf(url) {
  return url.split("#")[0].replace(/(\/index)?(\.html)?$/, "").replace(/\/$/, "") || "/";
}

/**
 * The page a Markdown file becomes, as `pageOf` writes it:
 * `guide/extensions.md` is `/guide/extensions`, `reference/mod/index.md` is
 * `/reference/mod`.
 */
export function pageOfFile(relativePath) {
  return pageOf(`/${relativePath.replace(/\.md$/, "")}`);
}

/** Whether a link to `url` from `page` would only take the reader to the top of the page they are on. */
export const isSelf = (url, page) => !url.includes("#") && pageOf(url) === page;

let cached = { mtime: 0, index: null };

/** The index `npm run reference` wrote, re-read whenever it has been rewritten. */
export function loadSymbolIndex() {
  if (!existsSync(SYMBOL_INDEX)) {
    throw new Error(`${SYMBOL_INDEX} does not exist. Run \`npm run reference\` first; it writes the symbol index.`);
  }
  const mtime = statSync(SYMBOL_INDEX).mtimeMs;
  if (cached.mtime !== mtime) cached = { mtime, index: JSON.parse(readFileSync(SYMBOL_INDEX, "utf8")) };
  return cached.index;
}
