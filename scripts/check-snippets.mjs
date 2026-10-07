/**
 * Compiles every snippet the documentation includes, resolves every include,
 * checks that every symbol the pages name is one the kit exports, and that
 * every reference page is generated.
 *
 * The published client pass always runs. The source pass needs a gonogo
 * checkout, and the mod half needs `Sitrep.Contract.dll` via
 * SITREP_CONTRACT_DLL. Locally each is skipped without its input; in CI, which
 * provides both from a checkout of gonogo, a missing one fails.
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

const {
  checkTemplateAgainstSource,
  checkTemplateAgainstPublished,
} = await import("./check-template-types.mjs");
process.stdout.write("\n== client snippets against source (tsc) ==\n");
failures.push(...(await checkTemplateAgainstSource()));
process.stdout.write("\n== client snippets against published packages (tsc) ==\n");
failures.push(...(await checkTemplateAgainstPublished()));

process.stdout.write("\n== reference examples against the packed artifacts (tsc) ==\n");
const { checkReferenceExamples } = await import("./check-reference-examples.mjs");
failures.push(...(await checkReferenceExamples()));

const contractDll = process.env.SITREP_CONTRACT_DLL;
if (!contractDll && process.env.CI === "true") {
  failures.push("mod snippets (dotnet)");
  process.stdout.write(
    "\n== mod snippets (dotnet) ==\nCI=true and SITREP_CONTRACT_DLL is unset. The " +
      "workflow builds Sitrep.Contract from the gonogo checkout and sets it; that " +
      "step is missing or broken.\n",
  );
} else if (!contractDll) {
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

process.stdout.write("\n== reference pages ==\n");
const { checkReferencePages } = await import("./check-reference-pages.mjs");
failures.push(...checkReferencePages());

if (failures.length > 0) {
  process.stdout.write(`\nFAILED: ${failures.join(", ")}\n`);
  process.exit(1);
}
process.stdout.write("\nEvery gate passed.\n");
