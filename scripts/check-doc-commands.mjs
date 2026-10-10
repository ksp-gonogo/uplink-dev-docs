/**
 * Checks every command line the guide tells an author to type, in both
 * directions.
 *
 *   ACCURACY. Every `uplink-tools <verb> [--flag]` and `pnpm dev [--flag]` in
 *   a shell fence names a verb and flags that exist. A page that says
 *   `bundle --watchh` or a verb the CLI never had is wrong in a way markdown
 *   cannot notice.
 *
 *   COVERAGE. Every verb the CLI prints in its own usage, and every `pnpm dev`
 *   flag, is named on at least one guide page. It is the rule
 *   gonogo applies to a published export (nothing ships without a page),
 *   applied to the command line, so a flag added to the CLI turns this red
 *   until a page says what it does.
 *
 * The usage text is read from a gonogo checkout (`packages/uplink-tools/src/cli`,
 * `check/command.ts`, `render/usage.ts`, `render/story.ts` and
 * `scripts/dev-args.mjs`), held to zero. Skipped without a checkout, a failure
 * in CI. What the published package can run is `check-example.mjs`'s ground.
 *
 * A command also counts as named when a page writes it in inline code, or runs
 * it through the `npm run <script>` the scaffold writes for it. Every flag of
 * `bundle` and `bake` and of `pnpm dev` must be on a page; the other verbs'
 * flags are held to accuracy and left to their own pages and `--help`.
 *
 * The check plants a violation and requires it to fail, so a check that has
 * stopped seeing anything reports BLIND rather than green.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { IN_CI, gonogoRoot } from "./check-doc-symbols.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Below the count the guide has, far above zero: a removed command must not trip it, a broken extractor must. */
const MINIMUM_COMMANDS = 6;
const MINIMUM_SPEC_FLAGS = 8;

const FENCE_LANGUAGES = new Set(["bash", "sh", "shell", "console", "zsh"]);

/* ------------------------------------------------------------------ *
 * What the pages say.
 * ------------------------------------------------------------------ */

function markdownFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      return entry === "cache" || entry === "dist" ? [] : markdownFiles(full);
    }
    return entry.endsWith(".md") ? [full] : [];
  });
}

/**
 * The shell statements a page's fences contain: comments removed, a trailing
 * backslash joined to the next line, `&&`, `;` and `|` split into statements.
 */
export function shellStatements(markdown) {
  const out = [];
  let fence = null;
  let pending = "";
  for (const raw of markdown.split("\n")) {
    const opening = /^\s*```(\w*)/.exec(raw);
    if (opening) {
      fence = fence === null ? opening[1] : null;
      pending = "";
      continue;
    }
    if (fence === null || !FENCE_LANGUAGES.has(fence)) continue;
    let line = raw.replace(/^\s*\$\s+/, "").replace(/\s+#.*$/, "");
    if (/^\s*#/.test(line)) continue;
    const continued = /\\\s*$/.test(line);
    line = line.replace(/\\\s*$/, "");
    pending = pending ? `${pending} ${line.trim()}` : line.trim();
    if (continued) continue;
    for (const part of pending.split(/&&|;|\|/)) {
      if (part.trim()) out.push(part.trim());
    }
    pending = "";
  }
  return out;
}

/**
 * What `npm run <script>` runs in an Uplink the scaffold wrote: its package.json
 * maps each of these to the `uplink-tools` command beside it. `bake` carries
 * its `--bundle` argument.
 */
const SCAFFOLD_SCRIPTS = {
  codegen: ["codegen", []],
  "codegen:check": ["codegen", ["--check"]],
  bundle: ["bundle", []],
  bake: ["bake", ["--bundle"]],
  release: ["release", []],
  render: ["render", []],
  page: ["page", []],
  docs: ["docs", []],
  "docs:check": ["docs", ["--check"]],
};

/** The command a `npm run <script> [-- args]` statement stands for, or null. */
function npmScript(tokens) {
  if (tokens[0] !== "npm" || tokens[1] !== "run" || !(tokens[2] in SCAFFOLD_SCRIPTS)) return null;
  const [verb, flags] = SCAFFOLD_SCRIPTS[tokens[2]];
  const extra = tokens.slice(3).filter((t) => t.startsWith("--") && t !== "--");
  return { verb, flags: [...flags, ...extra.map((t) => t.split("=")[0])] };
}

/**
 * Every `uplink-tools` and `pnpm dev` command in the statements, as
 * `{ tool, verb, flags }`. `verb` is empty for `pnpm dev`.
 */
export function commandsIn(statements) {
  const commands = [];
  for (const statement of statements) {
    const tokens = statement.split(/\s+/);
    const script = npmScript(tokens);
    if (script) {
      commands.push({ tool: "uplink-tools", ...script });
      continue;
    }
    const at = tokens.indexOf("uplink-tools");
    if (at !== -1) {
      const rest = tokens.slice(at + 1);
      const verb = rest[0] && !rest[0].startsWith("-") ? rest[0] : "";
      commands.push({
        tool: "uplink-tools",
        verb,
        flags: rest.filter((t) => t.startsWith("--")).map((t) => t.split("=")[0]),
      });
      continue;
    }
    if (tokens[0] === "pnpm" && tokens[1] === "dev") {
      commands.push({
        tool: "pnpm dev",
        verb: "",
        flags: tokens.slice(2).filter((t) => t.startsWith("--")).map((t) => t.split("=")[0]),
      });
    }
  }
  return commands;
}

/** Every command on every guide page, with the page it is on. */
export function commandsOnPages(pages) {
  return pages.flatMap(({ file, text }) =>
    commandsIn(shellStatements(text)).map((command) => ({ ...command, file })),
  );
}

/* ------------------------------------------------------------------ *
 * What the CLI says.
 * ------------------------------------------------------------------ */

const templateLiteral = (source, name) => {
  const match = new RegExp(`const ${name} = \`((?:\\\\.|[^\`\\\\])*)\``).exec(source);
  return match ? match[1].replaceAll("\\`", "`") : "";
};

