/**
 * Typechecks `template/client` twice, against the two things a snippet can be
 * true of.
 *
 *   SOURCE. The pages describe the kit and SDK as gonogo's source has them, so
 *   every snippet must compile against that source. Held to zero, no ledger.
 *   Runs when a gonogo checkout is reachable, and is skipped otherwise.
 *
 *   PUBLISHED. What an author can install today: the tarballs in
 *   `node_modules`. A snippet that cannot compile there sits in
 *   `NEEDS_REPUBLISH` with its exact error count, and the gate prints what each
 *   one is missing, so the republish ask reads straight off the log.
 *
 * Each pass compiles a planted snippet beside the real ones that must fail. A
 * pass that cannot see its own plant reports BLIND rather than green.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { IN_CI, gonogoRoot } from "./check-doc-symbols.mjs";
import { NEEDS_REPUBLISH } from "./template-types-debt.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TSCONFIG = resolve(ROOT, "template/client/tsconfig.json");
const PLANT = resolve(ROOT, "template/client/src/__plant__.tsx");

/**
 * Where each package's source entry sits in a gonogo checkout. Third-party
 * modules the source imports resolve to this repo's `node_modules`, because a
 * checkout extracted without an install has none of its own, and a module that
 * does not resolve is typed `any` and checks nothing.
 */
function sourcePaths(root) {
  const nm = (p) => resolve(ROOT, "node_modules", p);
  return {
    "@ksp-gonogo/ui-kit": [resolve(root, "packages/ui-kit/src/index.ts")],
    "@ksp-gonogo/theme": [resolve(root, "packages/theme/src/index.ts")],
    "@ksp-gonogo/sitrep-sdk": [resolve(root, "mod/sitrep-sdk/src/index.ts")],
    "@ksp-gonogo/sitrep-sdk/*": [resolve(root, "mod/sitrep-sdk/src/*")],
    "*": [nm("@types/*"), nm("*")],
  };
}

async function compile(ts, extraOptions, plantText) {
  const parsed = ts.getParsedCommandLineOfConfigFile(TSCONFIG, {}, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (d) => {
      throw new Error(ts.flattenDiagnosticMessageText(d.messageText, "\n"));
    },
  });
  const options = { ...parsed.options, ...extraOptions };
  const host = ts.createCompilerHost(options);
  const { getSourceFile, fileExists, readFile } = host;
  host.fileExists = (f) => resolve(f) === PLANT || fileExists.call(host, f);
  host.readFile = (f) => (resolve(f) === PLANT ? plantText : readFile.call(host, f));
  host.getSourceFile = (f, lang, ...rest) =>
    resolve(f) === PLANT
      ? ts.createSourceFile(f, plantText, lang, true, ts.ScriptKind.TSX)
      : getSourceFile.call(host, f, lang, ...rest);
  const program = ts.createProgram([...parsed.fileNames, PLANT], options, host);
  return { program, diagnostics: ts.getPreEmitDiagnostics(program) };
}

function byFile(ts, diagnostics) {
  const files = new Map();
  const elsewhere = [];
  for (const d of diagnostics) {
    const file = d.file ? relative(ROOT, d.file.fileName) : null;
    if (file && file.startsWith("template/")) {
      if (!files.has(file)) files.set(file, []);
      files.get(file).push(d);
    } else {
      elsewhere.push(d);
    }
  }
  return { files, elsewhere };
}

function location(ts, d) {
  const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
  return `${relative(ROOT, d.file.fileName)}:${line + 1}:${character + 1}`;
}

/**
 * What a diagnostic says is missing, in the words of the republish ask: a
 * package with no such export, or a component with no such prop or value.
 */
