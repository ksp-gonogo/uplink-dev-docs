/**
 * C# reference: xmldocmd reads the contract assembly and its XML doc file from
 * the installed NuGet package, and this module composes its per-member Markdown
 * into one page of several types.
 *
 * xmldocmd rather than DefaultDocumentation: DefaultDocumentation 1.2.5 writes a
 * `<para>` as indented raw HTML, which Markdown reads as a code block, and links
 * an undocumented member of this assembly to learn.microsoft.com.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { CONTRACT_DLL } from "./install.mjs";
import { INSTALL, ROOT } from "./paths.mjs";

const OUT = resolve(INSTALL, "xmldocmd");
const NAMESPACE = "Sitrep.Contract";
/** Every namespace xmldocmd writes a directory for: `Sitrep.Contract` and the ones under it. */
const namespaces = () => readdirSync(OUT, { withFileTypes: true }).filter((e) => e.isDirectory() && e.name.startsWith(NAMESPACE)).map((e) => e.name);

/** Run xmldocmd over the installed contract. Its Markdown lands in `.reference/xmldocmd`. */
export function runXmldocmd() {
  rmSync(OUT, { recursive: true, force: true });
  execFileSync("dotnet", ["tool", "restore"], { cwd: ROOT, stdio: "ignore" });
  execFileSync(
    "dotnet",
    ["xmldocmd", CONTRACT_DLL, OUT, "--skip-unbrowsable", "--clean", "--quiet"],
    { cwd: ROOT, stdio: "inherit" },
  );
}

/** The namespace directory holding a type's file, or undefined when the contract declares no public type by this name. */
const namespaceOf = (name) => namespaces().find((ns) => existsSync(resolve(OUT, ns, `${name}.md`)));

/** Whether the contract declares a public type by this name. */
export const isContractType = (name) => namespaceOf(name) !== undefined;

/** A file of xmldocmd's, by its path under its type's namespace. */
const read = (path) => readFileSync(resolve(OUT, namespaceOf(path.split("/")[0].replace(/\.md$/, "")), path), "utf8");

/**
 * The public types tagged `<category>name</category>`, in the order the XML
 * doc file lists them. A type nested in another has no page of its own, so it
 * is left out.
 */
export function contractCategory(name) {
  const xml = readFileSync(CONTRACT_DLL.replace(/\.dll$/, ".xml"), "utf8");
  const types = [];
  for (const [, id, doc] of xml.matchAll(/<member name="T:([^"]+)">([\s\S]*?)<\/member>/g)) {
    if (/<category>([^<]+)<\/category>/.exec(doc)?.[1].trim() !== name) continue;
    // xmldocmd writes a generic type to a file named by its arity, `StreamData-1.md`.
    const simple = id.split(".").pop().replace(/`(\d+)$/, "-$1");
    if (isContractType(simple)) types.push(simple);
  }
  if (types.length === 0) throw new Error(`no public type in ${NAMESPACE} carries <category>${name}</category>`);
  return types;
}

/** A file's body: no title, no See Also, no generator footer. */
function body(md) {
  return md
    .trim()
    .replace(/^# .*\n+/, "")
    .replace(/\n## See Also[\s\S]*?(?=\n---\n|$)/g, "")
    .replace(/<!-- DO NOT EDIT[^>]*-->\s*/g, "")
    // xmldocmd drops a `<b>` with the line break after it, so a bold sentence runs into the next link.
    .replace(/([.:;!?])(\[`)/g, "$1 $2")
    .trim();
}

/**
 * Rewrites xmldocmd's file links. A type on this page becomes an anchor, and
 * so does a member of one; a type on another contract page links there; a
 * name with no page keeps its name as code and loses the link.
 */
function relink(md, onPage, index) {
  return md.replace(/\[(`[^`]+`|[^\]]+)\]\(([^)]+)\.md\)/g, (_, text, target) => {
    const parts = target.replace(/^(\.\.?\/)+/, "").split("/").filter((p) => !p.startsWith(NAMESPACE));
    const shown = text.startsWith("`") ? text : `\`${text}\``;
    if (parts.length === 0 || parts.length > 2) return shown;
    const [type, member] = parts;
    if (onPage.has(type)) return `[${shown}](#${member ? `${type}.${member}` : type})`;
    const url = index?.url(type);
    if (!url) return shown;
    // A generated page anchors each member under its type's; a hand page has only the page.
    return `[${shown}](${member && url.includes("#") ? `${url}.${member}` : url})`;
  });
}

