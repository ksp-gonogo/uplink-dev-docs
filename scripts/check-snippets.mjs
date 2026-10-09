/**
 * Compiles every snippet the documentation includes, resolves every include,
 * checks that every symbol the pages name is one the kit exports, and that
 * every reference page is generated.
 *
 * The worked Uplink under `example/` is built and tested as an author would,
 * from npm and nuget.org (`check-example.mjs`), so this needs the .NET SDK and
 * the network.
 *
 * Every section runs whatever the ones before it did, and the verdict at the
 * bottom names each one that failed. A compile error in the example must not
 * take the symbol check offline with it: they go stale independently, and the
 * symbol check is the only one that can see a page describing something the
 * kit deleted.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

process.stdout.write("\n== the worked Uplink, against the published release candidate ==\n");
const { checkExample } = await import("./check-example.mjs");
failures.push(...checkExample());

process.stdout.write("\n== reference examples against the packed artifacts (tsc) ==\n");
const { checkReferenceExamples } = await import("./check-reference-examples.mjs");
failures.push(...(await checkReferenceExamples()));

// The mod reference pages' examples, against the packed contract `npm run reference` installed.
process.stdout.write("\n== mod reference examples against the packed contract (dotnet) ==\n");
const built = spawnSync("dotnet", ["build", "reference/examples/mod", "--nologo", "-v", "q"], { cwd: root, stdio: "inherit" });
if (built.status !== 0) failures.push("mod reference examples (dotnet)");

// Every `<<<` include must resolve to a real file, and to a real region when
// one is named. VitePress renders a missing include as an error block in the
// page instead of failing the build, so nothing else would catch it.
import { readFileSync, readdirSync, statSync } from "node:fs";

function markdownFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      return entry === "cache" || entry === "dist" ? [] : markdownFiles(full);
    }
    return entry.endsWith(".md") ? [full] : [];
  });
}

process.stdout.write("\n== snippet includes ==\n");
let includeCount = 0;
for (const page of markdownFiles(resolve(root, "docs"))) {
  const body = readFileSync(page, "utf8");
  for (const line of body.split("\n")) {
    const match = /^<<<\s+(\S+?)(?:\{[^}]*\})?\s*$/.exec(line);
    if (!match) continue;
    includeCount++;
    const [path, region] = match[1].split("#");
    const target = resolve(dirname(page), path);
    if (!existsSync(target)) {
      failures.push(`missing snippet file: ${path} (in ${page})`);
      continue;
    }
    if (region && !readFileSync(target, "utf8").includes(`#region ${region}`)) {
      failures.push(`missing region "${region}" in ${path} (in ${page})`);
    }
  }
}
process.stdout.write(`${includeCount} includes resolved.\n`);

process.stdout.write("\n== documented symbols ==\n");
const { checkDocSymbols } = await import("./check-doc-symbols.mjs");
failures.push(...(await checkDocSymbols()));

process.stdout.write("\n== reference pages ==\n");
const { checkReferencePages } = await import("./check-reference-pages.mjs");
failures.push(...checkReferencePages());

process.stdout.write("\n== ratchets and CI wiring ==\n");
const { checkRatchets } = await import("./check-ratchets.mjs");
failures.push(...checkRatchets());

if (failures.length > 0) {
  process.stdout.write(`\nFAILED: ${failures.join(", ")}\n`);
  process.exit(1);
}
process.stdout.write("\nEvery gate passed.\n");
