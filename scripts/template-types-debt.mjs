/**
 * Template sources that compile against gonogo's source but not against the
 * packages on npm, each with its exact error count against the installed
 * tarballs. Read by `check-template-types.mjs`.
 *
 * Exact in both directions: a count that grows is a new gap, and one that falls
 * or reaches zero is the ledger overstating the gap, so both fail until the
 * entry is corrected. An entry for a file that does not exist fails as BLIND.
 */
export const NEEDS_REPUBLISH = {};
