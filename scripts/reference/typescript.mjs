/**
 * TypeScript reference: TypeDoc reads a package's published declarations and
 * TSDoc, and this module writes the Markdown.
 *
 * TypeDoc is the parser and the type resolver. The Markdown is written here
 * rather than by typedoc-plugin-markdown because a page here is a composition:
 * a category's symbols on one page, a component's props folded into it, a
 * registry cut down to one widget's keys. The plugin writes one file per
 * declaration, and every one of those compositions would mean parsing its
 * Markdown back apart.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Application, ReflectionKind } from "typedoc";
import { AMBIGUOUS_SYMBOLS } from "../ambiguous-symbols.mjs";
import { DOCS, INSTALL } from "./paths.mjs";

/**
 * Load one entry point of an installed package as a TypeDoc project: its root,
 * or the subpath `entry` names (`"frames"` for `@ksp-gonogo/sitrep-sdk/frames`),
 * through the package's own export map.
 */
export async function loadPackage(name, entry) {
  const dir = resolve(INSTALL, "node_modules", ...name.split("/"));
  const key = entry ? `./${entry}` : ".";
  const target = JSON.parse(readFileSync(resolve(dir, "package.json"), "utf8")).exports?.[key];
  const types = typeof target === "string" ? target : target?.types;
  if (!types?.endsWith(".d.ts")) throw new Error(`${name} exports no declarations at ${key}`);
  const app = await Application.bootstrap({
    entryPoints: [resolve(dir, types)],
    tsconfig: resolve(INSTALL, "tsconfig.json"),
    skipErrorChecking: true,
    sort: ["source-order"],
    readme: "none",
    logLevel: "Error",
  });
  const project = await app.convert();
  if (!project) throw new Error(`TypeDoc could not read ${name}`);
  return project;
}

/**
 * The exported reflection named `name`, from the first project that exports
 * it. A page documents only what an author can import by name, so anything
 * else is an error to fix in the package, never a page to render anyway.
 */
export function exported(projects, name, why) {
  for (const project of projects) {
    const found = project.getChildByName(name);
    if (found) return { reflection: found, project };
  }
  throw new Error(
    `${name} is not exported by name from ${projects.map((p) => p.name).join(" or ")}, ` +
      `but ${why}. Export it from the package root.`,
  );
}

/* ------------------------------------------------------------------ *
 * Links: every symbol a page renders, so another page can point at it.
 * ------------------------------------------------------------------ */

export class SymbolIndex {
  #byName = new Map();
  #missed = new Set();

  /** Records a `{@link}` to a name with no entry. */
  miss(name) {
    this.#missed.add(name);
  }