function missing(ts, d) {
  const text = ts.flattenDiagnosticMessageText(d.messageText, "\n");
  const noExport = /Module '"(.+?)"' has no exported member '(.+?)'/.exec(text);
  if (noExport) return `${noExport[1]} has no export ${noExport[2]}`;
  const noField = /'(.+?)' does not exist in type '(\w+)/.exec(text);
  if (noField) return `${noField[2]} has no field ${noField[1]}`;
  const noCase = /^Type '"(.+?)"' is not comparable to type '(.+?)'/.exec(text);
  if (noCase) return `no message type "${noCase[1]}" (has ${noCase[2]})`;

  let node = d.file ? findNode(ts, d.file, d.start) : undefined;
  let attribute;
  while (node && !ts.isJsxOpeningLikeElement(node)) {
    if (ts.isJsxAttribute(node)) attribute = node.name.getText();
    node = node.parent;
  }
  const tag = node ? node.tagName.getText() : undefined;
  const noProp = /Property '(.+?)' does not exist on type/.exec(text);
  if (tag && noProp) return `${tag} has no prop ${noProp[1]}`;
  const noMember = /^Property '(.+?)' does not exist on type '(?:typeof )?(.+?)'/.exec(text);
  if (noMember) return `${noMember[2]} has no member ${noMember[1]}`;
  const notAssignable = /^Type '(.+?)' is not assignable to type '(.+?)'/.exec(text);
  if (tag && attribute && notAssignable) {
    return `${tag} ${attribute} does not take ${notAssignable[1]} (takes ${notAssignable[2]})`;
  }
  return text.split("\n")[0];
}

function findNode(ts, sourceFile, position) {
  let found;
  (function visit(node) {
    if (position >= node.getStart(sourceFile) && position < node.getEnd()) {
      found = node;
      ts.forEachChild(node, visit);
    }
  })(sourceFile);
  return found;
}

function report(ts, diagnostics) {
  return diagnostics
    .map((d) => `    ${location(ts, d)} ${ts.flattenDiagnosticMessageText(d.messageText, " ").slice(0, 240)}`)
    .join("\n");
}

const PLANT_PATH = relative(ROOT, PLANT);

/* ------------------------------------------------------------------ *
 * Against source.
 * ------------------------------------------------------------------ */

/** Cannot find module, missing jsx-runtime, untyped module, no JSX namespace. */
const UNRESOLVED = new Set([2307, 2875, 7016, 7026]);

const SOURCE_PLANT = `import { Stack } from "@ksp-gonogo/ui-kit";
export const Planted = () => <Stack gap="md" />;
`;

export async function checkTemplateAgainstSource(write = (s) => process.stdout.write(s)) {
  let root;
  try {
    root = gonogoRoot();
  } catch (error) {
    write(`${error.message}\n`);
    return ["template types (source): gonogo checkout"];
  }
  if (!root && IN_CI) {
    write(
      "CI=true and no gonogo checkout. The workflow checks one out and sets\n" +
        "GONOGO_REPO; that step is missing or broken.\n",
    );
    return ["template types (source): gonogo checkout"];
  }
  if (!root) {
    write(
      "SKIPPED: no gonogo checkout. Set GONOGO_REPO, or clone gonogo beside this\n" +
        "repo, to compile the template against the source the pages describe.\n",
    );
    return [];
  }
  const sdkEntry = resolve(root, "mod/sitrep-sdk/src/index.ts");
  if (!existsSync(sdkEntry)) {
    write(`${root} has no mod/sitrep-sdk/src/index.ts.\n`);
    return ["template types (source): gonogo checkout"];
  }

  const { default: ts } = await import("typescript");
  const { program, diagnostics } = await compile(
    ts,
    { baseUrl: ROOT, paths: sourcePaths(root) },
    SOURCE_PLANT,
  );
  const { files, elsewhere } = byFile(ts, diagnostics);
  const failures = [];

  /* An unresolved module anywhere types its imports `any`, and `any` accepts
     every snippet, so it is blindness rather than noise. The kit's own strict-
     mode findings are not this gate's business and are left alone. */
  const unresolved = [...elsewhere, ...[...files.values()].flat()].filter((d) =>
    UNRESOLVED.has(d.code),
  );
  const kitSource = program.getSourceFile(resolve(root, "packages/ui-kit/src/index.ts"));
  const plant = files.get(PLANT_PATH) ?? [];
  files.delete(PLANT_PATH);
  if (unresolved.length > 0 || !kitSource || plant.length === 0) {
    write(
      "BLIND: the source pass could not see a planted `<Stack gap=\"md\" />`, or\n" +
        "did not compile against the checkout's kit at all. A checkout older than\n" +
        `the kit these pages describe reads this way too: update ${root}.\n` +
        (unresolved.length > 0 ? `${report(ts, unresolved.slice(0, 10))}\n` : ""),
    );
    return ["template types (source): BLIND"];
  }

  write(`Compiled ${program.getRootFileNames().length - 1} template sources against ${root}.\n`);
  if (files.size > 0) {
    failures.push("template types (source)");
    write(
      "\nA snippet does not compile against the source the pages describe.\n\n" +
        [...files.values()].map((ds) => report(ts, ds)).join("\n") +
        "\n",
    );
  }
  return failures;
}

