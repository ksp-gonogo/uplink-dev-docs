import { markRaw, reactive } from "vue";
import { type LoadedClient, loadClient } from "./client";
import type { UplinkLink } from "./link";
import { type LoadedUplink, loadUplink } from "./load";
import { parseRoute, type Route } from "./route";
import { readSaved, type SavedUplink, withoutSaved, writeSaved } from "./store";

export interface Entry {
  saved: SavedUplink;
  state: "idle" | "loading" | "ready" | "failed";
  loaded?: LoadedUplink;
  error?: string;
  /** The Uplink's released client, once its bundle has been fetched, checked and run. */
  client?: LoadedClient;
  clientState: "none" | "loading" | "ready" | "failed";
  clientError?: string;
}

/**
 * What the sidebar and the page share: the Uplinks added in this browser, how
 * far each has been read, and the address being viewed. Filled in the browser
 * only, after the page has hydrated.
 */
export const state = reactive({
  started: false,
  entries: [] as Entry[],
  route: { kind: "home" } as Route,
});

let listening = false;

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function persist(): void {
  writeSaved(state.entries.map((entry) => entry.saved));
}

function readRoute(): void {
  state.route = parseRoute(location.hash);
}

/** Reads the saved list and starts following the address. Safe to call from every component that needs it. */
export function start(): void {
  if (!listening) {
    listening = true;
    window.addEventListener("hashchange", readRoute);
    window.addEventListener("popstate", readRoute);
  }
  readRoute();
  if (state.started) return;
  state.started = true;
  state.entries = readSaved().map((saved) => ({ saved, state: "idle", clientState: "none" }));
}

export function find(base: string): Entry | undefined {
  return state.entries.find((entry) => entry.saved.base === base);
}

/** Reads the Uplink's folder once; a failed one is read again by {@link reload}. */
export async function ensureLoaded(entry: Entry): Promise<void> {
  if (entry.state !== "idle") return;
  await reload(entry);
}

/** Reads the Uplink's folder again, from the top: its spec sheet, its docs files and, when it is a release, its client. */
export async function reload(entry: Entry): Promise<void> {
  entry.state = "loading";
  entry.error = undefined;
  entry.client = undefined;
  entry.clientError = undefined;
  entry.clientState = "none";
  try {
    entry.loaded = await loadUplink(entry.saved.base);
  } catch (error) {
    entry.error = message(error);
    entry.state = "failed";
    return;
  }
  entry.state = "ready";
  entry.saved = {
    ...entry.saved,
    name: entry.loaded.spec.uplink.name,
    docs: entry.loaded.docs.map(({ path, title }) => ({ path, title })),
  };
  persist();
  await loadClientOf(entry);
}

/** Runs the Uplink's released client the way the app does, when the folder carries a manifest. */
async function loadClientOf(entry: Entry): Promise<void> {
  const manifestUrl = entry.loaded?.manifestUrl;
  if (!manifestUrl) return;
  entry.clientState = "loading";
  try {
    entry.client = markRaw(await loadClient(manifestUrl));
    entry.clientState = "ready";
  } catch (error) {
    entry.clientError = message(error);
    entry.clientState = "failed";
  }
}

/** Adds an Uplink to the list. Adding one already listed returns it. */
export function add(link: UplinkLink): Entry {
  const existing = find(link.base);
  if (existing) return existing;
  const entry: Entry = { saved: link, state: "idle", clientState: "none" };
  state.entries.push(entry);
  persist();
  return state.entries[state.entries.length - 1];
}

export function remove(base: string): void {
  const remaining = withoutSaved(
    state.entries.map((entry) => entry.saved),
    base,
  );
  state.entries = state.entries.filter((entry) => remaining.some((saved) => saved.base === entry.saved.base));
  persist();
}
