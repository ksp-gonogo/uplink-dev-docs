/**
 * Symbols a doc comment names with `{@link}` that have no reference entry,
 * because nothing gives them a `@category`. Until one does, the link renders
 * as plain code. Read by `npm run reference`.
 *
 * Exact in both directions: a new unresolved link fails, and so does an entry
 * here that now resolves, until the entry is deleted.
 */
export const UNRESOLVED_LINK_DEBT = [
  // @category Reckoners, which has no page yet; Reading's comments link to these
  "ModelledField",
  "ReckonerFor",
  "ReckonerWindow",
  "TopicReckoningAvailable",
];