  /** Every name a `{@link}` pointed at that has no entry. */
  get missed() {
    return [...this.#missed].sort();
  }

  add(name, url) {
    if (!this.#byName.has(name)) this.#byName.set(name, url);
  }

  url(name) {
    return this.#byName.get(name);
  }

  toJSON() {
    return Object.fromEntries(this.#byName);
  }
}

/* ------------------------------------------------------------------ *
 * Markdown primitives.
 * ------------------------------------------------------------------ */

const escapeText = (s) => s.replace(/([\\`*_<>|[\]])/g, "\\$1");
const code = (s) => (s.includes("`") ? `\`\` ${s} \`\`` : `\`${s}\``);
const htmlEscape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * A member's, parameter's or type parameter's own name, in the first cell of
 * its table. It is marked as a member so the symbol pass never links it to a
 * top-level export that shares the name, and a member row carries `anchor` so
 * a link to the member lands on its row rather than on its owner.
 */
function memberName(name, anchor) {
  const id = anchor ? ` id="${htmlEscape(anchor)}"` : "";
  return `<code class="member"${id}>${htmlEscape(name)}</code>`;
}

/**
 * A member's anchor: its owner's name and its own, `StatEntry.value`. An
 * object type written inline has no name of its own, so it adds nothing.
 */
function memberAnchor(member) {
  const names = [];
  for (let r = member; r && !r.kindOf(ReflectionKind.Project | ReflectionKind.Module); r = r.parent) {
    if (r.name !== "__type") names.unshift(r.name);
  }
  return names.join(".");
}

/** A name as inline code, linked where the index has a page for it. */
function linked(name, index, shown = name) {
  const url = index.url(name);
  return url ? `[${code(shown)}](${url})` : code(shown);
}

/** A type as inline Markdown, each named part linked where it can be. */
export function typeMd(type, index) {
  if (!type) return "";
  const t = (x) => typeMd(x, index);
  switch (type.type) {
    case "reference": {
      // A type parameter such as `Unit` in `Value<Unit>` is named by its declaration, never by an export that shares its name, so it is marked as a name no link pass touches.
      if (type.refersToTypeParameter) return memberName(type.name);
      // A named union of literals is shown as its values, which is what an author has to write.
      const alias = type.reflection?.kind === ReflectionKind.TypeAlias ? type.reflection.type : undefined;
      if (!index.url(type.name) && alias?.type === "union" && alias.types.every((m) => m.type === "literal")) {
        return t(alias);
      }
      const args = type.typeArguments?.length
        ? `\\<${type.typeArguments.map(t).join(", ")}\\>`
        : "";
      return `${linked(type.name, index)}${args}`;
    }
    case "union":
      return type.types.map(t).join(" \\| ");
    case "intersection":
      return type.types.map(t).join(" & ");
    case "array":
      return `${t(type.elementType)}[]`;
    case "typeOperator":
      return `${type.operator} ${t(type.target)}`;
    case "tuple":
      return `[${(type.elements ?? []).map(t).join(", ")}]`;
    case "reflection": {
      // An object type written inline: whole where it is short, by its member names where it is not.
      const children = type.declaration.children ?? [];
      const whole = type.toString();
      if (children.length === 0 || whole.length <= 80) return code(whole);
      const names = children.map((c) => `${c.name}${c.flags.isOptional ? "?" : ""}`);
      return code(`{ ${names.slice(0, 6).join("; ")}${names.length > 6 ? "; ..." : ""} }`);
    }
    case "intrinsic":
    case "literal":
      return code(type.toString());
    default:
      return code(type.toString());
  }
}

/**
 * A top-level union written one member per line, so a long union of object
 * shapes reads as its arms rather than as one line to scroll.
 */
function declarationText(type) {
  if (type?.type === "union" && type.toString().length > 80) {
    return `\n  | ${type.types.map((m) => m.toString()).join("\n  | ")}`;
  }
  return ` ${type.toString()}`;
}

/**
 * An object type as it is declared, one member per line, nested objects
 * indented: the shape an author reads a constant object's members off.
 * Below `depth` a nested object is written `{ ... }`.
 */
function objectText(declaration, depth = 2, pad = "") {
  const lines = (declaration.children ?? []).map((c) => {
    const name = /^[A-Za-z_$][\w$]*$/.test(c.name) ? c.name : JSON.stringify(c.name);
    const head = `${pad}  ${c.flags.isReadonly ? "readonly " : ""}${name}${c.flags.isOptional ? "?" : ""}: `;
    const nested = c.type?.type === "reflection" && c.type.declaration.children?.length;
    if (!nested) return `${head}${c.type?.toString() ?? "unknown"};`;
    return `${head}${depth > 1 ? objectText(c.type.declaration, depth - 1, `${pad}  `) : "{ ... }"};`;
  });
  return `{\n${lines.join("\n")}\n${pad}}`;
}

/** A comment's own headings sit under the symbol's: `##` in a comment is rendered at `level`. */
function demoteHeadings(md, level) {
  let fenced = false;
  return md
    .split("\n")
    .map((line) => {
      if (/^```/.test(line)) fenced = !fenced;
      const heading = fenced ? null : /^(#{1,5})\s(.*)$/.exec(line);
      if (!heading) return line;
      return `${"#".repeat(Math.min(6, Math.max(2, level + heading[1].length - 2)))} ${heading[2]}`;
    })
    .join("\n");
}

/**
 * The exported symbol a reflection belongs to: itself, or for a member such as
 * the `text` a sibling field links to, the declaration that holds it.
 */
function ownerOf(reflection) {
  let owner = reflection;
  while (owner.parent && !owner.parent.kindOf(ReflectionKind.Project | ReflectionKind.Module)) owner = owner.parent;
  return owner;
}

/**
 * The URL of a member's row: its owner's page, at the member's own anchor. Only
 * an owner's own members have rows, so a member nested deeper, such as a
 * property of a method's parameter, links to its owner.
 */
function memberUrl(member, index) {
  const owner = index.url(ownerOf(member).name);
  if (!owner) return undefined;
  const anchor = memberAnchor(member);
  return anchor.split(".").length === 2 ? `${owner.split("#")[0]}#${anchor}` : owner;
}

/** Display parts to Markdown, with every `{@link}` pointed at its page. */
export function partsMd(parts, index) {
  return (parts ?? [])
    .map((part) => {
      if (part.kind !== "inline-tag") return part.text;
      // A target TypeDoc could not resolve to a reflection is a symbol id with no name, so the tag's text names it.
      const target = typeof part.target?.kindOf === "function" ? part.target : undefined;
      const name = target?.name ?? part.text;
      const shown = part.text.trim() || name;
      const member = target && ownerOf(target) !== target;
      /*
       * TypeDoc resolves a bare name to a sibling member first. For most names a top-level export of
       * that name is the one meant; for an ambiguous one the member TypeDoc found is.
       */
      if (member && (Object.hasOwn(AMBIGUOUS_SYMBOLS, target.name) || !index.url(target.name))) {
        const url = memberUrl(target, index);
        if (url) return `[${code(shown)}](${url})`;
      }
      const symbol = target && !(member && index.url(target.name)) ? ownerOf(target).name : name.split(".")[0];
      if (!index.url(symbol)) index.miss(symbol);
      return linked(symbol, index, shown);
    })
    .join("");
}

/** A description squeezed into one table cell. */
function cellMd(parts, index) {
  return partsMd(parts, index)
    .trim()
    .split(/\n{2,}/)
    .map((para) =>
      para
        .split("\n")
        .map((line) => line.replace(/^\s*[-*]\s+/, "• "))
        .join(para.includes("\n- ") || /^\s*- /.test(para) ? "<br>" : " "),
    )
    .join("<br><br>")
    .replace(/\|/g, "\\|");
}

/* ------------------------------------------------------------------ *
 * Comments.
 * ------------------------------------------------------------------ */

const commentOf = (reflection) =>
  reflection.comment ?? reflection.signatures?.[0]?.comment;

/**
 * The block tags printed in a symbol's running text, each under its label.
 * `@remarks` runs on as plain paragraphs; `@example`, `@param`,
 * `@typeParam`, `@returns` and `@defaultValue` are printed in their own
 * places; any other tag (`@category`, or one a package uses for its own
 * checks, such as `@intent`) says nothing to an author and is not printed.
 */
const LABELLED_TAGS = new Map([
  ["@deprecated", "Deprecated"],
  ["@see", "See also"],
  ["@throws", "Throws"],
]);

function summaryMd(comment, index, level, { omitRemarks = false } = {}) {
  if (!comment) return "";
  const body = [partsMd(comment.summary, index).trim()];
  for (const tag of comment.blockTags) {
    if (tag.tag === "@remarks" && !omitRemarks) body.push(partsMd(tag.content, index).trim());
    if (LABELLED_TAGS.has(tag.tag)) body.push(`**${LABELLED_TAGS.get(tag.tag)}:** ${partsMd(tag.content, index).trim()}`);
  }
  return demoteHeadings(body.filter(Boolean).join("\n\n"), level);
}

/**
 * A block tag whose first line names something, as TypeDoc reads
 * `@categoryDescription`: the name, and the text after it as display parts.
 */
function namedTag(tag) {
  const [first, ...rest] = tag.content;
  const [name, ...text] = (first?.text ?? "").split("\n");
  return { name: name.trim(), parts: [{ ...first, text: text.join("\n") }, ...rest] };
}

/** Each concept's page, by concept name, set before any page is written. */
let conceptPages = new Map();
export const setConceptPages = (pages) => {
  conceptPages = pages;
};

/** Every Guide page a reference entry links to with `@guide`, so the link check can find each anchor on the built site. */
export const GUIDE_LINKS = new Set();

/** A Guide page's title: the first heading of its source, without an explicit anchor. */
function guideTitle(file) {
  const heading = /^# (.+)$/m.exec(readFileSync(file, "utf8"))?.[1];
  return heading?.replace(/\s*\{#[^}]+\}\s*$/, "").trim();
}

/**
 * The links a symbol's comments make out of the reference: `@concept <Name>`
 * to the concept page that shows that text, and `@guide <page>#<anchor>` to
 * the Guide page that teaches the symbol. A Guide page that does not exist
 * fails generation; an anchor that does not fails the link check.
 */
function crossLinksMd(comments, owner) {
  const out = [];
  for (const tag of comments.flatMap((c) => c?.blockTags ?? [])) {
    if (tag.tag === "@concept") {
      const { name } = namedTag(tag);
      const url = conceptPages.get(name);
      if (!url) throw new Error(`${owner} carries @concept ${name}, which no concept page shows`);
      out.push(`**Concept:** [${name}](${url})`);
    }
    if (tag.tag === "@guide") {
      const target = tag.content.map((p) => p.text).join("").trim().replace(/^\/?guide\//, "");
      const [page, anchor] = target.split("#");
      const file = resolve(DOCS, "guide", `${page || "index"}.md`);
      if (!existsSync(file)) throw new Error(`${owner} carries @guide ${target}, but docs/guide/${page || "index"}.md does not exist`);
      const url = `/guide/${page}${anchor ? `#${anchor}` : ""}`;
      GUIDE_LINKS.add(url);
      out.push(`**Guide:** [${guideTitle(file) ?? page}](${url})`);
    }
  }
  return [...new Set(out)].join("\n\n");
}

/**
 * Every `@concept` written in a project's doc comments: the concept's name,
 * its text as display parts, and the symbols whose comments carry it. One
 * concept written twice with different text is an error.
 */
export function conceptsOf(projects) {
  const concepts = new Map();
  for (const project of projects) {
    for (const reflection of Object.values(project.reflections)) {
      for (const comment of [reflection.comment, ...callSignatures(reflection).map((s) => s.comment)]) {
        for (const tag of comment?.blockTags ?? []) {
          if (tag.tag !== "@concept") continue;
          const { name, parts } = namedTag(tag);
          const text = parts.map((p) => p.text).join("").trim();
          const known = concepts.get(name);
          if (known && known.text !== text) throw new Error(`@concept ${name} is written twice, on ${known.carriers[0]} and ${reflection.name}: keep one`);
          const concept = known ?? { name, parts, text, carriers: [] };
          if (!concept.carriers.includes(reflection.name)) concept.carriers.push(reflection.name);
          concepts.set(name, concept);
        }
      }
    }
  }
  return concepts;
}

/** What a signature's `@returns` says it returns, as a line of its own. */
function returnsMd(comment, index) {
  const tag = comment?.blockTags.find((t) => t.tag === "@returns");
  return tag ? `**Returns:** ${partsMd(tag.content, index).trim()}` : "";
}

/** A symbol's `@remarks` alone, for a page that places them apart from the rest of its doc. */
export function remarksMd(reflection, index) {
  const comments = [commentOf(reflection), ...callSignatures(reflection).map((s) => s.comment)];
  const tag = comments.flatMap((c) => c?.blockTags ?? []).find((t) => t.tag === "@remarks");
  return tag ? partsMd(tag.content, index).trim() : "";
}

function examplesMd(comment, index, level) {
  const examples = (comment?.blockTags ?? []).filter((t) => t.tag === "@example");
  if (examples.length === 0) return "";
  const out = [`${"#".repeat(level)} Examples`];
  for (const example of examples) {
    // TypeDoc keeps an example's first line as its name.
    if (example.name) out.push(`**${partsMd([{ kind: "text", text: example.name }], index)}**`);
    out.push(partsMd(example.content, index).trim());
  }
  return out.join("\n\n");
}

function defaultOf(reflection) {
  const tag = reflection.comment?.blockTags.find((t) => t.tag === "@defaultValue");
  if (!tag) return "";
  return tag.content.map((p) => p.text).join("").trim().replace(/^```\w*\n?|\n?```$/g, "");
}

/** A default's cell: a value that is one code span is shown as code, one with words around it as written. */
function defaultCell(reflection) {
  const value = defaultOf(reflection);
  if (!value) return "";
  const span = /^`([^`]*)`$/.exec(value);
  if (span) return code(span[1]);
  return value.includes("`") ? cellSafe(value.replace(/\n+/g, " ")) : code(value);
}

/** An accessor's type and comment live on its getter. */
const typeOfMember = (member) => member.type ?? member.getSignature?.type;

/* ------------------------------------------------------------------ *
 * Declarations.
 * ------------------------------------------------------------------ */

const isOwn = (reflection) =>
  (reflection.sources ?? []).some((s) => s.fullFileName.includes("/@ksp-gonogo/"));

/**
 * The members worth a row: every own member, and none inherited from a DOM or
 * React declaration, which would bury the handful that are the component's in
 * several hundred attributes.
 */
function ownMembers(reflection) {
  // A class's constructor is shown in its declaration, not as a member row.
  const all = (reflection.children ?? []).filter((c) => c.kind !== ReflectionKind.Constructor);
  const own = all.filter((c) => !c.inheritedFrom || isOwn(c));
  return { own, dropped: all.length - own.length };
}

/** Inline Markdown made safe for a table cell: a pipe inside a code span would end the cell. */
export const cellSafe = (md) => md.replace(/`[^`]*`/g, (span) => span.replace(/(?<!\\)\|/g, "\\|"));

/** A properties table for an interface or an object-literal type. */
export function propertiesMd(reflection, index) {
  const { own, dropped } = ownMembers(reflection);
  if (own.length === 0) return "";
  const rest = dropped > 0 ? `\n\nEvery other prop is passed to the element it renders, as React's ${code(heritageOf(reflection))}.` : "";
  return `${memberTable(own, index)}${rest}`;
}

/** One row per member: its name, its type, its default where any member has one, and its description. */
function memberTable(own, index) {
  if (own.length === 0) return "";
  const withDefaults = own.some((member) => defaultOf(member));
  const rows = own.map((member) => {
    const optional = member.flags.isOptional ? "?" : "";
    const type = typeOfMember(member)
      ? cellSafe(typeMd(typeOfMember(member), index))
      : member.signatures
        ? cellSafe(code(methodText(member.signatures[0])))
        : "";
    const cells = [memberName(`${member.flags.isStatic ? "static " : ""}${member.name}${optional}`, memberAnchor(member)), type];
    if (withDefaults) cells.push(defaultCell(member));
    cells.push(cellMd((commentOf(member) ?? member.getSignature?.comment)?.summary, index));
    return `| ${cells.join(" | ")} |`;
  });
  const head = withDefaults
    ? "| Name | Type | Default | Description |\n| --- | --- | --- | --- |"
    : "| Name | Type | Description |\n| --- | --- | --- |";
  return `${head}\n${rows.join("\n")}`;
}

/** What an interface whose inherited members are not listed extends, as it declares it. */
function heritageOf(reflection) {
  const declared = (reflection.extendedTypes ?? []).map(String);
  return declared.length > 0 ? declared.join(", ") : "HTMLAttributes<HTMLElement>";
}

/** A method member as the function type an author would write for it: `<T>(a: A, b?: B) => R`. */
function methodText(signature) {
  const params = (signature.parameters ?? []).map((p) => `${p.name}${p.flags.isOptional ? "?" : ""}: ${p.type}`);
  return `${typeParamsText(signature.typeParameters)}(${params.join(", ")}) => ${signature.type}`;
}

/** `<T extends X = Y>`, as the declaration wrote it. */
function typeParamsText(params) {
  if (!params?.length) return "";
  const one = (p) =>
    `${p.name}${p.type ? ` extends ${p.type}` : ""}${p.default ? ` = ${p.default}` : ""}`;
  return `<${params.map(one).join(", ")}>`;
}

/** The whole interface or class as it is declared, members typed, their docs left to the table. */
function interfaceText(reflection) {
  const { own, dropped } = ownMembers(reflection);
  const heritage = dropped > 0 ? ` extends ${heritageOf(reflection)}` : "";
  const keyword = reflection.kind === ReflectionKind.Class ? "class" : "interface";
  const name = (m) => (/^[A-Za-z_$][\w$]*$/.test(m.name) ? m.name : JSON.stringify(m.name));
  const params = (sig) => (sig.parameters ?? []).map((p) => `${p.name}${p.flags.isOptional ? "?" : ""}: ${p.type}`).join(", ");
  const constructors = (reflection.children ?? [])
    .filter((c) => c.kind === ReflectionKind.Constructor)
    .flatMap((c) => c.signatures ?? [])
    .map((sig) => `  constructor(${params(sig)});`);
  const lines = own.flatMap((m) => {
    const optional = m.flags.isOptional ? "?" : "";
    const modifiers = `${m.flags.isStatic ? "static " : ""}${m.flags.isReadonly ? "readonly " : ""}`;
    if (!m.type && m.signatures) {
      return m.signatures.map((sig) => `  ${modifiers}${name(m)}${optional}${typeParamsText(sig.typeParameters)}(${params(sig)}): ${sig.type};`);
    }
    if (!m.type && m.getSignature) return [`  ${m.setSignature ? "" : "readonly "}${name(m)}: ${m.getSignature.type};`];
    return [`  ${modifiers}${name(m)}${optional}: ${m.type?.toString() ?? "unknown"};`];
  });
  return `${keyword} ${reflection.name}${typeParamsText(reflection.typeParameters)}${heritage} {\n${[...constructors, ...lines].join("\n")}\n}`;
}

/** Each type parameter and what it stands for, from its `@typeParam`. */
function typeParamsMd(params, index) {
  const documented = (params ?? []).filter((p) => p.comment?.summary?.length);
  if (documented.length === 0) return "";
  const rows = documented.map((p) => `| ${memberName(p.name)} | ${cellMd(p.comment.summary, index)} |`);
  return `| Type parameter | Meaning |\n| --- | --- |\n${rows.join("\n")}`;
}

/** A destructured parameter has no name of its own; a component's is its props. */
const paramName = (p) => (p.name === "__namedParameters" ? "props" : p.name);

function signatureText(name, signature) {
  const typeParams = typeParamsText(signature.typeParameters);
  const params = (signature.parameters ?? [])
    .map((p) => `${p.flags.isRest ? "..." : ""}${paramName(p)}${p.flags.isOptional ? "?" : ""}: ${p.type}`)
    .join(", ");
  return `function ${name}${typeParams}(${params}): ${signature.type};`;
}

function parametersMd(signature, index, level) {
  const params = signature.parameters ?? [];
  if (params.length === 0 || params.every((p) => !p.comment)) return "";
  const rows = params.map(
    (p) => `| ${memberName(paramName(p))} | ${cellSafe(typeMd(p.type, index))} | ${cellMd(p.comment?.summary, index)} |`,
  );
  return `${"#".repeat(level)} Parameters\n\n| Name | Type | Description |\n| --- | --- | --- |\n${rows.join("\n")}`;
}

/**
 * The props a component is drawn from: an interface, or a type alias built of
 * object types, one per distinct call signature, so an overloaded component
 * lists the props of each.
 */
export function propsListOf(reflection, project) {
  if (!isComponent(reflection)) return [];
  const assigned = assignedRootOf(reflection);
  if (assigned) {
    const props = project.getChildByName(`${reflection.name}Props`);
    return props?.kind === ReflectionKind.Interface ? [props] : [];
  }
  if (reflection.kind !== ReflectionKind.Function) return [];
  const found = [];
  for (const signature of reflection.signatures ?? []) {
    const params = signature.parameters ?? [];
    if (params.length !== 1 || params[0].type?.type !== "reference") continue;
    // `Readonly<DialProps<Unit>>` is drawn from DialProps.
    const type = params[0].type.name === "Readonly" && params[0].type.typeArguments?.[0]?.type === "reference" ? params[0].type.typeArguments[0] : params[0].type;
    const props = project.getChildByName(type.name);
    const usable = props?.kind === ReflectionKind.Interface || (props?.kind === ReflectionKind.TypeAlias && aliasParts(props).length > 0);
    if (usable && !found.includes(props)) found.push(props);
  }
  return found;
}

/** The first of {@link propsListOf}. */
export const propsOf = (reflection, project) => propsListOf(reflection, project)[0];

/**
 * The object types a type alias is built of: each arm of an intersection, an
 * exported interface by its members and an object literal by its own. A
 * union of object types is one part whose arms are alternatives. A part the
 * package does not export has no members to read, so it is named instead.
 */
function aliasParts(alias) {
  const arms = alias.type?.type === "intersection" ? alias.type.types : [alias.type];
  const parts = [];
  for (const arm of arms) {
    if (arm?.type === "reflection" && arm.declaration.children?.length) parts.push({ members: arm.declaration.children });
    else if (arm?.type === "reference" && arm.reflection?.kind === ReflectionKind.Interface) parts.push({ members: ownMembers(arm.reflection).own, from: arm.reflection });
    else if (arm?.type === "reference") parts.push({ unread: arm.name });
    else if (arm?.type === "union" && arm.types.every((t) => t.type === "reflection")) {
      parts.push({ choices: arm.types.map((t) => (t.declaration.children ?? []).filter((c) => String(c.type) !== "never")) });
    }
  }
  return parts.some((part) => !part.unread) ? parts : [];
}

/** The props table of a type alias built of object types, with what it cannot list said in words. */
function aliasPropsMd(alias, index) {
  const parts = aliasParts(alias);
  if (parts.length === 0) return "";
  const members = parts.flatMap((part) => part.members ?? part.choices?.flat() ?? []);
  const unique = [...new Map(members.map((m) => [m.name, m])).values()];
  const notes = [];
  for (const part of parts) {
    if (part.unread) notes.push(`It also takes every prop of ${code(part.unread)}, which the package does not export.`);
    if (part.choices) {
      const sets = part.choices.map((arm) => arm.map((m) => code(m.name)).join(" and "));
      notes.push(`Pass exactly one of ${sets.join(" or ")}.`);
    }
  }
  return [memberTable(unique, index), ...notes].filter(Boolean).join("\n\n");
}

/**
 * A constant made by `Object.assign(Root, { Part, ... })`: a component with
 * sub-components as its properties. Its type is `typeof Root & { ... }`.
 */
function assignedRootOf(reflection) {
  if (reflection.kind !== ReflectionKind.Variable || reflection.type?.type !== "intersection") return undefined;
  const [root, parts] = reflection.type.types;
  return root?.type === "query" && parts?.type === "reflection" ? { root, parts: parts.type === "reflection" ? parts.declaration.children ?? [] : [] } : undefined;
}

/** A member's type in a declaration, a styled component's library generics read down to the element it renders. */
function shortTypeText(type) {
  const text = String(type);
  const element = styledElementOf(text);
  return element ? `StyledComponent<"${element.tag}">` : text;
}

/** The members of a styled component's own `$` props, read out of its inferred type. */
function styledProps(type, found = new Map(), depth = 0) {
  if (!type || depth > 8) return found;
  for (const child of type.declaration?.children ?? []) {
    if (child.name.startsWith("$") && !found.has(child.name)) found.set(child.name, child);
  }
  for (const next of [...(type.typeArguments ?? []), ...(type.types ?? [])]) styledProps(next, found, depth + 1);
  return found;
}

/**
 * The call signatures of a function, or of a constant declared with a function
 * type, such as `export const registerAugment = (def) => ...`.
 */
export function callSignatures(reflection) {
  if (reflection.kind === ReflectionKind.Function) return reflection.signatures ?? [];
  if (reflection.kind !== ReflectionKind.Variable) return [];
  return reflection.type?.type === "reflection" ? (reflection.type.declaration.signatures ?? []) : [];
}

/**
 * Whether a reflection is a React component: a styled or function component.
 * A constant that is not callable is one only when its type is a component
 * type (`ForwardRefExoticComponent`, a styled component), never a plain value.
 */
export function isComponent(reflection) {
  const signatures = callSignatures(reflection);
  if (reflection.kind === ReflectionKind.Variable && signatures.length === 0) return /Component|Styled/.test(String(reflection.type));
  return signatures.length > 0 && signatures.every((s) => /^(Element|ReactElement|ReactNode|ReactPortal)\b/.test(String(s.type)));
}

/** Whether a reflection is called like a function and is not a component. */
export function isFunction(reflection) {
  return callSignatures(reflection).length > 0 && !isComponent(reflection);
}

/** The comments of a symbol's signatures, each distinct one once. */
function distinctComments(signatures) {
  const seen = new Set();
  return signatures
    .map((s) => s.comment)
    .filter((c) => {
      if (!c) return false;
      const key = c.summary.map((p) => p.text).join("");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/**
 * One symbol's section. `level` is its heading's; `title: false` leaves the
 * heading off, for the symbol a page is named after, whose sections then sit
 * at `level`.
 */
export function symbolMd(reflection, project, index, { level = 3, title = true, omitRemarks = false } = {}) {
  const out = [];
  const inner = title ? level + 1 : level;
  const h = (n) => "#".repeat(n);
  if (title) out.push(`${h(level)} ${reflection.name} {#${reflection.name}}`);

  if (callSignatures(reflection).length > 0) {
    const props = propsListOf(reflection, project);
    const signatures = callSignatures(reflection);
    // A constant's doc comment sits on the constant, not on its signature.
    const comments = distinctComments(signatures);
    if (comments.length === 0 && reflection.comment) comments.push(reflection.comment);
    const text = signatures.map((s) => signatureText(reflection.name, s)).join("\n");
    out.push(`\`\`\`ts\n${text}\n\`\`\``);
    out.push(...comments.map((c) => summaryMd(c, index, inner, { omitRemarks })));
    out.push(...comments.map((c) => returnsMd(c, index)));
    out.push(crossLinksMd(comments, reflection.name));
    out.push(typeParamsMd(signatures[0]?.typeParameters, index));
    if (props.length > 0) {
      for (const one of props) {
        const table = one.kind === ReflectionKind.TypeAlias ? aliasPropsMd(one, index) : propertiesMd(one, index);
        out.push(`${h(inner)} ${props.length > 1 ? `Props: ${one.name}` : "Props"} {#${one.name}}`, table);
      }
    } else {
      out.push(parametersMd(signatures[0], index, inner));
    }
    out.push(...comments.map((c) => examplesMd(c, index, inner)));
  } else if (reflection.kind === ReflectionKind.Interface || reflection.kind === ReflectionKind.Class) {
    out.push(`\`\`\`ts\n${interfaceText(reflection)}\n\`\`\``);
    out.push(summaryMd(reflection.comment, index, inner, { omitRemarks }));
    out.push(crossLinksMd([reflection.comment], reflection.name));
    out.push(typeParamsMd(reflection.typeParameters, index));
    out.push(propertiesMd(reflection, index));
    out.push(examplesMd(reflection.comment, index, inner));
  } else if (reflection.kind === ReflectionKind.Enum) {
    const members = reflection.children ?? [];
    const value = (m) => (m.type?.type === "literal" ? JSON.stringify(m.type.value) : String(m.defaultValue ?? ""));
    out.push(`\`\`\`ts\nenum ${reflection.name} {\n${members.map((m) => `  ${m.name} = ${value(m)},`).join("\n")}\n}\n\`\`\``);
    out.push(summaryMd(reflection.comment, index, inner, { omitRemarks }));
    out.push(crossLinksMd([reflection.comment], reflection.name));
    const rows = members.map((m) => `| ${memberName(m.name, memberAnchor(m))} | ${code(value(m))} | ${cellMd(m.comment?.summary, index)} |`);
    if (rows.length > 0) out.push(`| Member | Value | Description |\n| --- | --- | --- |\n${rows.join("\n")}`);
    out.push(examplesMd(reflection.comment, index, inner));
  } else if (reflection.kind === ReflectionKind.TypeAlias) {
    const params = typeParamsText(reflection.typeParameters);
    out.push(`\`\`\`ts\ntype ${reflection.name}${params} =${declarationText(reflection.type)};\n\`\`\``);
    out.push(summaryMd(reflection.comment, index, inner, { omitRemarks }));
    out.push(crossLinksMd([reflection.comment], reflection.name));
    out.push(typeParamsMd(reflection.typeParameters, index));
    if (reflection.type?.type === "intersection") out.push(aliasPropsMd(reflection, index));
    out.push(examplesMd(reflection.comment, index, inner));
  } else if (reflection.type?.type === "reflection" && reflection.type.declaration.children?.length) {
    // A constant object such as `CommandErrorCode`: its members are the values an author uses, so they are a table.
    const twin = typeTwinOf(reflection);
    const alias = twin ? `\ntype ${twin.name}${typeParamsText(twin.typeParameters)} =${declarationText(twin.type)};` : "";
    out.push(`\`\`\`ts\nconst ${reflection.name}: ${objectText(reflection.type.declaration)};${alias}\n\`\`\``);
    const summary = summaryMd(reflection.comment, index, inner, { omitRemarks });
    out.push(summary);
    out.push(crossLinksMd([reflection.comment, twin?.comment], reflection.name));
    const twinSummary = twin?.comment && summaryMd(twin.comment, index, inner, { omitRemarks });
    if (twinSummary && twinSummary !== summary) out.push(twinSummary);
    out.push(propertiesMd(reflection.type.declaration, index));
    out.push(examplesMd(reflection.comment, index, inner));
  } else {
    const declared = reflection.type?.toString() ?? "";
    const assigned = assignedRootOf(reflection);
    const element = assigned ? undefined : styledElementOf(declared);
    const own = element ? [...styledProps(reflection.type).values()] : [];
    if (assigned) {
      const parts = assigned.parts.map((part) => `  ${part.name}: ${shortTypeText(part.type)};`);
      out.push(`\`\`\`ts\nconst ${reflection.name}: ${assigned.root} & {\n${parts.join("\n")}\n};\n\`\`\``);
    } else if (element) {
      // A styled component's inferred type is hundreds of characters of library generics, and says nothing.
      const extra = own.length > 0 ? `, and the props below` : "";
      out.push(`Renders a ${code(`<${element.tag}>`)} and takes every prop the element does, as React's ${code(element.attributes)}${extra}.`);
    } else if (declared && declared.length <= 120) {
      out.push(`\`\`\`ts\nconst ${reflection.name}: ${declared};\n\`\`\``);
    } else if (reflection.type?.type === "typeOperator" && reflection.type.target?.type === "tuple") {
      // A long tuple reads as its entries, one per line.
      const entries = reflection.type.target.elements.map((e) => `  ${e},`).join("\n");
      out.push(`\`\`\`ts\nconst ${reflection.name}: ${reflection.type.operator} [\n${entries}\n];\n\`\`\``);
    }
    out.push(summaryMd(reflection.comment, index, inner, { omitRemarks }));
    out.push(crossLinksMd([reflection.comment], reflection.name));
    if (own.length > 0) out.push(memberTable(own, index));
    if (assigned) {
      const props = propsListOf(reflection, project)[0];
      if (props) out.push(`${h(inner)} Props {#${props.name}}`, propertiesMd(props, index));
    }
    out.push(examplesMd(reflection.comment, index, inner));
  }
  return out.filter(Boolean).join("\n\n");
}

/**
 * What a category's page is for, as Markdown: TypeDoc's `@categoryDescription`
 * for the category, written either in the entry point's module comment or on
 * any one symbol in the category, its first line naming the category as
 * TypeDoc reads it. Empty when nothing describes the category; an error when
 * more than one thing does.
 */
export function categoryDescriptionMd(project, name, index) {
  const sources = [];
  const native = (project.categories ?? []).find((c) => c.title === name)?.description;
  if (native?.length) sources.push({ from: "the module comment", parts: native });
  const category = (project.categories ?? []).find((c) => c.title === name);
  for (const member of category?.children ?? []) {
    for (const comment of [member.comment, ...callSignatures(member).map((s) => s.comment)]) {
      for (const tag of comment?.blockTags ?? []) {
        if (tag.tag !== "@categoryDescription") continue;
        const described = namedTag(tag);
        if (described.name !== name) {
          throw new Error(`${member.name} carries @categoryDescription ${described.name}, but sits in @category ${name}`);
        }
        sources.push({ from: member.name, parts: described.parts });
      }
    }
  }
  // A function's comment reaches TypeDoc on the function and on its signature, so one tag can be read twice.
  const distinct = [...new Map(sources.map((s) => [partsMd(s.parts, index).trim(), s])).entries()];
  if (distinct.length > 1) {
    throw new Error(`@category ${name} is described ${distinct.length} times (${distinct.map(([, s]) => s.from).join(", ")}): keep one`);
  }
  return distinct[0]?.[0] ?? "";
}

const ELEMENT_TAGS = { Div: "div", Span: "span", Button: "button", Input: "input", Label: "label", Select: "select", TextArea: "textarea", Paragraph: "p", Anchor: "a", Form: "form" };

/**
 * The element a styled component renders and the attribute type its props
 * are, read off its inferred type: `IStyledComponentBase<"web", ...
 * ButtonHTMLAttributes<HTMLButtonElement> ...>` renders a `<button>`.
 */
function styledElementOf(declared) {
  if (!declared.includes("IStyledComponentBase")) return undefined;
  const match = /(\w*HTMLAttributes)<HTML(\w*)Element>/.exec(declared);
  const tag = match && ELEMENT_TAGS[match[2]];
  return tag ? { tag, attributes: `${match[1]}<HTML${match[2]}Element>` } : undefined;
}

/** Every top-level reflection carrying `@category <name>`, a constant and its same-named type counted once, as the constant. */
export function categoryMembers(project, name) {
  const category = (project.categories ?? []).find((c) => c.title === name);
  if (!category) throw new Error(`no symbol in ${project.name} carries @category ${name}`);
  return category.children.filter((m) => !(m.kind === ReflectionKind.TypeAlias && constTwinOf(m)));
}

const sameName = (reflection, kind) =>
  (reflection.parent?.children ?? []).find((c) => c !== reflection && c.name === reflection.name && c.kind === kind);

/** The type alias declared under a constant's own name, which the constant's entry documents with it. */
const typeTwinOf = (constant) => sameName(constant, ReflectionKind.TypeAlias);

/** The constant a type alias shares its name with, under whose entry the alias is documented. */
const constTwinOf = (alias) => sameName(alias, ReflectionKind.Variable);

/**
 * A category's symbols in reading order: the lead, then what the lead's own doc
 * links to in the order it does, then the remaining functions and the remaining
 * types, each in source order.
 */
export function readingOrder(members, lead) {
  const linkedFromLead = [];
  for (const comment of [lead.comment, ...(lead.signatures ?? []).map((s) => s.comment)]) {
    for (const part of comment?.summary ?? []) {
      const target = part.kind === "inline-tag" && typeof part.target === "object" ? part.target : undefined;
      if (target && members.includes(target) && target !== lead && !linkedFromLead.includes(target)) {
        linkedFromLead.push(target);
      }
    }
  }
  const rest = members.filter((m) => m !== lead && !linkedFromLead.includes(m));
  const fn = (m) => callSignatures(m).length > 0;
  return [lead, ...linkedFromLead, ...rest.filter(fn), ...rest.filter((m) => !fn(m))];
}

export { escapeText, code };
