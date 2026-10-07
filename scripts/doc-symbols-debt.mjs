/**
 * The lists `check-doc-symbols.mjs` reads: what counts as a claim about the kit,
 * what is somebody else's symbol, and what is already known to be wrong.
 *
 * THE RULE. A reference page names symbols. Every one of those names is a
 * promise that an Uplink author can write `import { X } from "@ksp-gonogo/ui-kit"`
 * and get something. When the kit drops an export the page keeps the promise,
 * and nothing on the page changes colour: markdown compiles against nothing.
 * `ScienceExperimentRow` was deleted from the kit and its page, its index entry,
 * and a template file importing it all survived untouched.
 *
 * WHERE THE TRUTH COMES FROM. Not `node_modules`. The `@ksp-gonogo/ui-kit@0.1.0`
 * tarball this repo installs predates a large part of the kit these pages
 * describe, and it still exports every name the pages were caught claiming, so
 * an installed copy cannot see any of this and `tsc` over `example/` passes on
 * all of them. The truth is `packages/ui-kit/src/index.ts` in a gonogo checkout,
 * read through the TypeScript checker so `export *` chains are followed rather
 * than guessed. See `ui-kit-exports.json` for how that reaches CI.
 *
 * BOTH DEBT LISTS ARE EMPTY, and the pages are held to zero. They were seeded
 * on 2026-09-11 with 28 claims over 17 files and three pages with no subject
 * left, and cleared the same day: `Value` became `Text`, `formatNumber` and
 * `GonogoTokens` were withdrawn with no replacement to name, `BadgeTone` never
 * existed (a badge takes a `Severity`), and `ScienceExperimentRow` left the kit
 * for a package an Uplink cannot install. Keep them empty. This file stays
 * regardless: the other two exports below are configuration, not debt.
 */

/**
 * Identifiers a page may name that the kit is not expected to export, because
 * they belong to a package the author installs beside it. Kept deliberately
 * short: every name here is a hole in the check, so one goes in only when a
 * real page names it and the name really is someone else's.
 */
export const EXTERNAL_IDENTIFIERS = [
  // JavaScript itself.
  "NaN",
  "Infinity",
  "Object",
  "Array",
  "Promise",
  "Error",
  "Map",
  "Set",
  "Symbol",
  "JSON",
  "Math",
  "Date",
  // styled-components, which the kit declares a peer dependency on and which
  // every themed page has to name to explain where the theme comes from.
  "ThemeProvider",
  "DefaultTheme",
  "StyledComponent",
  "GlobalStyleComponent",
  // React, and the DOM types a props interface extends.
  "React",
  "ReactNode",
  "ReactElement",
  "FC",
  "HTMLAttributes",
  "HTMLElement",
  "CSSProperties",
  "ComponentProps",
  "ComponentType",
  "PropsWithChildren",
  "RefObject",
];

/**
 * Reference pages whose subject the kit no longer exports, with what happened.
 *
 * A CEILING, not a record: the check fails the moment a page joins this set,
 * and tells you to lower the count when one leaves it. Do not add a page to
 * make a failure go away, the failure IS the finding.
 */
export const STALE_PAGE_DEBT = {};

/**
 * Claimed-but-absent symbols per file, counted per occurrence.
 *
 * Same ceiling rule. Note what this catches that reading a page does not: most
 * of the seeded entries were the reach a stale page had into files that were
 * otherwise correct, `Value` in six other primitives' snippet sources among
 * them.
 */
export const MISSING_SYMBOL_DEBT = {};

/**
 * Floors on what the scan walked, asserted before any finding is reported.
 *
 * A scan that walks zero files satisfies every rule above: a wrong path, a
 * renamed directory, or a fence regex that stopped matching each look exactly
 * like a clean repo. Set well under the current census so ordinary growth never
 * trips them and a blind scan always does.
 */
export const FLOORS = {
  kitExports: 300,
  markdownPages: 20,
  referencePages: 15,
  exampleSources: 10,
  /*
   * Claims come from the guide pages and the example. Reference pages are
   * generated and TypeDoc resolves every name on them, so they carry none. The
   * floor only has to sit well under the census; the planted dead and live
   * pages are what prove the scan is not blind.
   */
  claims: 40,
  internalLinks: 15,
};
