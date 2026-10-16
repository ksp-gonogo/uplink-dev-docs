import { type AppCompatIdentity, checkUplinkCompat, parseUplinkManifest, sha256Integrity } from "@ksp-gonogo/sitrep-sdk/uplink-load";

/** The viewer's host module, as `scripts/build-uplink-externals.mjs` builds it. */
export interface ViewerHost {
  installViewerHost(): void;
  registeredWidgets(): { id: string; name: string; defaultSize?: { w: number; h: number } }[];
  mountWidget(container: HTMLElement, def: unknown, size: { w: number; h: number }): () => void;
}

export interface LoadedClient {
  host: ViewerHost;
  /** The widgets the bundle registered, by id. */
  widgets: Map<string, ReturnType<ViewerHost["registeredWidgets"]>[number]>;
}

const EXTERNALS = "uplink-externals";
let hostPromise: Promise<{ host: ViewerHost; identity: AppCompatIdentity }> | undefined;

function externalsBase(): string {
  const base = (import.meta.env?.BASE_URL as string | undefined) ?? "/";
  return new URL(`${base}${EXTERNALS}/`, location.origin).href;
}

/**
 * Writes the import map a client bundle's bare imports resolve through, once,
 * and loads the host built beside the modules it names. The numbers a manifest
 * is gated on come from the sdk the host was built from.
 */
function startHost(): Promise<{ host: ViewerHost; identity: AppCompatIdentity }> {
  hostPromise ??= (async () => {
    const base = externalsBase();
    const map = (await (await fetch(`${base}map.json`)).json()) as { imports: Record<string, string> };
    const imports = Object.fromEntries(Object.entries(map.imports).map(([specifier, file]) => [specifier, `${base}${file}`]));
    const script = document.createElement("script");
    script.type = "importmap";
    script.textContent = JSON.stringify({ imports });
    document.head.append(script);
    const host = (await import(/* @vite-ignore */ `${base}viewer-host.js`)) as ViewerHost;
    const sdk = (await import(/* @vite-ignore */ imports["@ksp-gonogo/sitrep-sdk"])) as {
      EXTENSION_API_VERSION: string;
      CONTRACT_MAJOR: number;
      CONTRACT_MINOR: number;
    };
    host.installViewerHost();
    return {
      host,
      identity: {
        apiVersion: sdk.EXTENSION_API_VERSION,
        contractMajor: sdk.CONTRACT_MAJOR,
        contractMinor: sdk.CONTRACT_MINOR,
        appVersion: "0.0.0",
      },
    };
  })();
  return hostPromise;
}

/**
 * Loads an Uplink's released client as the app does: reads its manifest, gates
 * it on the extension API and contract this site is built against, fetches the
 * bundle, checks the bytes against the manifest's hash, and imports it so its
 * widgets register. Throws a sentence saying which step refused.
 */
export async function loadClient(manifestUrl: string, fetcher: typeof fetch = fetch): Promise<LoadedClient> {
  const response = await fetcher(manifestUrl);
  if (response.status === 404) {
    throw new Error(
      `No client is published at ${manifestUrl} (404). The Uplink's \`client.url\` in uplink.json has to name a bundle that has been released with \`uplink-tools release --push\`.`,
    );
  }
  if (!response.ok) throw new Error(`The manifest ${manifestUrl} could not be read (${response.status}).`);
  const manifest = parseUplinkManifest(await response.json());
  const { host, identity } = await startHost();

  const verdict = checkUplinkCompat(manifest, identity);
  if (verdict.verdict === "refuse") throw new Error(`This site cannot run that client. ${verdict.reason}`);

  // The manifest sits beside the bundle it describes, whatever folder its `bundleUrl` names.
  const file = (manifest.bundleUrl ?? `${manifest.id}.client.js`).split("/").pop();
  const bundleUrl = new URL(file as string, manifestUrl).href;
  const bundle = await fetcher(bundleUrl);
  if (!bundle.ok) throw new Error(`The client bundle ${bundleUrl} could not be read (${bundle.status}).`);
  const bytes = await bundle.arrayBuffer();
  const actual = await sha256Integrity(bytes);
  if (manifest.integrity && manifest.integrity !== actual) {
    throw new Error(`The bundle's hash is ${actual}, but its manifest says ${manifest.integrity}, so it was not run.`);
  }

  const before = new Set(host.registeredWidgets().map((def) => def.id));
  const url = URL.createObjectURL(new Blob([bytes], { type: "text/javascript" }));
  try {
    await import(/* @vite-ignore */ url);
  } finally {
    URL.revokeObjectURL(url);
  }
  const widgets = new Map(host.registeredWidgets().filter((def) => !before.has(def.id)).map((def) => [def.id, def]));
  return { host, widgets };
}
