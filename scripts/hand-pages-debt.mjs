/**
 * The hand-written pages under `docs/reference/`, each waiting for the
 * generated page that replaces it. Read by `check-reference-pages.mjs`.
 *
 * Shrink-only and exact: a hand page missing from this list fails, and so does
 * an entry whose file is gone or is now generated, until the entry is deleted.
 * A new reference page is a module under `reference/pages/`, never a line here.
 */
export const HAND_PAGES = [
  "docs/reference/client/binary-frames.md",
  "docs/reference/client/index.md",
  "docs/reference/client/messages.md",
  "docs/reference/client/topics.md",
  "docs/reference/index.md",
  "docs/reference/mod/channels.md",
  "docs/reference/mod/commands.md",
  "docs/reference/ui-kit/Badge.md",
  "docs/reference/ui-kit/Box.md",
  "docs/reference/ui-kit/Button.md",
  "docs/reference/ui-kit/Card.md",
  "docs/reference/ui-kit/Cluster.md",
  "docs/reference/ui-kit/EmptyState.md",
  "docs/reference/ui-kit/Grid.md",
  "docs/reference/ui-kit/index.md",
  "docs/reference/ui-kit/Inline.md",
  "docs/reference/ui-kit/Panel.md",
  "docs/reference/ui-kit/Readout.md",
  "docs/reference/ui-kit/Row.md",
  "docs/reference/ui-kit/Section.md",
  "docs/reference/ui-kit/Spinner.md",
  "docs/reference/ui-kit/Stack.md",
  "docs/reference/ui-kit/StatusIndicator.md",
  "docs/reference/ui-kit/Text.md",
  "docs/reference/ui-kit/theme.md",
  "docs/reference/ui-kit/Truncate.md",
  "docs/reference/ui-kit/Unit.md",
];
