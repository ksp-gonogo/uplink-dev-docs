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
 * describe, and it still exports all four of the names below, so an installed
 * copy cannot see any of this and `tsc` over `template/` passes on every one of
 * them. The truth is `packages/ui-kit/src/index.ts` in a gonogo checkout, read
 * through the TypeScript checker so `export *` chains are followed rather than
 * guessed. See `ui-kit-exports.json` for how that reaches CI.
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
export const STALE_PAGE_DEBT = {
  // `Value` left the kit when `<Unit>` became the only way to show a quantity.
  // The page still documents `ValueTone`, `ValueSize` and `ValueProps`, and ten
  // template files still import it, so six other pages' examples have to be
  // rewritten before this one can go.
  "docs/reference/ui-kit/Value.md": 1,
  // `formatNumber` left with every other bare string formatter for the same
  // reason: `<Unit>` renders a quantity, and a formatter one import away is how
  // eleven widgets each grew their own ladder.
  "docs/reference/ui-kit/formatNumber.md": 1,
  // `ScienceExperimentRow` was deleted outright. This is the page that started
  // all of this.
  "docs/reference/ui-kit/ScienceExperimentRow.md": 1,
};

/**
 * Claimed-but-absent symbols per file, counted per occurrence.
 *
 * Same ceiling rule. The three stale pages account for most of it; the rest is
 * the reach those pages have into files that are otherwise correct, which is
 * the part that would never have been found by opening the page.
 */
export const MISSING_SYMBOL_DEBT = {
  // The stale pages themselves.
  "docs/reference/ui-kit/Value.md": 3,
  "docs/reference/ui-kit/formatNumber.md": 2,
  "docs/reference/ui-kit/ScienceExperimentRow.md": 3,
  // `BadgeTone` never existed under that name; `Badge` takes `BadgeProps["tone"]`.
  "docs/reference/ui-kit/Badge.md": 1,
  // `GonogoTokens` was withdrawn on purpose: a second route to the tokens means
  // a hand-typed copy of the values that nothing checks, and the one that
  // existed fell 39 properties behind. `@ksp-gonogo/ui-kit/tokens.css` is the
  // only route now, and both of these pages still offer the component.
  "docs/reference/ui-kit/theme.md": 1,
  // `GonogoTokens` twice in Setup, then `Value`, `ValueTone` and `BadgeTone` in
  // the primitives list and the tone table.
  "docs/reference/ui-kit/index.md": 5,
  // Snippet sources, and therefore doc content: these are `<<<`-included into
  // the pages above. `tsc` compiles them green against the stale tarball.
  "template/client/src/ui/ScienceExperimentRow.tsx": 2,
  "template/client/src/ui/Value.tsx": 2,
  "template/client/src/ExampleWidget.tsx": 1,
  "template/client/src/ui/Box.tsx": 1,
  "template/client/src/ui/Card.tsx": 1,
  "template/client/src/ui/Grid.tsx": 1,
  "template/client/src/ui/ProgressBar.tsx": 1,
  "template/client/src/ui/Provider.tsx": 1,
  "template/client/src/ui/Section.tsx": 1,
  "template/client/src/ui/Stack.tsx": 1,
  "template/client/src/ui/Truncate.tsx": 1,
};

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
  templateSources: 10,
  claims: 100,
  internalLinks: 15,
};
