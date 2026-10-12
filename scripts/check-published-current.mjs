/**
 * Fails when the version these pages name is no longer the one an author gets.
 *
 * `reference/artifacts.json` is the one place the version is written, and the
 * Guide's prose reads it. `new` pins whatever the `rc` dist-tag names, so when
 * a newer candidate is published the pages go on naming the old one, and an
 * author following `@rc` gets something other than what the pages describe.
 * This asks the registry for each package's tag and says what to change.
 *
 * Declared in RUNS_ELSEWHERE in scripts/check-ratchets.mjs: the build cannot run it (it needs the network), so a `current` job does, and its unit test runs in the build.
 *
 * Runs in its own CI job and on a schedule, not in the build, so a new
 * candidate shows up as a red check the next night without blocking an
 * unrelated edit from deploying.
 *
 *   node scripts/check-published-current.mjs
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGES = ["@ksp-gonogo/sitrep-sdk", "@ksp-gonogo/ui-kit", "@ksp-gonogo/uplink-tools"];

/** The problems with `named` against what the registry's tag holds, one line each. Empty means current. */
export function staleness(named, npmTag, registry) {
  const problems = [];
  for (const [pkg, version] of Object.entries(registry)) {
    if (version !== named) {
      problems.push(`${pkg}@${npmTag} is ${version || "not published"}, and the pages name ${named}`);
    }
  }
  return problems;
}

function tagOf(pkg, npmTag) {
  const run = spawnSync("npm", ["view", pkg, `dist-tags.${npmTag}`], { encoding: "utf8" });
  if (run.status !== 0) throw new Error(`npm view ${pkg} failed: ${run.stderr.trim().split("\n").pop()}`);
  return run.stdout.trim();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const { published } = JSON.parse(readFileSync(resolve(root, "reference/artifacts.json"), "utf8"));
  const registry = Object.fromEntries(PACKAGES.map((pkg) => [pkg, tagOf(pkg, published.npmTag)]));
  const problems = staleness(published.version, published.npmTag, registry);
  if (problems.length > 0) {
    console.error(
      `✖ the pages name a ${published.name} that is not the current one:\n  ${problems.join("\n  ")}\n` +
        "  Set published.version in reference/artifacts.json and move its gonogo pin to the commit that release\n" +
        "  was cut from, then run npm run reference:pack and npm run build.",
    );
    process.exit(1);
  }
  console.log(`the pages name ${published.version}, which is what @${published.npmTag} installs`);
}