/** The options a usage lists, one per line starting `  --flag`, not every flag its prose mentions. */
const flagsOf = (text) => [...new Set([...text.matchAll(/^ {2}(--[a-z][a-z-]*)/gm)].map((m) => m[1]))];

/**
 * The command spec, read from the usage text the tools print. `verbs` maps a
 * verb to the flags it takes, or to null when the flags live in a package this
 * pass was not pointed at.
 */
export function specFromSources({ usages, devArgs }) {
  const verbs = new Map();
  for (const line of templateLiteral(usages.top, "USAGE").split("\n")) {
    const match = /^ {2}([a-z][a-z-]*)\s{2,}\S/.exec(line);
    if (match) verbs.set(match[1], null);
  }
  for (const [verb, { source, name }] of Object.entries(usages.verbs)) {
    if (verbs.has(verb)) verbs.set(verb, flagsOf(templateLiteral(source, name)));
  }
  return {
    verbs,
    // The flags a page has to explain are those of the commands the dev loop
    // runs. Every other verb's flags are held to accuracy: each of those has
    // its own page, and the CLI answers --help for the full list.
    requiredFlags: COVERED_VERBS.flatMap((verb) =>
      (verbs.get(verb) ?? []).map((flag) => ({ verb, flag })),
    ),
    dev: flagsOf(devArgs.replaceAll("\\`", "`")),
  };
}

/** The verbs whose every flag a guide page must name. */
const COVERED_VERBS = ["bundle", "bake"];

/* ------------------------------------------------------------------ *
 * The two questions.
 * ------------------------------------------------------------------ */

/** Commands naming a verb or flag the spec does not have. */
export function accuracyProblems(commands, spec) {
  const problems = [];
  for (const command of commands) {
    const where = command.file ? ` (${command.file})` : "";
    if (command.tool === "pnpm dev") {
      for (const flag of command.flags) {
        if (!spec.dev.includes(flag) && flag !== "--help") {
          problems.push(`pnpm dev ${flag}: no such flag${where}`);
        }
      }
      continue;
    }
    if (!command.verb) continue;
    if (!spec.verbs.has(command.verb)) {
      problems.push(`uplink-tools ${command.verb}: no such command${where}`);
      continue;
    }
    const known = spec.verbs.get(command.verb);
    if (known === null) continue;
    for (const flag of command.flags) {
      if (!known.includes(flag) && flag !== "--help") {
        problems.push(`uplink-tools ${command.verb} ${flag}: no such flag${where}`);
      }
    }
  }
  return problems;
}

/** Verbs and flags the CLI documents in its own usage that no page names. */
export function coverageProblems(commands, pages, spec) {
  const problems = [];
  const named = new Set(commands.filter((c) => c.tool === "uplink-tools").map((c) => c.verb));
  const text = pages.map((p) => p.text).join("\n");
  for (const verb of spec.verbs.keys()) {
    // Inline code counts as well as a fence: most pages name a command in a sentence.
    const inline = new RegExp(`\`(?:npx )?(?:uplink-tools|npm run) ${verb}[\\s\`:]`).test(text);
    if (!named.has(verb) && !inline) {
      problems.push(`uplink-tools ${verb}: no guide page names it`);
    }
  }
  for (const { verb, flag } of spec.requiredFlags) {
    const used = commands.some(
      (c) => c.tool === "uplink-tools" && c.verb === verb && c.flags.includes(flag),
    );
    if (!used && !new RegExp(`\`${flag}(?![a-z-])`).test(text)) {
      problems.push(`uplink-tools ${verb} ${flag}: no guide page names it`);
    }
  }
  for (const flag of spec.dev) {
    const used = commands.some((c) => c.tool === "pnpm dev" && c.flags.includes(flag));
    if (!used && !new RegExp(`\`${flag}(?![a-z-])`).test(text)) {
      problems.push(`pnpm dev ${flag}: no guide page names it`);
    }
  }
  return problems;
}

/* ------------------------------------------------------------------ *
 * The plants.
 * ------------------------------------------------------------------ */

