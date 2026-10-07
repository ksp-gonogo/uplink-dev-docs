/**
 * The pages that list other pages: a package's index, the reference index
 * over every section, and the Topic and command lists. Each is read from the
 * page modules and the packages, so a new page or a new Topic appears on them
 * with no edit here.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { INSTALL } from "./paths.mjs";
import { cellSafe, code, partsMd, typeMd } from "./typescript.mjs";

/**
 * The sections of the reference, in the order the sidebar shows them. Each is
 * a directory of pages, named as its sidebar group is, and the package whose
 * description introduces it.
 */
export const SECTIONS = [
  { dir: "reference/mod", name: "Mod API", nuget: "KspGonogo.Sitrep.Contract", specifier: "Sitrep.Contract" },
  { dir: "reference/client", name: "Client SDK", package: "@ksp-gonogo/sitrep-sdk" },
  { dir: "reference/widgets", name: "Widgets" },
  { dir: "reference/tools", name: "uplink-tools", package: "@ksp-gonogo/uplink-tools" },
  { dir: "reference/ui-kit", name: "ui-kit", package: "@ksp-gonogo/ui-kit" },
];

/** The section a page sits in: a subpath's pages (`reference/client/testing/...`) sit in their package's. */
export const sectionOf = (page) => page.path.split("/").slice(0, 2).join("/");

