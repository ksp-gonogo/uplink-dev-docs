/**
 * The addresses of a custom Uplink's pages. The site is static, so they live in
 * the hash of `/uplinks`: the hash carries the Uplink's own folder link, which
 * is what lets an address work in a browser that has not added the Uplink.
 *
 *   #/                         the list and the form
 *   #/u/<link>                 an Uplink's overview
 */
export type Route = { kind: "home" } | { kind: "overview"; base: string };

const PREFIX = "#/u/";

export function parseRoute(hash: string): Route {
  if (!hash.startsWith(PREFIX)) return { kind: "home" };
  const [link] = hash.slice(PREFIX.length).split("/");
  let base: string;
  try {
    base = decodeURIComponent(link);
  } catch {
    return { kind: "home" };
  }
  if (!base) return { kind: "home" };
  return { kind: "overview", base };
}

/** The hash that opens `route`, the inverse of {@link parseRoute}. */
export function routeHash(route: Route): string {
  if (route.kind === "home") return "#/";
  return `${PREFIX}${encodeURIComponent(route.base)}`;
}

export function sameRoute(a: Route, b: Route): boolean {
  return routeHash(a) === routeHash(b);
}
