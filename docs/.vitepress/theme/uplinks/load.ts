import { manifestCandidates, specCandidates } from "./link.ts";
import { readSpec, type Spec } from "./spec.ts";

export interface LoadedUplink {
  spec: Spec;
  /** Where the spec sheet was found. */
  specUrl: string;
  /** Where the manifest was found, when there is one. */
  manifestUrl: string | null;
  /** The Uplink's manifest, when one sits beside it: the contract it was built against. */
  manifest: { contractMajor?: number; contractMinor?: number; apiVersion?: string; version?: string } | null;
  /** The pictures the folder commits, by file name, when it has a shape record. */
  pictures: { url: string; name: string }[];
}

type Fetcher = (url: string) => Promise<Response>;

async function firstJson(urls: readonly string[], fetcher: Fetcher): Promise<{ url: string; value: unknown } | undefined> {
  for (const url of urls) {
    try {
      const response = await fetcher(url);
      if (response.ok) return { url, value: await response.json() };
    } catch {
      // Not there, or not JSON: the next place it can be.
    }
  }
  return undefined;
}

function number(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/**
 * Fetches an Uplink's spec sheet, manifest and picture list from its folder.
 * Throws a sentence a reader can act on when there is no readable spec sheet.
 */
export async function loadUplink(base: string, fetcher: Fetcher = (url) => fetch(url)): Promise<LoadedUplink> {
  const found = await firstJson(specCandidates(base), fetcher);
  if (!found) {
    throw new Error(
      "No docs/spec.json was found in that folder. The Uplink writes it with `uplink-tools page`; a release carries it as spec.json beside the bundle.",
    );
  }
  const spec = readSpec(found.value);
  const manifestFound = await firstJson(manifestCandidates(base), fetcher);
  const raw = manifestFound?.value;
  const manifest =
    typeof raw === "object" && raw !== null
      ? {
          contractMajor: number((raw as Record<string, unknown>).contractMajor),
          contractMinor: number((raw as Record<string, unknown>).contractMinor),
          apiVersion: text((raw as Record<string, unknown>).apiVersion),
          version: text((raw as Record<string, unknown>).version),
        }
      : null;

  // The pictures sit beside the spec sheet's own folder, listed by the shape record the renderer commits.
  const docsFolder = found.url.slice(0, found.url.lastIndexOf("/"));
  const shapes = await firstJson([`${docsFolder}/assets/render-shape.json`], fetcher);
  const assets =
    typeof shapes?.value === "object" && shapes.value !== null
      ? (shapes.value as { assets?: Record<string, unknown> }).assets
      : undefined;
  const pictures = Object.keys(assets ?? {})
    .filter((name) => /^[\w.-]+\.(png|gif)$/.test(name))
    .sort()
    .map((name) => ({ name, url: `${docsFolder}/assets/${name}` }));
  return { spec, specUrl: found.url, manifestUrl: manifestFound?.url ?? null, manifest, pictures };
}
