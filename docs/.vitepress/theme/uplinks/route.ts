/**
 * The addresses of a custom Uplink's pages. The site is static, so they live in
 * the hash of `/uplinks`: the hash carries the Uplink's own folder link, which
 * is what lets an address work in a browser that has not added the Uplink.
 *
 *   #/                         the list and the form
 *   #/u/<link>                 an Uplink's overview
 *   #/u/<link>/doc/<path>      one of its docs files
 */
export type Route =
  | { kind: "home" }
  | { kind: "overview"; base: string }
  | { kind: "doc"; base: string; path: string };

const PREFIX = "#/u/";

export function parseRoute(hash: string): Route {
  if (!hash.startsWith(PREFIX)) return { kind: "home" };
  const [link, kind, ...rest] = hash.slice(PREFIX.length).split("/");
  let base: string;
  try {
    base = decodeURIComponent(link);
  } catch {
    return { kind: "home" };
  }
  if (!base) return { kind: "home" };
  if (kind === "doc" && rest.length > 0) {
    try {
      return { kind: "doc", base, path: decodeURIComponent(rest.join("/")) };
    } catch {
      return { kind: "overview", base };
    }
  }
  return { kind: "overview", base };
}

/** The hash that opens `route`, the inverse of {@link parseRoute}. */
export function routeHash(route: Route): string {
  if (route.kind === "home") return "#/";
  const link = `${PREFIX}${encodeURIComponent(route.base)}`;
  return route.kind === "overview" ? link : `${link}/doc/${encodeURIComponent(route.path)}`;
}

export function sameRoute(a: Route, b: Route): boolean {
  return routeHash(a) === routeHash(b);
}
