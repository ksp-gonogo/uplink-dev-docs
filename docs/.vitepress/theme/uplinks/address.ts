import { withBase } from "vitepress";
import { type Route, routeHash } from "./route";

/** The page the custom Uplinks live on. */
export const PAGE = "/uplinks";

/** The address that opens `route`, including the site's base path. */
export function hrefOf(route: Route): string {
  return `${withBase(PAGE)}${routeHash(route)}`;
}