/** xmldocmd's parameter table, with its headings in the site's case. */
const tidyTables = (md) =>
  md
    .replace(/^\| parameter \| description \|$/gm, "| Parameter | Description |")
    .replace(/^\| name \| value \| description \|$/gm, "| Name | Value | Description |");

/** The member files a type page links to, in the order it lists them. */
function memberFiles(typeMd, type) {
  const files = [];
  for (const m of typeMd.matchAll(new RegExp(`\\]\\((${type}/[^)]+\\.md)\\)`, "g"))) {
    if (!files.includes(m[1])) files.push(m[1]);
  }
  return files;
}

/**
 * One type's section: its summary and declaration, then each member's. The
 * page's own type has no heading of its own and its members sit at `##`;
 * every other type is a `###` with its members at `####`.
 */
function typeMd(type, onPage, lead, example, index) {
  const page = read(`${type}.md`);
  const kind = /^# \S+ (\w+)/.exec(page)?.[1] ?? "";
  const [head, table] = body(page).split(/\n## (?:Public )?Members\n/);
  const memberLevel = lead ? "###" : "####";
  const members = [];
  const declarations = [];
  if (kind !== "enumeration") {
    for (const file of memberFiles(table ?? "", type)) {
      const member = file.split("/")[1].replace(/\.md$/, "");
      const sections = read(file)
        .split(/\n---\n/)
        .map((section) => relink(tidyTables(body(section)), onPage, index))
        // xmldocmd heads a member's Return Value, Exceptions and Remarks at `##`; they belong under the member.
        .map((section) => section.replace(/^## /gm, `${memberLevel}# `));
      // xmldocmd writes a sentence for the implicit constructor, which says nothing about the type.
      if (sections.every((section) => section.startsWith("The default constructor."))) continue;
      for (const section of sections) {
        const signature = /```csharp\n([\s\S]*?)\n```/.exec(section)?.[1];
        if (signature) declarations.push(`    ${signature.replace(/^public /, kind === "interface" ? "" : "public ").trim()}${/[;}]$/.test(signature) ? "" : ";"}`);
      }
      const heading = member === type ? `${type} constructor` : member;
      members.push(`${memberLevel} ${heading} {#${type}.${member}}`, sections.join("\n\n"));
    }
  }
  if (kind === "enumeration") {
    for (const m of head.matchAll(/^\| (\w+) \| `([^`]+)` \|/gm)) declarations.push(`    ${m[1]} = ${m[2]},`);
  }
  // The type's own block shows the whole declaration, every member's signature included.
  const whole = head.replace(/```csharp\n([\s\S]*?)\n```/, (_, declaration) =>
    declarations.length === 0
      ? `\`\`\`csharp\n${declaration}\n\`\`\``
      : `\`\`\`csharp\n${declaration}\n{\n${declarations.join("\n")}\n}\n\`\`\``,
  );
  const out = [];
  // A generic type's file is named by its arity; the page shows it as the author writes it.
  const shown = type.replace(/-1$/, "&lt;T&gt;");
  if (!lead) out.push(`### ${shown} {#${type}}`);
  const own = relink(tidyTables(whole.replace(/\n## Values\n/, "\n")), onPage, index);
  out.push(lead ? own : own.replace(/^## /gm, "#### "));
  if (lead && members.length > 0) out.push("## Members {#members}");
  out.push(...members);
  if (example) out.push(example);
  return out.join("\n\n");
}

/**
 * The page body: the first of `types` is the page's subject, and the rest are
 * grouped under "Related types". `examples` maps a type to a `<<<` include
 * shown after it.
 */
export function contractMd(types, examples, index) {
  const onPage = new Set(types);
  for (const type of types) {
    if (!isContractType(type)) throw new Error(`${NAMESPACE} has no public type ${type}`);
  }
  const [lead, ...rest] = types;
  return [
    typeMd(lead, onPage, true, examples[lead], index),
    rest.length > 0 ? "## Related types {#related-types}" : "",
    ...rest.map((type) => typeMd(type, onPage, false, examples[type], index)),
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** A type's summary, its first paragraph, linked through `index`. */
export const contractSummary = (type, index) => relink(body(read(`${type}.md`)).split(/\n{2,}/)[0], new Set(), index);