/* ------------------------------------------------------------------ *
 * Against the published packages.
 * ------------------------------------------------------------------ */

const PUBLISHED_PLANT = `import { NotAnExportOfTheKit } from "@ksp-gonogo/ui-kit";
export const Planted = NotAnExportOfTheKit;
`;

export async function checkTemplateAgainstPublished(write = (s) => process.stdout.write(s)) {
  const { default: ts } = await import("typescript");
  const versions = ["@ksp-gonogo/ui-kit", "@ksp-gonogo/sitrep-sdk"]
    .map((name) => {
      const manifest = resolve(ROOT, "node_modules", name, "package.json");
      return `${name}@${JSON.parse(readFileSync(manifest, "utf8")).version}`;
    })
    .join(", ");
  const { program, diagnostics } = await compile(ts, {}, PUBLISHED_PLANT);
  const { files, elsewhere } = byFile(ts, diagnostics);
  const failures = [];

  const plant = files.get(PLANT_PATH) ?? [];
  files.delete(PLANT_PATH);
  if (plant.length === 0) {
    write("BLIND: the published pass could not see a planted import of a name the kit does not export.\n");
    return ["template types (published): BLIND"];
  }

  const sources = program.getRootFileNames().length - 1;
  write(`Compiled ${sources} template sources against ${versions}.\n`);

  const gone = Object.keys(NEEDS_REPUBLISH).filter((f) => !existsSync(resolve(ROOT, f)));
  if (gone.length > 0) {
    failures.push("template types (published): BLIND");
    write(
      "\nBLIND: NEEDS_REPUBLISH names a snippet that does not exist, so it no\n" +
        "longer describes the tree. Remove it from template-types-debt.mjs.\n\n" +
        gone.map((f) => `    ${f}`).join("\n") +
        "\n",
    );
  }

  const wrong = [];
  const unlisted = [];
  for (const [file, ds] of files) {
    const allowed = NEEDS_REPUBLISH[file];
    if (allowed === undefined) unlisted.push(ds);
    else if (ds.length !== allowed) wrong.push({ file, count: ds.length, allowed });
  }
  for (const [file, allowed] of Object.entries(NEEDS_REPUBLISH)) {
    if (!files.has(file) && existsSync(resolve(ROOT, file))) wrong.push({ file, count: 0, allowed });
  }

  if (unlisted.length > 0) {
    failures.push("template types (published)");
    write(
      "\nA snippet does not compile against the published packages, and is not\n" +
        "in NEEDS_REPUBLISH.\n\n" +
        unlisted.map((ds) => report(ts, ds)).join("\n") +
        "\n",
    );
  }
  if (wrong.length > 0) {
    failures.push("template types (published ledger)");
    write(
      "\nNEEDS_REPUBLISH is exact: a count that moved either way is the ledger\n" +
        "misstating the gap. Set each to what it now is, and remove a 0.\n\n" +
        wrong.map((w) => `    ${w.file}: ${w.count} errors, ledger says ${w.allowed}`).join("\n") +
        "\n",
    );
  }

  const listed = [...files].filter(([file]) => NEEDS_REPUBLISH[file] !== undefined);
  if (listed.length > 0) {
    const asks = new Set();
    write(`\nNeeds a republish (${listed.length} of ${sources} snippets):\n`);
    for (const [file, ds] of listed) {
      const what = [...new Set(ds.map((d) => missing(ts, d)))];
      what.forEach((w) => asks.add(w));
      write(`  ${file}\n${what.map((w) => `      ${w}`).join("\n")}\n`);
    }
    write(`\nThe published packages are missing:\n${[...asks].sort().map((a) => `  ${a}`).join("\n")}\n`);
  }
  return failures;
}
