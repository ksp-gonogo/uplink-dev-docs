/**
 * Builds the modules an Uplink's client bundle leaves unresolved, for the
 * viewer to serve to a bundle it loads: React, styled-components, the sdk and
 * the kit, from the installed artifacts. One esbuild run with splitting writes
 * them all, so the sdk's registries and React's dispatcher exist once, and a
 * widget a loaded bundle registers lands where the viewer's host reads it.
 *
 * The viewer's own host module is built in the same run for the same reason.
 * Output goes to `docs/public/uplink-externals/`, with `map.json` naming the
 * file each specifier resolves to.
 */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";
import { INSTALL, ROOT } from "./reference/paths.mjs";

const OUT = resolve(ROOT, "docs/public/uplink-externals");
const own = createRequire(resolve(ROOT, "package.json"));

const { UPLINK_EXTERNAL_ENTRIES, UPLINK_EXTERNAL_NO_CHUNK } = await import(
  pathToFileURL(resolve(INSTALL, "node_modules/@ksp-gonogo/sitrep-sdk/dist/uplink-externals.js")).href
);

/** The app-side packages an Uplink may not import, which the app resolves for its own code. */
const APP_ONLY = new Set([
  "@ksp-gonogo/core",
  "@ksp-gonogo/components",
  "@ksp-gonogo/data",
  "@ksp-gonogo/ui",
  "@ksp-gonogo/sitrep-client",
  "@ksp-gonogo/logger",
]);

/** React and the styled-components stylesheet come from this site, one copy however deep the importer. */
const SHARED = ["react", "react-dom", "styled-components"];

const CJS = new Set(["react", "react-dom", "react/jsx-runtime", "react-dom/client", "react/jsx-dev-runtime"]);

const fileName = (specifier) => `ext-${specifier.replace(/^@ksp-gonogo\//, "").replace(/[/@]/g, "-")}`;

/** An entry's source: a CJS package names its exports explicitly, since `export *` cannot see them. */
function entrySource(specifier) {
  if (!CJS.has(specifier)) return `export * from ${JSON.stringify(specifier)};`;
  const names = Object.keys(own(specifier)).filter((name) => /^[A-Za-z_$][\w$]*$/.test(name) && name !== "default");
  return [
    `import d from ${JSON.stringify(specifier)};`,
    "export default d;",
    `export const { ${names.join(", ")} } = d;`,
  ].join("\n");
}

const specifiers = [
  ...UPLINK_EXTERNAL_ENTRIES.map(([specifier]) => specifier).filter((s) => !APP_ONLY.has(s)),
  ...UPLINK_EXTERNAL_NO_CHUNK,
  "@ksp-gonogo/sitrep-sdk/testing",
];
const sources = new Map(specifiers.map((s) => [`${fileName(s)}.js`, entrySource(s)]));

const entryPoints = {
  ...Object.fromEntries(specifiers.map((s) => [fileName(s), `virtual:${fileName(s)}.js`])),
  "viewer-host": resolve(ROOT, "docs/.vitepress/theme/uplinks/host.tsx"),
};

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

await build({
  entryPoints,
  outdir: OUT,
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  jsx: "automatic",
  logLevel: "warning",
  define: { "process.env.NODE_ENV": '"production"' },
  nodePaths: [resolve(INSTALL, "node_modules"), resolve(ROOT, "node_modules")],
  loader: { ".css": "text" },
  plugins: [
    {
      name: "uplink-externals",
      setup(b) {
        b.onResolve({ filter: /^virtual:/ }, (args) => ({ path: args.path.slice("virtual:".length), namespace: "ext" }));
        b.onLoad({ filter: /.*/, namespace: "ext" }, (args) => ({
          contents: sources.get(args.path),
          resolveDir: resolve(INSTALL, "node_modules"),
          loader: "js",
        }));
        // One React and one styled-components, this site's, for every importer.
        b.onResolve({ filter: /^(react|react-dom|styled-components)(\/.*)?$/ }, (args) => {
          if (args.pluginData === "shared") return undefined;
          return b.resolve(args.path, { kind: args.kind, resolveDir: ROOT, pluginData: "shared" });
        });
      },
    },
  ],
});

const emitted = new Set(readdirSync(OUT));
const map = {};
for (const specifier of specifiers) map[specifier] = `${fileName(specifier)}.js`;
for (const file of Object.values(map)) if (!emitted.has(file)) throw new Error(`${file} was not written`);
writeFileSync(resolve(OUT, "map.json"), `${JSON.stringify({ imports: map }, null, 2)}\n`);
console.log(`Wrote ${specifiers.length} Uplink externals and the viewer host to ${OUT}`);
