/**
 * The command-line page: what the installed package's own command prints for
 * `--help`, and for each command's `--help`, verbatim. Run from the packed
 * package, so the page cannot describe a command or an option it does not have.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { INSTALL } from "./paths.mjs";

const fence = (text) => `\`\`\`text\n${text.trimEnd()}\n\`\`\``;

/** The page for one package's command: its overview, then a section per command it lists. */
export function cliPageMd(page, { version }) {
  const dir = resolve(INSTALL, "node_modules", ...page.package.split("/"));
  const { bin } = JSON.parse(readFileSync(resolve(dir, "package.json"), "utf8"));
  const [name, path] = typeof bin === "string" ? [page.package.split("/").pop(), bin] : Object.entries(bin ?? {})[0] ?? [];
  if (!path) throw new Error(`${page.package} declares no command in its package.json bin`);
  const help = (...args) => execFileSync(process.execPath, [resolve(dir, path), ...args, "--help"], { encoding: "utf8" });
  const overview = help();
  const commands = [...overview.matchAll(/^ {2}([a-z][\w-]*) {2,}/gm)].map(([, command]) => command);
  if (commands.length === 0) throw new Error(`${name} --help lists no commands`);
  return [
    `# ${page.title}`,
    `\`${page.package}\` · ${version(page.package)}`,
    fence(overview),
    ...commands.flatMap((command) => [`## ${command} {#${command}}`, fence(help(command))]),
  ];
}
