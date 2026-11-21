/**
 * The path the built site is served under. The root channel is the site's
 * address itself and the release-candidate channel sits beneath it, so one
 * build per channel sets `DOCS_BASE`; nothing else in the repository spells
 * the path.
 */
export const DEFAULT_BASE = "/uplink-dev-docs/";

/** `DOCS_BASE` with exactly one leading and one trailing slash. */
export function docsBase(env = process.env) {
  const raw = (env.DOCS_BASE || DEFAULT_BASE).replace(/^\/+|\/+$/g, "");
  return raw === "" ? "/" : `/${raw}/`;
}
