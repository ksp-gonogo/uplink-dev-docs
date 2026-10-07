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
/** The contract's C# types alone, which a C# page's code spans name before a TypeScript type of the same name. */
export const CSHARP_SYMBOL_INDEX = resolve(ROOT, ".reference/symbols-csharp.json");

/**
 * The pages whose code spans are C#: the mod reference, and the Guide pages
 * about the plugin. The sdk mirrors many contract types under the same name
 * (`UplinkManifest`, `CommandResult`), and on these pages the name means the
 * C# type.
 */
const CSHARP_PAGES = ["/reference/mod", "/guide/plugin", "/guide/topics", "/guide/commands", "/guide/wrapping-a-mod"];

/** Whether `page` is one whose code spans name the C# type first. */
export const isCsharpPage = (page) => CSHARP_PAGES.some((prefix) => page === prefix || page.startsWith(`${prefix}/`));
/** Every Guide page a reference entry links to with `@guide`, as `npm run reference` last wrote them. */
export const GUIDE_LINK_LIST = resolve(ROOT, ".reference/guide-links.json");

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

/** Every anchor `npm run reference` wrote on each generated page that names a member, `Owner.member`. */
export const MEMBER_ANCHORS = resolve(ROOT, ".reference/member-anchors.json");

/**
 * Where a code span naming a member, `CommandResult.detail` or
 * `DelayRole.TrueNow()`, links: the member's own row where its owner's page
 * has one, in any case (the contract's members are PascalCase, the sdk's
 * camelCase), and otherwise its owner's entry. Null when the owner is not a
 * documented symbol, as in a Topic id such as `example.heartbeat`.
 */
export function memberTarget(text, index, anchors) {
  const match = /^([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)(?:\(\))?$/.exec(text.trim());
  if (!match) return null;
  const [, owner, member] = match;
  if (!Object.hasOwn(index, owner) || Object.hasOwn(AMBIGUOUS_SYMBOLS, owner)) return null;
  const page = pageOf(index[owner]);
  const wanted = `${owner}.${member}`.toLowerCase();
  const anchor = (anchors[page] ?? []).find((a) => a.toLowerCase() === wanted);
  return anchor ? `${page}#${anchor}` : index[owner];
}

/** The `uplink-tools` commands, each with a section of its own on the command line page. */
const TOOL_COMMANDS = new Set(["new", "codegen", "bundle", "bake", "package", "release", "page", "render", "docs"]);

/** Files an author edits that have a page of their own. */
const FILE_PAGES = { "uplink.json": "/guide/uplink-json" };

/**
 * Where a code span naming something that is not a symbol links: an
 * `uplink-tools` command, run directly or through npx, to its section of the
 * command line page, and a file with a page of its own to that page.
 */
export function placeOf(text) {
  const command = /^(?:npx\s+(?:@ksp-gonogo\/)?)?uplink-tools(?:@\S+)?\s+([a-z]+)\b/.exec(text.trim())?.[1];
  if (command && TOOL_COMMANDS.has(command)) return `/reference/tools/command-line#${command}`;
  return Object.hasOwn(FILE_PAGES, text.trim()) ? FILE_PAGES[text.trim()] : null;
}

let anchorsCached = { mtime: 0, anchors: {} };

/** The member anchors `npm run reference` wrote, or none before it has run. */
export function loadMemberAnchors() {
  if (!existsSync(MEMBER_ANCHORS)) return {};
  const mtime = statSync(MEMBER_ANCHORS).mtimeMs;
  if (anchorsCached.mtime !== mtime) anchorsCached = { mtime, anchors: JSON.parse(readFileSync(MEMBER_ANCHORS, "utf8")) };
  return anchorsCached.anchors;
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

let cached = { mtime: 0, index: null, csharp: null };

/**
 * The index `npm run reference` wrote, re-read whenever it has been rewritten.
 * For a page given that {@link isCsharpPage} holds for, a C# type wins over a
 * TypeScript one of the same name.
 */
export function loadSymbolIndex(page) {
  if (!existsSync(SYMBOL_INDEX)) {
    throw new Error(`${SYMBOL_INDEX} does not exist. Run \`npm run reference\` first; it writes the symbol index.`);
  }
  const mtime = statSync(SYMBOL_INDEX).mtimeMs;
  if (cached.mtime !== mtime) {
    const index = JSON.parse(readFileSync(SYMBOL_INDEX, "utf8"));
    const own = existsSync(CSHARP_SYMBOL_INDEX) ? JSON.parse(readFileSync(CSHARP_SYMBOL_INDEX, "utf8")) : {};
    cached = { mtime, index, csharp: { ...index, ...own } };
  }
  return page !== undefined && isCsharpPage(page) ? cached.csharp : cached.index;
}
