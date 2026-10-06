/**
 * Typechecks `reference/examples/`, the files the generated pages render and
 * show, against the packed artifacts in `.reference/`: what a release would
 * publish. An example that does not compile there is a page showing code an
 * author cannot write.
 *
 * The compile carries a planted example beside the real ones that must fail.
 * A pass that cannot see its own plant reports BLIND rather than green.
 */
import { existsSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TSCONFIG = resolve(ROOT, "reference/examples/tsconfig.json");
const PLANT = resolve(ROOT, "reference/examples/__plant__.tsx");
const INSTALLED = resolve(ROOT, ".reference/node_modules/@ksp-gonogo/sitrep-sdk/package.json");

/** An augment whose component takes props the slot does not pass. */
const PLANT_TEXT = `import { registerAugment } from "@ksp-gonogo/sitrep-sdk";
registerAugment({ id: "plant", augments: "crew-status.avatar", component: (props: { planted: number }) => null });
`;

export async function checkReferenceExamples(write = (s) => process.stdout.write(s)) {
  if (!existsSync(INSTALLED)) {
    write("No installed artifacts in .reference/. Run `npm run reference` first.\n");
    return ["reference examples: no artifacts"];
  }
  const { default: ts } = await import("typescript");
  const parsed = ts.getParsedCommandLineOfConfigFile(TSCONFIG, {}, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (d) => {
      throw new Error(ts.flattenDiagnosticMessageText(d.messageText, "\n"));
    },
  });
  const host = ts.createCompilerHost(parsed.options);
  const { fileExists, readFile, getSourceFile } = host;
  const isPlant = (f) => resolve(f) === PLANT;
  host.fileExists = (f) => isPlant(f) || fileExists.call(host, f);
  host.readFile = (f) => (isPlant(f) ? PLANT_TEXT : readFile.call(host, f));
  host.getSourceFile = (f, lang, ...rest) =>
    isPlant(f)
      ? ts.createSourceFile(f, PLANT_TEXT, lang, true, ts.ScriptKind.TSX)
      : getSourceFile.call(host, f, lang, ...rest);
  const program = ts.createProgram([...parsed.fileNames, PLANT], parsed.options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  const onPlant = diagnostics.filter((d) => d.file && isPlant(d.file.fileName));
  const real = diagnostics.filter((d) => !(d.file && isPlant(d.file.fileName)));
  if (onPlant.length === 0) {
    write("BLIND: the planted example with the wrong props compiled, so this pass checks nothing.\n");
    return ["reference examples: BLIND"];
  }
  if (real.length > 0) {
    for (const d of real) {
      const where = d.file
        ? `${relative(ROOT, d.file.fileName)}:${d.file.getLineAndCharacterOfPosition(d.start).line + 1}`
        : "(no file)";
      write(`  ${where} ${ts.flattenDiagnosticMessageText(d.messageText, " ").slice(0, 240)}\n`);
    }
    return ["reference examples"];
  }
  write(`${parsed.fileNames.length} examples compile against the packed artifacts; the planted one does not.\n`);
  return [];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const failures = await checkReferenceExamples();
  process.exit(failures.length > 0 ? 1 : 0);
}
