/**
 * Moves the worked Uplink in `example/` to one published version: the three
 * npm packages in its client, the contract's NuGet range in its three C#
 * projects, then the lockfile and the page it writes (`gonogo-uplink.json` and
 * the README, whose `sdkVersion` is the version that wrote them).
 *
 * The root channel commits the result; the release-candidate channel builds from
 * it and commits nothing.
 *
 *   node scripts/pin-example.mjs <version> [--files-only]
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const NPM = ["@ksp-gonogo/sitrep-sdk", "@ksp-gonogo/ui-kit", "@ksp-gonogo/uplink-tools"];
const CSPROJ = [
  "example/mod/GonogoExampleUplink.csproj",
  "example/mod-contract/GonogoExampleUplink.Contract.csproj",
  "example/mod-tests/GonogoExampleUplink.Tests.csproj",
];

/** The client's manifest with the three packages at `version`, every other byte as it was. */
export function pinPackageJson(text, version) {
  const manifest = JSON.parse(text);
  for (const field of ["dependencies", "devDependencies"]) {
    for (const name of NPM) if (manifest[field]?.[name] !== undefined) manifest[field][name] = version;
  }
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

/** A project file with the contract's exact range at `version`. */
export function pinCsproj(text, version) {
  return text.replace(/(Include="KspGonogo\.Sitrep\.Contract"\s+Version=")\[[^\]]*\]/g, `$1[${version}]`);
}

function rewrite(path, change) {
  const file = resolve(ROOT, path);
  writeFileSync(file, change(readFileSync(file, "utf8")));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [version, ...flags] = process.argv.slice(2);
  if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version ?? "")) {
    console.error("usage: pin-example.mjs <version> [--files-only]");
    process.exit(2);
  }
  rewrite("example/client/package.json", (text) => pinPackageJson(text, version));
  for (const path of CSPROJ) rewrite(path, (text) => pinCsproj(text, version));
  if (!flags.includes("--files-only")) {
    const client = resolve(ROOT, "example/client");
    const run = (args, env = {}) => {
      const result = spawnSync("npm", args, { cwd: client, stdio: "inherit", env: { ...process.env, ...env } });
      if (result.status !== 0) process.exit(result.status ?? 1);
    };
    run(["install"]);
    /* `page` refuses to write under CI; this is the maintainer's write, not a check. */
    run(["run", "page"], { CI: "", GITHUB_ACTIONS: "" });
  }
}
