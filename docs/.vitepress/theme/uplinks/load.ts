import { manifestCandidates, specCandidates } from "./link.ts";
import { readSpec, type Spec } from "./spec.ts";

/** A Markdown file the folder carries, read whole, with the URL its relative links and images resolve against. */
export interface LoadedDoc {
  url: string;
  text: string;
}

export interface LoadedUplink {
  spec: Spec;
  /** Where the spec sheet was found. */
  specUrl: string;
  /** Where the manifest was found, when there is one. */
  manifestUrl: string | null;
  /** The Uplink's manifest, when one sits beside it: the contract it was built against. */
  manifest: { contractMajor?: number; contractMinor?: number; apiVersion?: string; version?: string } | null;
  /** The Uplink's client folder: the source folder itself, or a released version's folder. */
  root: string;
  /**
   * Where the Uplink's published client manifest should be: beside the bundle
   * `client.url` in `uplink.json` names for a source folder, beside the spec
   * sheet for a release. Null when a source folder does not say.
   */
  clientManifestUrl: string | null;
  /** Where the Uplink installs and what it needs, from the `uplink.json` a source folder carries. */
  install: { gamedata?: string; repo?: string; ckan?: string } | null;
  /** The Uplink's own description of itself (`uplink.md`), when the source folder carries one. */
  intro: LoadedDoc | null;
  /** A README somebody wrote by hand. The one `uplink-tools` generates repeats the spec sheet, so it is not kept. */
  readme: LoadedDoc | null;
  /** The pictures the folder commits, by file name, each with the caption its README gives it. */
  pictures: { url: string; name: string; caption: string }[];
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

async function firstText(url: string, fetcher: Fetcher): Promise<string | undefined> {
  try {
    const response = await fetcher(url);
    return response.ok ? await response.text() : undefined;
  } catch {
    return undefined;
  }
}

const SPEC_IN_SOURCE = "/docs/spec.json";

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
  const isSource = found.url.endsWith(SPEC_IN_SOURCE);
  const root = isSource ? found.url.slice(0, -SPEC_IN_SOURCE.length) : docsFolder;

  const readmeText = await firstText(`${root}/README.md`, fetcher);
  const captions = readmeText === undefined ? new Map<string, string>() : pictureCaptions(readmeText);
  const pictures = Object.keys(assets ?? {})
    .filter((name) => /^[\w.-]+\.(png|gif)$/.test(name))
    .sort()
    .map((name) => ({ name, url: `${docsFolder}/assets/${name}`, caption: captions.get(name) ?? name }));

  const introText = isSource ? await firstText(`${root}/uplink.md`, fetcher) : undefined;
  const readme =
    readmeText === undefined || GENERATED.test(readmeText) ? null : { url: `${root}/README.md`, text: readmeText };
  const intro = introText === undefined ? null : { url: `${root}/uplink.md`, text: introText };

  let clientManifestUrl: string | null = manifestFound && !isSource ? manifestFound.url : null;
  let install: LoadedUplink["install"] = null;
  if (isSource) {
    const declared = await firstJson([`${base}/uplink.json`, `${root}/../uplink.json`], fetcher);
    const url = clientUrlOf(declared?.value);
    if (url) clientManifestUrl = `${url.slice(0, url.lastIndexOf("/"))}/gonogo-uplink.json`;
    install = installOf(declared?.value);
  }
  return { spec, install, specUrl: found.url, root, clientManifestUrl, intro, readme, manifestUrl: manifestFound?.url ?? null, manifest, pictures };
}

/** The line `uplink-tools` writes at the top of every page it generates. */
const GENERATED = /Generated by `uplink-tools/;

/** The `client.url` an Uplink's `uplink.json` declares, when it is an https address or one on this machine. */
function clientUrlOf(value: unknown): string | undefined {
  const client = typeof value === "object" && value !== null ? (value as { client?: unknown }).client : undefined;
  const url = typeof client === "object" && client !== null ? (client as { url?: unknown }).url : undefined;
  const readable = typeof url === "string" && (url.startsWith("https://") || /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url));
  return readable ? (url as string) : undefined;
}

function installOf(value: unknown): LoadedUplink["install"] {
  if (typeof value !== "object" || value === null) return null;
  const declared = value as { gamedata?: unknown; repo?: unknown; mod?: unknown };
  const mod = typeof declared.mod === "object" && declared.mod !== null ? (declared.mod as { ckan?: unknown }) : {};
  const gamedata = text(declared.gamedata);
  const repo = text(declared.repo);
  return { gamedata, repo: repo?.startsWith("https://") ? repo : undefined, ckan: text(mod.ckan) };
}

/** The alt text of each image a README embeds, by the file name it points at. */
function pictureCaptions(readme: string): Map<string, string> {
  const captions = new Map<string, string>();
  for (const match of readme.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)) {
    const name = match[2].split("/").pop() as string;
    if (match[1]) captions.set(name, match[1]);
  }
  return captions;
}