/** The first sentence of a description in Markdown, on one line. */
export function firstSentence(md) {
  const para = (md ?? "").trim().split(/\n{2,}/)[0].replace(/\s*\n\s*/g, " ");
  return /^([\s\S]*?[.!?])(?=\s+[A-Z[`(*]|$)/.exec(para)?.[1] ?? para;
}

const manifestOf = (name) => JSON.parse(readFileSync(resolve(INSTALL, "node_modules", ...name.split("/"), "package.json"), "utf8"));

/**
 * The opening paragraph of a packed README: the first one after its title
 * that is prose, not a heading, a list, a quote, a table or code.
 */
function readmeLead(name) {
  const readme = resolve(INSTALL, "node_modules", ...name.split("/"), "README.md");
  if (!existsSync(readme)) return "";
  const paragraphs = readFileSync(readme, "utf8").split(/\n{2,}/).map((p) => p.trim());
  return paragraphs.find((p) => p && !/^(#|```|[-*>|]|\d+\.)/.test(p))?.replace(/\s*\n\s*/g, " ") ?? "";
}

/** The contract package's own description, off the nuspec the installer extracted. */
function nuspecDescription() {
  const nuspec = readFileSync(resolve(INSTALL, "contract/KspGonogo.Sitrep.Contract.nuspec"), "utf8");
  return /<description>([^<]+)<\/description>/.exec(nuspec)?.[1].trim() ?? "";
}

/**
 * What a section's package says it is: the root doc comment of its entry
 * point (`@packageDocumentation`), else the opening paragraph of its packed
 * README. The contract's is its NuGet description.
 */
export function describeSection(section, projects, index) {
  if (section.nuget) return nuspecDescription();
  if (!section.package) return "";
  const comment = projects[section.package]?.comment;
  if (comment?.summary?.length) return partsMd(comment.summary, index).trim();
  return readmeLead(section.package);
}

/** The install line for a package and every peer it needs that is not optional. */
function installMd(name) {
  const manifest = manifestOf(name);
  const optional = manifest.peerDependenciesMeta ?? {};
  const peers = Object.entries(manifest.peerDependencies ?? {})
    .filter(([peer]) => !optional[peer]?.optional)
    .map(([peer, range]) => (range === "*" ? peer : /[\s|]/.test(range) ? `"${peer}@${range}"` : `${peer}@${range}`));
  return `\`\`\`bash\nnpm install ${[name, ...peers].join(" ")}\n\`\`\``;
}

/**
 * One package's index: what the package is, how to install it, then every
 * page in its section with the opening sentence of its lead, one table per
 * entry point. `leadOf` gives a page's lead description in Markdown.
 */
export function packageIndexMd(page, { pages, projects, index, urlOf, specifierOf, version, leadOf }) {
  const section = SECTIONS.find((s) => s.dir === sectionOf(page));
  if (!section?.package) throw new Error(`${page.path} is an index page outside any package's section`);
  const listed = pages.filter((p) => p !== page && sectionOf(p) === section.dir);
  const byEntry = new Map();
  for (const p of [...listed].sort((a, b) => (a.entry ?? "").localeCompare(b.entry ?? "") || a.title.localeCompare(b.title))) {
    const specifier = p.package ? specifierOf(p) : section.package;
    if (!byEntry.has(specifier)) byEntry.set(specifier, []);
    byEntry.get(specifier).push(p);
  }
  const out = [
    `# ${page.title}`,
    `${code(section.package)} · ${version(section.package)}`,
    describeSection(section, projects, index),
    installMd(section.package),
  ];
  for (const [specifier, group] of byEntry) {
    const entry = specifier.slice(section.package.length + 1);
    out.push(byEntry.size === 1 ? "## Pages {#pages}" : `## ${code(specifier)} {#${entry || "pages"}}`);
    const rows = group.map((p) => `| [${p.title}](${urlOf(p)}) | ${cellSafe(firstSentence(leadOf(p))).replace(/(?<!\\)\|/g, "\\|")} |`);
    out.push(`| Page | Description |\n| --- | --- |\n${rows.join("\n")}`);
  }
  return out;
}

/** The reference index: each section, what its package is, and a link to every page in it. */
export function referenceIndexMd(page, { pages, projects, index, urlOf, title }) {
  const out = [`# ${page.title}`];
  for (const section of SECTIONS) {
    const listed = pages.filter((p) => p !== page && sectionOf(p) === section.dir);
    if (listed.length === 0) continue;
    const home = listed.find((p) => p.path === `${section.dir}/index.md`);
    out.push(home ? `## [${section.name}](${urlOf(home)}) {#${section.dir.split("/")[1]}}` : `## ${section.name} {#${section.dir.split("/")[1]}}`);
    const specifier = section.package ?? section.specifier;
    if (specifier) out.push(code(specifier));
    const description = describeSection(section, projects, index);
    if (description) out.push(description);
    const links = listed.filter((p) => p !== home).sort((a, b) => title(a).localeCompare(title(b)));
    out.push(links.map((p) => `[${title(p)}](${urlOf(p)})`).join(" · "));
  }
  return out;
}

/** The names a constant tuple such as `TOPIC_IDS` holds. */
function tupleOf(project, name) {
  let type = project.getChildByName(name)?.type;
  if (type?.type === "typeOperator") type = type.target;
  if (type?.type !== "tuple") throw new Error(`${name} is not a constant tuple in ${project.name}`);
  return type.elements.map((e) => e.value);
}

/** Ids grouped by their first segment, in name order. */
function byPrefix(ids) {
  const groups = new Map();
  for (const id of [...ids].sort()) {
    const prefix = id.split(".")[0];
    if (!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix).push(id);
  }
  return groups;
}

/** Each member of a map interface by name, with its type as Markdown. */
function mapTypes(project, name, index) {
  const map = project.getChildByName(name);
  if (!map) throw new Error(`${project.name} does not export ${name}`);
  return new Map((map.children ?? []).map((m) => [m.name, cellSafe(typeMd(m.type, index))]));
}

/** One table per prefix, each id with a column per map. */
function idTablesMd(ids, columns, level) {
  const out = [];
  for (const [prefix, group] of byPrefix(ids)) {
    out.push(`${"#".repeat(level)} ${code(prefix)} {#${prefix}}`);
    const rows = group.map((id) => `| ${code(id)} | ${columns.map(([, types]) => types.get(id) ?? "").join(" | ")} |`);
    const head = ["Id", ...columns.map(([heading]) => heading)];
    out.push(`| ${head.join(" | ")} |\n| ${head.map(() => "---").join(" | ")} |\n${rows.join("\n")}`);
  }
  return out.join("\n\n");
}

/** Every Topic the sdk declares, grouped by prefix, with the type of its payload. */
export function topicListMd(sdk, index, level = 2) {
  return idTablesMd(tupleOf(sdk, "TOPIC_IDS"), [["Payload", mapTypes(sdk, "TopicPayloadMap", index)]], level);
}

/** Every command the sdk declares, grouped by prefix, with what it takes and what it replies with. */
export function commandListMd(sdk, index, level = 2) {
  return idTablesMd(
    tupleOf(sdk, "COMMAND_IDS"),
    [
      ["Arguments", mapTypes(sdk, "CommandArgsMap", index)],
      ["Reply", mapTypes(sdk, "CommandReplyMap", index)],
    ],
    level,
  );
}

/** The Topic list page: the lead's description, then every Topic. */
export function topicsPageMd(page, { sdk, index, version, leadOf }) {
  const link = (name) => `[${code(name)}](${index.url(name)})`;
  return [
    `# ${page.title}`,
    `${code(page.package)} · ${version(page.package)}`,
    leadOf(page),
    `Each Topic in ${link("TOPIC_IDS")}, by prefix, with its payload type in ${link("TopicPayloadMap")}.`,
    topicListMd(sdk, index),
  ];
}