const PLANT_SPEC = {
  verbs: new Map([["bundle", ["--watch"]]]),
  requiredFlags: [{ verb: "bundle", flag: "--watch" }],
  dev: ["--uplink"],
};

/** Both questions must fail on input built to fail them, or they are blind. */
export function plantsFail() {
  const wrongFlag = commandsOnPages([
    { file: "plant.md", text: "```bash\nuplink-tools bundle --watchh\n```\n" },
  ]);
  const unnamed = coverageProblems([], [{ file: "plant.md", text: "no commands here" }], PLANT_SPEC);
  return {
    accuracy: accuracyProblems(wrongFlag, PLANT_SPEC).length > 0,
    coverage: unnamed.length > 0,
  };
}

/* ------------------------------------------------------------------ *
 * The check.
 * ------------------------------------------------------------------ */

function readPages() {
  const docs = resolve(ROOT, "docs/guide");
  return markdownFiles(docs).map((path) => ({
    file: relative(ROOT, path),
    text: readFileSync(path, "utf8"),
  }));
}

function sourceSpec(root) {
  const read = (path) => readFileSync(resolve(root, path), "utf8");
  const cli = "packages/uplink-tools/src/cli";
  const render = "packages/uplink-tools/src/render";
  const index = read(`${cli}/index.ts`);
  const usageOf = (file, name) => ({ source: read(file), name });
  return specFromSources({
    usages: {
      top: index,
      verbs: {
        bundle: { source: index, name: "BUNDLE_USAGE" },
        bake: usageOf(`${cli}/bake.ts`, "BAKE_USAGE"),
        new: usageOf(`${cli}/new.ts`, "NEW_USAGE"),
        codegen: usageOf(`${cli}/codegen.ts`, "CODEGEN_USAGE"),
        package: usageOf(`${cli}/package.ts`, "PACKAGE_USAGE"),
        page: usageOf(`${cli}/page.ts`, "PAGE_USAGE"),
        release: usageOf(`${cli}/release.ts`, "RELEASE_USAGE"),
        check: usageOf("packages/uplink-tools/src/check/command.ts", "CHECK_USAGE"),
        story: usageOf(`${render}/story.ts`, "STORY_USAGE"),
        render: usageOf(`${render}/usage.ts`, "RENDER_USAGE"),
        docs: usageOf(`${render}/usage.ts`, "DOCS_USAGE"),
      },
    },
    devArgs: read("scripts/dev-args.mjs"),
  });
}

export async function checkDocCommands(write = (s) => process.stdout.write(s)) {
  const failures = [];
  const planted = plantsFail();
  if (!planted.accuracy || !planted.coverage) {
    write(
      `BLIND: the command check could not see a planted violation (accuracy ${planted.accuracy}, coverage ${planted.coverage}).\n`,
    );
    return ["doc commands: BLIND"];
  }

  const pages = readPages();
  const commands = commandsOnPages(pages);
  write(`${commands.length} commands found on ${pages.length} guide pages.\n`);
  if (commands.length < MINIMUM_COMMANDS) {
    write(`BLIND: fewer than ${MINIMUM_COMMANDS} commands found, so the extractor has stopped seeing the pages.\n`);
    return ["doc commands: BLIND"];
  }

  let root;
  try {
    root = gonogoRoot();
  } catch (error) {
    write(`${error.message}\n`);
    return ["doc commands (source): gonogo checkout"];
  }
  if (!root && IN_CI) {
    write("CI=true and no gonogo checkout. The workflow checks one out and sets GONOGO_REPO; that step is missing or broken.\n");
    failures.push("doc commands (source): gonogo checkout");
  } else if (!root) {
    write("SKIPPED the source pass: no gonogo checkout. Set GONOGO_REPO, or clone gonogo beside this repo.\n");
  } else {
    let spec;
    try {
      spec = sourceSpec(root);
    } catch (error) {
      write(`${root} does not carry the CLI sources this reads (${error.message}). Update the checkout.\n`);
      return [...failures, "doc commands (source): gonogo checkout"];
    }
    if (spec.verbs.size === 0 || spec.requiredFlags.length + spec.dev.length < MINIMUM_SPEC_FLAGS) {
      write("BLIND: the usage text yielded almost no verbs or flags, so the reader no longer matches the CLI's source.\n");
      return [...failures, "doc commands (source): BLIND"];
    }
    const problems = [
      ...accuracyProblems(commands, spec),
      ...coverageProblems(commands, pages, spec),
    ];
    if (problems.length > 0) {
      failures.push("doc commands (source)");
      write(`\n${problems.map((p) => `    ${p}`).join("\n")}\n`);
    } else {
      write(`Every command on the pages exists, and every verb and flag in the usage is on a page (${root}).\n`);
    }
  }

  return failures;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const failures = await checkDocCommands();
  if (failures.length > 0) {
    process.stdout.write(`\nFAILED: ${failures.join(", ")}\n`);
    process.exit(1);
  }
  process.stdout.write("\nEvery command gate passed.\n");
}
