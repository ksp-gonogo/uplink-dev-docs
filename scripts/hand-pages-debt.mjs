/**
 * The hand-written pages under `docs/reference/`, each waiting for the
 * generated page that replaces it. Read by `check-reference-pages.mjs`.
 *
 * Shrink-only and exact: a hand page missing from this list fails, and so does
 * an entry whose file is gone or is now generated, until the entry is deleted.
 * A new reference page is a module under `reference/pages/`, never a line here.
 */
export const HAND_PAGES = [
  "docs/reference/client/index.md",
  "docs/reference/client/topics.md",
  "docs/reference/index.md",
  "docs/reference/ui-kit/Button.md",
  "docs/reference/ui-kit/index.md",
];
