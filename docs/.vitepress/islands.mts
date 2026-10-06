import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin, UserConfig } from "vite";
import { storybookRoot } from "../../scripts/reference/paths.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const INSTALL = resolve(ROOT, ".reference");

/** The packages a live example takes from the installed artifacts, never from source. */
const ARTIFACT_PACKAGES = ["@ksp-gonogo/ui-kit", "@ksp-gonogo/sitrep-sdk"];

/** The app's global stylesheet, which the island adopts into its shadow root. */
export const APP_STYLES = "@gonogo-app/global.css";

/** One copy of each, the site's own, however deep the importer. */
const SHARED = ["react", "react-dom", "styled-components"];

/** Every other workspace package of the Storybook checkout, by name, to its source entry. */
function workspaceSources(storybook: string): Map<string, string> {
  const repo = resolve(storybook, "../..");
  const dirs = [
    ...readdirSync(resolve(repo, "packages")).map((d) => resolve(repo, "packages", d)),
    ...readdirSync(resolve(repo, "mod")).map((d) => resolve(repo, "mod", d, "client")),
  ];
  const sources = new Map<string, string>();
  for (const dir of dirs) {
    const manifest = resolve(dir, "package.json");
    if (!existsSync(manifest) || !existsSync(resolve(dir, "src/index.ts"))) continue;
    const { name, exports } = JSON.parse(readFileSync(manifest, "utf8"));
    if (ARTIFACT_PACKAGES.includes(name)) continue;
    for (const [key, target] of Object.entries(exports ?? {})) {
      if (key !== "." && typeof target === "string") {
        sources.set(`${name}/${key.replace(/^\.\//, "")}`, resolve(dir, target));
      }
    }
    sources.set(name, resolve(dir, "src/index.ts"));
  }
  return sources;
}

/**
 * Resolves an example's imports the way the page means them: the published
 * packages from the installed artifacts, the app-side packages a widget example
 * needs from the checkout's source, and React and styled-components from this
 * site through `dedupe`, so the island shares one of each with nothing else.
 *
 * The app's global stylesheet, which the harness's setup imports, is loaded as a
 * string rather than injected into the page: it styles `html` and `body`, so
 * the island adopts it inside its own shadow root instead (see `mount.tsx`).
 */
function storyResolution(storybook: string): Plugin {
  const sources = workspaceSources(storybook);
  const repo = resolve(storybook, "../..");
  const fromArtifacts = resolve(INSTALL, "package.json");
  const fromStorybook = resolve(storybook, "package.json");
  const packageOf = (id: string) => id.split("/").slice(0, id.startsWith("@") ? 2 : 1).join("/");
  return {
    name: "gonogo-story-resolution",
    enforce: "pre",
    async resolveId(source, importer) {
      if (source.startsWith("@gonogo-storybook/")) {
        return this.resolve(resolve(storybook, source.slice("@gonogo-storybook/".length)), importer, { skipSelf: true });
      }
      if (source === APP_STYLES) return `${resolve(repo, "packages/app/src/styles/global.css")}?inline`;
      if (source.endsWith("/app/src/styles/global.css")) {
        return `${resolve(dirname(importer ?? storybook), source)}?inline`;
      }
      const pkg = packageOf(source);
      if (ARTIFACT_PACKAGES.includes(pkg)) {
        return this.resolve(source, fromArtifacts, { skipSelf: true });
      }
      if (sources.has(source)) return sources.get(source);
      // The sdk's `/testing` fixtures, which the harness installs, bring their optional peers from the checkout.
      if (pkg.startsWith("@storybook/") || pkg === "storybook" || pkg.startsWith("@testing-library/")) {
        return this.resolve(source, fromStorybook, { skipSelf: true });
      }
      return null;
    },
  };
}

/** The Vite settings the live examples need, or none when there is no Storybook checkout. */
export function islandVite(): UserConfig {
  const storybook = storybookRoot();
  if (storybook === null) return {};
  const repo = resolve(storybook, "../..");
  return {
    plugins: [storyResolution(storybook)],
    resolve: { dedupe: SHARED },
    server: { fs: { allow: [ROOT, repo] } },
    define: { "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production") },
    optimizeDeps: {
      include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "styled-components"],
      exclude: ARTIFACT_PACKAGES,
    },
    ssr: { noExternal: [/@ksp-gonogo/] },
  };
}
