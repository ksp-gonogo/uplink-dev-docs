/**
 * Packs the packages the generated reference reads, from a gonogo checkout,
 * into `artifacts/`: the stand-in for a registry until release candidates are
 * published. uplink-tools is read for its `widgets.json`, the record each
 * widget page is headed with.
 *
 * This is the only script here that reads a gonogo checkout, and it reads it
 * only to produce packages. `generate.mjs` reads the packages and nothing else,
 * so once the release candidates exist this script is deleted and
 * `reference/artifacts.json` names versions instead of files.
 *
 * `gonogo` in `reference/artifacts.json` pins the commit the deployed site is
 * packed from; CI checks that commit out. A local pack from any other commit
 * says so, since its pages are not the ones a deploy would publish.
 *
 *   node scripts/reference/pack-artifacts.mjs            # sibling ../gonogo, or GONOGO_REPO
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, renameSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { gonogoRoot } from "../check-doc-symbols.mjs";
import { ARTIFACTS, ROOT } from "./paths.mjs";

const root = gonogoRoot();
if (root === null) {
  throw new Error("No gonogo checkout: set GONOGO_REPO, or clone gonogo beside this repo.");
}

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: "inherit" });

rmSync(ARTIFACTS, { recursive: true, force: true });
mkdirSync(ARTIFACTS, { recursive: true });

run(
  "pnpm",
  ["turbo", "run", "build", "--filter=@ksp-gonogo/ui-kit", "--filter=@ksp-gonogo/sitrep-sdk", "--filter=@ksp-gonogo/uplink-tools"],
  root,
);

/** `pnpm pack` applies `publishConfig`, so the tarball is what `npm publish` would upload. */
const npmPackages = {
  "packages/ui-kit": "ksp-gonogo-ui-kit.tgz",
  "mod/sitrep-sdk": "ksp-gonogo-sitrep-sdk.tgz",
  "packages/uplink-tools": "ksp-gonogo-uplink-tools.tgz",
};
for (const [dir, name] of Object.entries(npmPackages)) {
  const scratch = join(ARTIFACTS, ".pack");
  rmSync(scratch, { recursive: true, force: true });
  run("pnpm", ["pack", "--pack-destination", scratch], join(root, dir));
  const [tarball] = readdirSync(scratch);
  renameSync(join(scratch, tarball), join(ARTIFACTS, name));
  rmSync(scratch, { recursive: true, force: true });
}

const nuget = join(ARTIFACTS, ".nuget");
run(
  "dotnet",
  ["pack", "mod/Sitrep.Contract.Package/Sitrep.Contract.Package.csproj", "-c", "Release", "-o", nuget, "--nologo", "-v", "q"],
  root,
);
const nupkg = readdirSync(nuget).find((f) => f.endsWith(".nupkg") && !f.endsWith(".snupkg"));
renameSync(join(nuget, nupkg), join(ARTIFACTS, "KspGonogo.Sitrep.Contract.nupkg"));
rmSync(nuget, { recursive: true, force: true });

const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const { gonogo: pinned } = JSON.parse(readFileSync(resolve(ROOT, "reference/artifacts.json"), "utf8"));
console.log(`Packed from ${root} at ${head} into ${ARTIFACTS}`);
if (head !== pinned) console.log(`The site is pinned to gonogo ${pinned}, so these pages are not the ones a deploy publishes.`);
