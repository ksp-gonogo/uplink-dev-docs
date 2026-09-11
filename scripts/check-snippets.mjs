/**
 * Compiles every snippet the documentation includes, resolves every include,
 * and checks that every symbol the pages name is one the kit exports.
 *
 * The client half always runs. The mod half needs `Sitrep.Contract.dll`, which
 * ships in a KSP install rather than on a package registry, so it runs only
 * when SITREP_CONTRACT_DLL points at one.
 *
 * Every section runs whatever the ones before it did, and the verdict at the
 * bottom names each one that failed. A compile error in the template must not
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

function run(label, command, args) {
  process.stdout.write(`\n== ${label} ==\n`);
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) {
    failures.push(label);
  }
}

run("client snippets (tsc)", "node", [
  "node_modules/typescript/bin/tsc",
  "-p",
  "template/client/tsconfig.json",
]);

const contractDll = process.env.SITREP_CONTRACT_DLL;
if (!contractDll) {
  process.stdout.write(
    "\n== mod snippets (dotnet) ==\nSKIPPED: set SITREP_CONTRACT_DLL to the " +
      "Sitrep.Contract.dll in your KSP install to compile the mod snippets.\n",
  );
} else if (!existsSync(contractDll)) {
  failures.push("mod snippets (dotnet)");
  process.stdout.write(`\nSITREP_CONTRACT_DLL does not exist: ${contractDll}\n`);
} else {
  run("mod snippets (dotnet)", "dotnet", [
    "build",
    "template/mod/ExampleUplink/ExampleUplink.csproj",
    `-p:SitrepContractDll=${contractDll}`,
    "--nologo",
    "-v",
    "q",
  ]);
}

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

if (failures.length > 0) {
  process.stdout.write(`\nFAILED: ${failures.join(", ")}\n`);
  process.exit(1);
}
process.stdout.write("\nAll snippets compiled.\n");
