/** The pasted links, kept in this browser. Every access is guarded: storage can be absent or full. */
const KEY = "uplink-dev-docs.uplinks";

export interface SavedUplink {
  base: string;
  label: string;
  /** The Uplink's name as last read, so the sidebar lists it before the folder is fetched again. */
  name?: string;
}

export function readSaved(storage: Pick<Storage, "getItem"> | undefined = safeStorage()): SavedUplink[] {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry): SavedUplink[] => {
      if (typeof entry !== "object" || entry === null || typeof entry.base !== "string" || typeof entry.label !== "string") return [];
      return [{ base: entry.base, label: entry.label, name: typeof entry.name === "string" ? entry.name : undefined }];
    });
  } catch {
    return [];
  }
}

export function writeSaved(list: readonly SavedUplink[], storage: Pick<Storage, "setItem"> | undefined = safeStorage()): void {
  try {
    storage?.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage full or blocked: the list lasts until the page closes.
  }
}

/** The list with `entry` added, once. */
export function withSaved(list: readonly SavedUplink[], entry: SavedUplink): SavedUplink[] {
  return list.some((saved) => saved.base === entry.base) ? [...list] : [...list, entry];
}

export function withoutSaved(list: readonly SavedUplink[], base: string): SavedUplink[] {
  return list.filter((saved) => saved.base !== base);
}

function safeStorage(): Storage | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}
