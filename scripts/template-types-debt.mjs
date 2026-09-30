/**
 * Template sources that compile against gonogo's source but not against the
 * packages on npm, each with its exact error count against the installed
 * tarballs. Read by `check-template-types.mjs`.
 *
 * Exact in both directions: a count that grows is a new gap, and one that falls
 * or reaches zero is the ledger overstating the gap, so both fail until the
 * entry is corrected. An entry for a file that does not exist fails as BLIND.
 */
export const NEEDS_REPUBLISH = {
  "template/client/src/ExampleWidget.tsx": 4,
  "template/client/src/sdkSurface.ts": 10,
  "template/client/src/stream.ts": 1,
  "template/client/src/ui/Badge.tsx": 2,
  "template/client/src/ui/Box.tsx": 3,
  "template/client/src/ui/Button.tsx": 2,
  "template/client/src/ui/Card.tsx": 2,
  "template/client/src/ui/Cluster.tsx": 1,
  "template/client/src/ui/EmptyState.tsx": 1,
  "template/client/src/ui/Grid.tsx": 2,
  "template/client/src/ui/Inline.tsx": 4,
  "template/client/src/ui/Panel.tsx": 3,
  "template/client/src/ui/ProgressBar.tsx": 4,
  "template/client/src/ui/Provider.tsx": 1,
  "template/client/src/ui/Section.tsx": 1,
  "template/client/src/ui/Spinner.tsx": 1,
  "template/client/src/ui/Stack.tsx": 2,
  "template/client/src/ui/Text.tsx": 1,
  "template/client/src/ui/Truncate.tsx": 2,
  "template/client/src/ui/Unit.tsx": 3,
};
