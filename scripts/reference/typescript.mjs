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
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Application, ReflectionKind } from "typedoc";
import { INSTALL } from "./paths.mjs";

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

/** Display parts to Markdown, with every `{@link}` pointed at its page. */
export function partsMd(parts, index) {
  return (parts ?? [])
    .map((part) => {
      if (part.kind !== "inline-tag") return part.text;
      // A target TypeDoc could not resolve to a reflection is a symbol id with no name, so the tag's text names it.
      const target = typeof part.target?.kindOf === "function" ? part.target : undefined;
      const name = target?.name ?? part.text;
      const shown = part.text.trim() || name;
      // TypeDoc resolves a bare name to a sibling member first; a top-level export of that name is the one meant.
      const member = target && ownerOf(target) !== target;
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

/** The tags a page renders in its own place, rather than in the running text. */
const PLACED_TAGS = new Set(["@example", "@category", "@param", "@defaultValue", "@typeParam", "@returns"]);

function summaryMd(comment, index, level, { omitRemarks = false } = {}) {
  if (!comment) return "";
  const body = [partsMd(comment.summary, index).trim()];
  for (const tag of comment.blockTags) {
    if (PLACED_TAGS.has(tag.tag)) continue;
    if (omitRemarks && tag.tag === "@remarks") continue;
    const text = partsMd(tag.content, index).trim();
    if (tag.tag === "@remarks") body.push(text);
    else body.push(`**${tag.tag.slice(1)}:** ${text}`);
  }
  return demoteHeadings(body.filter(Boolean).join("\n\n"), level);
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
  return tag.content.map((p) => p.text).join("").trim().replace(/^```\w*\n?|\n?```$/g, "").replace(/^`|`$/g, "");
}

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
  const all = reflection.children ?? [];
  const own = all.filter((c) => !c.inheritedFrom || isOwn(c));
  return { own, dropped: all.length - own.length };
}

/** Inline Markdown made safe for a table cell: a pipe inside a code span would end the cell. */
export const cellSafe = (md) => md.replace(/`[^`]*`/g, (span) => span.replace(/(?<!\\)\|/g, "\\|"));

/** A properties table for an interface or an object-literal type. */
export function propertiesMd(reflection, index, { withDefaults = false } = {}) {
  const { own, dropped } = ownMembers(reflection);
  if (own.length === 0) return "";
  const rows = own.map((member) => {
    const optional = member.flags.isOptional ? "?" : "";
    const type = member.type
      ? cellSafe(typeMd(member.type, index))
      : member.signatures
        ? cellSafe(code(methodText(member.signatures[0])))
        : "";
    const cells = [`${code(member.name + optional)}`, type];
    if (withDefaults) cells.push(defaultOf(member) ? code(defaultOf(member)) : "");
    cells.push(cellMd(commentOf(member)?.summary, index));
    return `| ${cells.join(" | ")} |`;
  });
  const head = withDefaults
    ? "| Name | Type | Default | Description |\n| --- | --- | --- | --- |"
    : "| Name | Type | Description |\n| --- | --- | --- |";
  const rest = dropped > 0 ? "\n\nEvery other prop is passed to the element it renders, as React's `HTMLAttributes`." : "";
  return `${head}\n${rows.join("\n")}${rest}`;
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

/** The whole interface as it is declared, members typed, their docs left to the table. */
function interfaceText(reflection) {
  const { own, dropped } = ownMembers(reflection);
  const heritage = dropped > 0 ? " extends HTMLAttributes<HTMLElement>" : "";
  const lines = own.map((m) => {
    const optional = m.flags.isOptional ? "?" : "";
    const readonly = m.flags.isReadonly ? "readonly " : "";
    const type = m.type ? m.type.toString() : (m.signatures?.[0]?.toString() ?? "unknown");
    return `  ${readonly}${/^[A-Za-z_$][\w$]*$/.test(m.name) ? m.name : JSON.stringify(m.name)}${optional}: ${type};`;
  });
  return `interface ${reflection.name}${typeParamsText(reflection.typeParameters)}${heritage} {\n${lines.join("\n")}\n}`;
}

/** Each type parameter and what it stands for, from its `@typeParam`. */
function typeParamsMd(params, index) {
  const documented = (params ?? []).filter((p) => p.comment?.summary?.length);
  if (documented.length === 0) return "";
  const rows = documented.map((p) => `| ${code(p.name)} | ${cellMd(p.comment.summary, index)} |`);
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
    (p) => `| ${code(paramName(p))} | ${cellSafe(typeMd(p.type, index))} | ${cellMd(p.comment?.summary, index)} |`,
  );
  return `${"#".repeat(level)} Parameters\n\n| Name | Type | Description |\n| --- | --- | --- |\n${rows.join("\n")}`;
}

/** The props interface a component is drawn from, when there is exactly one. */
export function propsOf(reflection, project) {
  if (reflection.kind !== ReflectionKind.Function || !isComponent(reflection)) return undefined;
  const params = reflection.signatures?.[0]?.parameters ?? [];
  if (params.length !== 1 || params[0].type?.type !== "reference") return undefined;
  const props = project.getChildByName(params[0].type.name);
  return props?.kind === ReflectionKind.Interface ? props : undefined;
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
    const props = propsOf(reflection, project);
    const signatures = callSignatures(reflection);
    // A constant's doc comment sits on the constant, not on its signature.
    const comments = distinctComments(signatures);
    if (comments.length === 0 && reflection.comment) comments.push(reflection.comment);
    if (!props) {
      const text = signatures.map((s) => signatureText(reflection.name, s)).join("\n");
      out.push(`\`\`\`ts\n${text}\n\`\`\``);
    }
    out.push(...comments.map((c) => summaryMd(c, index, inner, { omitRemarks })));
    out.push(typeParamsMd(signatures[0]?.typeParameters, index));
    if (props) {
      out.push(`${h(inner)} Props {#${props.name}}`, propertiesMd(props, index, { withDefaults: true }));
    } else {
      out.push(parametersMd(signatures[0], index, inner));
    }
    out.push(...comments.map((c) => examplesMd(c, index, inner)));
  } else if (reflection.kind === ReflectionKind.Interface) {
    out.push(`\`\`\`ts\n${interfaceText(reflection)}\n\`\`\``);
    out.push(summaryMd(reflection.comment, index, inner, { omitRemarks }));
    out.push(typeParamsMd(reflection.typeParameters, index));
    out.push(propertiesMd(reflection, index));
    out.push(examplesMd(reflection.comment, index, inner));
  } else if (reflection.kind === ReflectionKind.TypeAlias) {
    const params = typeParamsText(reflection.typeParameters);
    out.push(`\`\`\`ts\ntype ${reflection.name}${params} =${declarationText(reflection.type)};\n\`\`\``);
    out.push(summaryMd(reflection.comment, index, inner, { omitRemarks }));
    out.push(typeParamsMd(reflection.typeParameters, index));
    out.push(examplesMd(reflection.comment, index, inner));
  } else if (reflection.type?.type === "reflection" && reflection.type.declaration.children?.length) {
    // A constant object such as `CommandErrorCode`: its members are the values an author uses, so they are a table.
    const twin = typeTwinOf(reflection);
    const alias = twin ? `\ntype ${twin.name}${typeParamsText(twin.typeParameters)} =${declarationText(twin.type)};` : "";
    out.push(`\`\`\`ts\nconst ${reflection.name}: { ... };${alias}\n\`\`\``);
    const summary = summaryMd(reflection.comment, index, inner, { omitRemarks });
    out.push(summary);
    const twinSummary = twin?.comment && summaryMd(twin.comment, index, inner, { omitRemarks });
    if (twinSummary && twinSummary !== summary) out.push(twinSummary);
    out.push(propertiesMd(reflection.type.declaration, index));
    out.push(examplesMd(reflection.comment, index, inner));
  } else {
    const declared = reflection.type?.toString() ?? "";
    // A styled component's inferred type is hundreds of characters of library generics, and says nothing.
    if (declared && declared.length <= 120) {
      out.push(`\`\`\`ts\nconst ${reflection.name}: ${declared};\n\`\`\``);
    }
    out.push(summaryMd(reflection.comment, index, inner, { omitRemarks }));
    out.push(examplesMd(reflection.comment, index, inner));
  }
  return out.filter(Boolean).join("\n\n");
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
