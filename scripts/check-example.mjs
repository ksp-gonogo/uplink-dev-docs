/**
 * Proves the Guide's worked Uplink, `example/`, is what an author gets and
 * that it works, against the release candidate the site names.
 *
 * `example/` is `uplink-tools new example` as the published package writes
 * it, plus the files the Guide adds or changes on the way. So:
 *
 * 1. `new` is run again into an empty directory, and every file it writes
 *    must equal the example's copy, except the files in `EDITED`, each of
 *    which must differ (an entry that no longer differs is stale). A file in
 *    the example that `new` does not write must be in `ADDED`
 * 2. The scaffold's own checks run in it, as an author runs them:
 *    `npm ci`, `bake`, `codegen:check`, `typecheck`, `npm test` (which holds
 *    the generated page to the registrations) and `dotnet test mod-tests`
 *
 * Before comparing, it compares a planted copy with one file changed, and
 * fails as BLIND unless that copy fails.
 *
 * Needs Node, the .NET SDK and the network (npm and nuget.org).
 *
 *   node scripts/check-example.mjs
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const EXAMPLE = resolve(ROOT, "example");
const { version } = JSON.parse(readFileSync(resolve(ROOT, "reference/artifacts.json"), "utf8")).published;

/** What `new` is run with: the same answers the example was made with. */
const NEW_ARGS = [
  "new", "example", "--name", "Example", "--author", "Uplink docs", "--repo", "ksp-gonogo/uplink-dev-docs",
  "--topics", "own", "--no-workflows", "--no-ksp", "--no-install", "--no-generate",
];

/** Files the Guide changes from what `new` writes, and the page that changes each. */
export const EDITED = {
  "client/src/uplink.ts": "Documenting your Uplink: what the Uplink is for",
  "client/src/index.ts": "Writing a reckoner: loads the reckoner",
  "client/src/topics.ts": "Publishing a Topic: the regions the page quotes, and the reset command's argument type exported",
  "client/src/commands.ts": "Sending a command: the regions the page quotes",
  "client/src/Heartbeat/index.tsx": "A widget, Sending a command and Writing a reckoner: every reading state, the reset button and the modelled count",
  "client/src/Heartbeat/index.test.tsx": "Testing: the widget fed by a stream fixture, received, modelled and held",
  "mod/ExampleUplink.cs": "Accepting a command: the reset command",
  "mod-contract/ExamplePayloads.cs": "Accepting a command: the command's arguments",
  "mod-contract/ExampleRtConfig.cs": "Publishing a Topic and Accepting a command: the wire types codegen exports",
  "mod-tests/ExampleUplinkTests.cs": "Accepting a command: the reset's tests",
};

/** Files in the example that `new --no-generate --no-install` does not write: the Guide's own, and what the generators write. */
export const ADDED = {
  "client/src/reckoner.ts": "Writing a reckoner",
  "client/src/reckoner.test.ts": "Writing a reckoner: its tests",
  "client/package-lock.json": "npm install",
  "client/README.md": "npm run page",
  "client/gonogo-uplink.json": "npm run page",
  "client/docs/widgets.json": "npm run page",
  "client/src/__generated__/contract.ts": "npm run codegen",
  "client/src/__generated__/topic-map.ts": "npm run codegen",
  "client/src/__generated__/command-map.ts": "npm run codegen",
  "client/src/__generated__/units.ts": "npm run codegen",
  "client/src/__generated__/units.json": "npm run codegen",
};

const IGNORED = new Set(["node_modules", "bin", "obj", "dist", "renders"]);

function files(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (IGNORED.has(entry.name)) return [];
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return files(full, base);
    return entry.name.endsWith(".g.cs") ? [] : [relative(base, full)];
  });
}

/** Every way `example` departs from the scaffold `fresh` holds, as sentences. */
function drift(fresh, example) {
  const faults = [];
  const written = new Set(files(fresh));
  for (const file of written) {
    const theirs = join(example, file);
    if (!existsSync(theirs)) {
      faults.push(`${file}: new writes it and the example has none`);
      continue;
    }
    const same = readFileSync(join(fresh, file)).equals(readFileSync(theirs));
    if (Object.hasOwn(EDITED, file) && same) faults.push(`${file}: listed in EDITED but equal to what new writes, so delete the entry`);
    if (!Object.hasOwn(EDITED, file) && !same) faults.push(`${file}: differs from what new writes, and EDITED does not say which page changes it`);
  }
  for (const file of files(example)) {
    if (!written.has(file) && !Object.hasOwn(ADDED, file)) faults.push(`${file}: new does not write it, and ADDED does not list it`);
  }
  for (const file of [...Object.keys(EDITED), ...Object.keys(ADDED)]) {
    if (!existsSync(join(example, file))) faults.push(`${file}: listed, but the example has no such file`);
  }
  return faults;
}

function run(label, command, args, cwd) {
  process.stdout.write(`\n-- ${label}\n`);
  const result = spawnSync(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  return result.status === 0 ? [] : [label];
}

export function checkExample() {
  const failures = [];
  const scratch = mkdtempSync(join(tmpdir(), "uplink-docs-example-"));
  try {
    const fresh = join(scratch, "example");
    mkdirSync(fresh);
    const made = spawnSync("npx", ["--yes", `@ksp-gonogo/uplink-tools@${version}`, ...NEW_ARGS], { cwd: fresh, encoding: "utf8" });
    if (made.status !== 0) {
      process.stdout.write(made.stdout + made.stderr);
      return [`uplink-tools@${version} new`];
    }

    const planted = join(scratch, "planted");
    cpSync(EXAMPLE, planted, { recursive: true, filter: (src) => !IGNORED.has(src.split("/").pop()) });
    writeFileSync(join(planted, "uplink.json"), `${readFileSync(join(planted, "uplink.json"), "utf8")}\n`);
    if (drift(fresh, planted).length === 0) {
      process.stdout.write("BLIND: a planted change to uplink.json was not seen. Fix the check before trusting it.\n");
      return ["example drift: BLIND"];
    }

    const faults = drift(fresh, EXAMPLE);
    if (faults.length > 0) {
      process.stdout.write(`The example has drifted from what uplink-tools@${version} new writes:\n  ${faults.join("\n  ")}\n`);
      failures.push("example drift");
    } else {
      process.stdout.write(`The example is what uplink-tools@${version} new writes, plus ${Object.keys(EDITED).length} edited and ${Object.keys(ADDED).length} added files (planted change seen).\n`);
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }

  const client = join(EXAMPLE, "client");
  const steps = [
    ["npm ci", "npm", ["ci", "--no-audit", "--no-fund"]],
    ["bake", "npx", ["uplink-tools", "bake"]],
    ["codegen:check", "npm", ["run", "codegen:check"]],
    ["typecheck", "npm", ["run", "typecheck"]],
    ["npm test", "npm", ["test"]],
    ["dotnet test mod-tests", "dotnet", ["test", "../mod-tests", "--nologo"]],
  ];
  for (const [label, command, args] of steps) {
    const failed = run(label, command, args, client);
    failures.push(...failed.map((f) => `example: ${f}`));
    if (failed.length > 0 && label === "npm ci") break;
  }
  return failures;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const failures = checkExample();
  if (failures.length > 0) {
    process.stdout.write(`\nFAILED: ${failures.join(", ")}\n`);
    process.exit(1);
  }
  process.stdout.write("\nThe example builds, tests and matches the scaffold.\n");
}
