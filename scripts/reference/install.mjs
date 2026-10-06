/**
 * Installs the artifacts `reference/artifacts.json` names into `.reference/`,
 * the way an Uplink author installs them: npm packages through npm, the
 * contract through its NuGet package.
 *
 * A spec is either `file:<path>`, relative to `reference/`, or a version, which
 * is fetched from the public registry. Moving from packed artifacts to a
 * release candidate is a change to that file and nothing else.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { INSTALL, ROOT } from "./paths.mjs";

const MANIFEST = resolve(ROOT, "reference/artifacts.json");

/** Where the contract's XML docs and assembly land. The net472 group is what a KSP plugin compiles against. */
export const CONTRACT_DIR = resolve(INSTALL, "contract");
export const CONTRACT_DLL = resolve(CONTRACT_DIR, "lib/net472/Sitrep.Contract.dll");

function localPath(spec) {
  const path = resolve(ROOT, "reference", spec.slice("file:".length));
  if (!existsSync(path)) {
    throw new Error(
      `${path} does not exist. Pack the artifacts first: node scripts/reference/pack-artifacts.mjs`,
    );
  }
  return path;
}

async function nupkgFor(id, spec) {
  if (spec.startsWith("file:")) return localPath(spec);
  const lower = id.toLowerCase();
  const url = `https://api.nuget.org/v3-flatcontainer/${lower}/${spec}/${lower}.${spec}.nupkg`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const path = resolve(INSTALL, `${id}.${spec}.nupkg`);
  writeFileSync(path, Buffer.from(await response.arrayBuffer()));
  return path;
}

export async function installArtifacts() {
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  rmSync(INSTALL, { recursive: true, force: true });
  mkdirSync(INSTALL, { recursive: true });

  const dependencies = Object.fromEntries(
    Object.entries(manifest.npm).map(([name, spec]) => [
      name,
      spec.startsWith("file:") ? `file:${localPath(spec)}` : spec,
    ]),
  );
  writeFileSync(
    resolve(INSTALL, "package.json"),
    `${JSON.stringify({ private: true, dependencies }, null, 2)}\n`,
  );
  writeFileSync(
    resolve(INSTALL, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "Bundler",
          jsx: "react-jsx",
          strict: true,
          skipLibCheck: true,
          noEmit: true,
        },
        // Only what TypeDoc is pointed at; this compile checks nothing and writes nothing. Filled in after the install.
        files: [],
      },
      null,
      2,
    )}\n`,
  );
  // Peers resolve from this repo's own node_modules, one directory up, so the islands share one React.
  execFileSync(
    "npm",
    ["install", "--legacy-peer-deps", "--no-package-lock", "--no-audit", "--no-fund", "--silent"],
    { cwd: INSTALL, stdio: "inherit" },
  );

  // Every declaration entry of every package's export map, so TypeDoc can read any subpath a page names.
  const tsconfig = resolve(INSTALL, "tsconfig.json");
  const config = JSON.parse(readFileSync(tsconfig, "utf8"));
  config.files = Object.keys(manifest.npm).flatMap((name) => {
    const { exports = {} } = JSON.parse(readFileSync(resolve(INSTALL, "node_modules", name, "package.json"), "utf8"));
    return Object.values(exports)
      .map((target) => (typeof target === "string" ? target : target?.types))
      .filter((types) => types?.endsWith(".d.ts"))
      .map((types) => `node_modules/${name}/${types.replace(/^\.\//, "")}`);
  });
  writeFileSync(tsconfig, `${JSON.stringify(config, null, 2)}\n`);

  for (const [id, spec] of Object.entries(manifest.nuget)) {
    const nupkg = await nupkgFor(id, spec);
    mkdirSync(CONTRACT_DIR, { recursive: true });
    execFileSync("unzip", ["-o", "-q", nupkg, "lib/*", "*.nuspec", "-d", CONTRACT_DIR]);
  }
  if (!existsSync(CONTRACT_DLL)) throw new Error(`the contract package carries no ${CONTRACT_DLL}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await installArtifacts();
