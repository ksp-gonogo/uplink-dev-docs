/**
 * Documented symbols whose name a code span far more often means something
 * else: a member, a parameter or a prop of the same name. A code span naming
 * one is never linked by the symbol pass and the link check does not ask for
 * one; a doc comment links it with `{@link}`, a guide with a Markdown link.
 *
 * Each entry says what else the name means. `npm run reference` fails on an
 * entry that is no longer ambiguous, so the list only ever holds names that
 * still collide.
 */
export const AMBIGUOUS_SYMBOLS = {
  value: "the value() constructor, and the field or parameter named value on dozens of types and props",
  Section: "ui-kit's Section component, and the Section prop the Objectives widget's slot passes",
};
