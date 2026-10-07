/**
 * Writes the generated reference pages from the installed artifacts.
 *
 *   node scripts/reference/generate.mjs              # install the artifacts, then write
 *   node scripts/reference/generate.mjs --no-install # reuse .reference/ as it is
 *
 * The pages are build output: never committed, never edited. Change a page by
 * changing the doc comment it is generated from, the guide source under
 * `reference/guides/` for a guide's own prose, or the page's module under
 * `reference/pages/` for what shares a page.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { ReflectionKind } from "typedoc";
import { PAGES } from "../../reference/pages.mjs";
import { cliPageMd } from "./cli.mjs";
import { contractCategory, contractCategoryDescription, contractMd, contractSummary, isContractType, runXmldocmd } from "./csharp.mjs";
import { commandListMd, packageIndexMd, referenceIndexMd, SECTIONS, sectionOf, topicListMd, topicsPageMd } from "./indexes.mjs";
import { installArtifacts } from "./install.mjs";
import { DOCS, GENERATED_HASHES, hashOf, PLANTED_DEMO_FILE, PLANTED_DEMOS, PUBLISHED, ROOT, storybookRoot } from "./paths.mjs";
import { AMBIGUOUS_SYMBOLS } from "../ambiguous-symbols.mjs";
import { UNRESOLVED_LINK_DEBT } from "../symbol-link-debt.mjs";
import { anchorOf, assertModulesStateNoRecordFacts, loadWidgetRecords, recordOf, widgetHeaderMd } from "./widgets.mjs";
import { SYMBOL_INDEX } from "../symbol-links.mjs";
import {
  categoryDescriptionMd,
  categoryMembers,
  cellSafe,
  code,
  exported,
  isComponent,
  isFunction,
  loadPackage,
  partsMd,
  propsOf,
  readingOrder,
  remarksMd,
  SymbolIndex,
  symbolMd,
  typeMd,
} from "./typescript.mjs";

/**
 * Marks a page as generated, for the symbol check and for anyone opening the
 * file, and puts each page's second and third heading levels in its outline.
 */
const frontmatter = (page) =>
  `---\ngenerated: npm run reference\noutline: [2, 3]\n${hasExamples(page) ? "pageClass: has-examples\n" : ""}---\n`;

const htmlEscape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * VitePress compiles a page as a Vue template, and Vue reads `{{` in inline
 * code as an interpolation. Fenced blocks are marked `v-pre` already; an
 * inline code span holding `{{` becomes a `<code v-pre>` of its own.
 */
function vueSafe(md) {
  let fenced = false;
  return md
    .split("\n")
    .map((line) => {
      if (/^\s*```/.test(line)) fenced = !fenced;
      if (fenced || !line.includes("{{")) return line;
      return line.replace(/`([^`]*\{\{[^`]*)`/g, (_, inner) => `<code v-pre>${htmlEscape(inner)}</code>`);
    })
    .join("\n");
}

/** Whether a page shows live examples, which widen its column on a wide screen. */
const hasExamples = (page) => page.kind !== "contract" && (page.examples?.length > 0 || Object.keys(page.extensions ?? {}).length > 0);

const SDK = "@ksp-gonogo/sitrep-sdk";
const KIT = "@ksp-gonogo/ui-kit";
const TOOLS = "@ksp-gonogo/uplink-tools";

const urlOf = (page) => `/${page.path.replace(/(index)?\.md$/, "")}`;

/** The import specifier a category or guide page documents: its package, or the subpath its `entry` names. */
const specifierOf = (page) => (page.entry ? `${page.package}/${page.entry}` : page.package);

/** The version a page names for a package: what an author installs today, the same for every Gonogo package. */
const versionOf = () => PUBLISHED.version;

/**
 * One example: the render and the file that produces it, as one block. The
 * file is included by VitePress from `reference/examples/`, where the
 * examples gate typechecks it, so the code shown is the code rendered. With
 * `code: false` the block is the render alone. `label` says what the render
 * shows, for a reader who sees its screenshot or nothing.
 */
function demoMd(page, id, file, { code = true, label } = {}) {
  const described = label ? ` label="${htmlEscape(label).replace(/"/g, "&quot;")}"` : "";
  if (!file || !code) return `<Demo id="${id}"${described} />`;
  const from = relative(dirname(resolve(DOCS, page.path)), resolve(ROOT, file));
  return `<Demo id="${id}" file="${file.split("/").pop()}"${described}>\n\n<<< ${from}\n\n</Demo>`;
}

/** A scene's name: its fixture's file name, `eva-suit-low-o2`. */
const sceneName = (scene) => scene.fixture.split("/").pop().replace(/\.json$/, "");

/**
 * The examples at the top of a page: one titled section, or one per example
 * under it. A widget page's are the built-in widget itself, which an author
 * writes no code to get, so they are renders alone.
 */
function examplesMd(page, widgetName) {
  const examples = page.examples ?? [];
  if (examples.length === 0) return "";
  const label = (e) =>
    page.kind === "widget" ? `The ${widgetName} widget on the ${sceneName(e.scene ?? page.scene)} scene` : undefined;
  const one = (e) => demoMd(page, e.id, e.file, { code: page.kind !== "widget", label: label(e) });
  if (examples.length === 1) {
    const [e] = examples;
    return `## ${e.title ?? "Example"} {#example}\n\n${one(e)}`;
  }
  return ["## Examples {#examples}", ...examples.map((e) => `### ${e.title} {#${e.id}}\n\n${one(e)}`)].join("\n\n");
}

/** Every example the pages render, by id, with what it needs to mount. */
function demosOf(pages) {
  const demos = new Map();
  const stories = new Map();
  const add = ({ id, file, export: name, stream, scene, widget }) => {
    const demo = { id, file, export: name, stream, scene, widget };
    // A file that feeds the scene is shown, not registered.
    demo.feedsScene = Object.values(scene?.feeds ?? {}).some((feed) => feed.file === file);
    const known = demos.get(demo.id);
    if (known && JSON.stringify(known) !== JSON.stringify(demo)) {
      throw new Error(`two pages describe example ${demo.id} differently`);
    }
    demos.set(demo.id, demo);
  };
  for (const page of pages) {
    if (page.kind === "contract") continue;
    for (const e of page.examples ?? []) add({ ...e, scene: e.scene ?? page.scene, widget: e.widget ?? page.widget });
    for (const slot of Object.keys(page.extensions ?? {})) {
      const { file, config } = extensionOf(page, slot);
      add({ id: extensionDemoId(slot), file, scene: config ? { ...page.scene, config } : page.scene, widget: page.widget });
    }
    const { states, extensions } = storiesOf(page);
    for (const story of [...states, ...extensions.values()]) stories.set(story.id, story);
  }
  for (const demo of demos.values()) {
    const feeds = Object.values(demo.scene?.feeds ?? {}).map((feed) => feed.file);
    for (const path of [demo.file, demo.stream, demo.scene?.fixture, ...feeds].filter(Boolean)) {
      if (!existsSync(resolve(ROOT, path))) throw new Error(`example ${demo.id} names ${path}, which does not exist`);
    }
  }
  return { demos: [...demos.values()], stories: [...stories.values()] };
}

const extensionDemoId = (slot) => slot.replace(/\./g, "--");

/**
 * A slot's worked example: its file, and the widget config the example needs
 * to show its effect (a setting such as the projection System View draws in),
 * when the module gives `{ file, config }` rather than a file alone.
 */
function extensionOf(page, slot) {
  const entry = page.extensions?.[slot];
  if (entry === undefined) return {};
  return typeof entry === "string" ? { file: entry } : entry;
}

/**
 * Every story a generated stories file exports, by export name: the name
 * Storybook shows, the scene its fixture is (by file name), and the story's
 * own description (`parameters.docs.description.story`) where it has one.
 */
function storyExports(root, file) {
  const path = resolve(root, "dist/stories", file);
  if (!existsSync(path)) {
    throw new Error(`no ${file} under ${root}/dist/stories: run pnpm --filter @ksp-gonogo/storybook generate in the gonogo checkout`);
  }
  const source = readFileSync(path, "utf8");
  const imports = new Map([...source.matchAll(/^import (\w+) from "([^"]+)\.json";$/gm)].map(([, name, from]) => [name, from.split("/").pop()]));
  const blocks = source.matchAll(/^export const (\w+)(?::\s*\w+)? = \{\s*name: "([^"]+)"([\s\S]*?)^\};/gm);
  return new Map(
    [...blocks].map(([, name, shown, body]) => {
      const description = /description:\s*\{\s*story:\s*("(?:[^"\\]|\\.)*")/.exec(body)?.[1];
      const scene = imports.get(/fixture:\s*(\w+)/.exec(body)?.[1]);
      return [name, { shown, scene, description: description ? JSON.parse(description) : undefined }];
    }),
  );
}

/** A story's name as a heading: `eva-suit-low-o2` reads "Eva suit low o2". */
const storyTitle = (shown) => shown.charAt(0).toUpperCase() + shown.slice(1).replace(/-/g, " ");

/**
 * The stories a widget page shows: each of the widget's own as one of its
 * states, and for each slot the story that renders its scaffolding. None
 * without a Storybook checkout, like the other live examples.
 */
function storiesOf(page) {
  const root = storybookRoot();
  if (!page.stories || root === null) return { states: [], extensions: new Map() };
  // A widget with no stories file of its own shows no states; its slots' stories still render.
  const states = [...(page.stories.states ? storyExports(root, page.stories.states) : [])].map(([name, { shown, scene, description }]) => ({
    // A story name can hold spaces and " @ " (`pre-launch-mixed @ stock-career`); an id and an anchor cannot.
    id: `${page.widget}--${shown.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    story: page.stories.states,
    export: name,
    title: storyTitle(shown),
    scene,
    description,
  }));
  const extensions = new Map();
  for (const [slot, ref] of Object.entries(page.stories.extensions ?? {})) {
    const [file, name] = ref.split("#");
    if (!storyExports(root, file).has(name)) throw new Error(`${page.path} names story ${ref} for ${slot}, which ${file} does not export`);
    extensions.set(slot, { id: `${extensionDemoId(slot)}--story`, story: file, export: name });
  }
  return { states, extensions };
}

/**
 * The loaders the demo page mounts, one per example, written beside the
 * component that mounts them. Without a Storybook checkout the harness the
 * examples mount in is missing, so the table is empty and each example says so.
 */
function writeDemoLoaders() {
  const root = storybookRoot();
  const dir = resolve(DOCS, ".vitepress/theme/islands");
  const from = (path) => JSON.stringify(relative(dir, resolve(ROOT, path)));
  const { demos, stories } = root === null ? { demos: [], stories: [] } : demosOf(PAGES);
  const entries = demos.map((d) => {
    const fields = [];
    if (d.scene && (d.widget || !d.file)) {
      fields.push(
        `kind: "widget"`,
        `widget: ${JSON.stringify(d.widget)}`,
        `fixture: () => import(${from(d.scene.fixture)})`,
        `w: ${d.scene.w}`,
        `h: ${d.scene.h}`,
      );
      if (d.scene.config) fields.push(`config: ${JSON.stringify(d.scene.config)}`);
      const feeds = Object.entries(d.scene.feeds ?? {}).map(
        ([topic, feed]) => `${JSON.stringify(topic)}: { load: () => import(${from(feed.file)}), name: ${JSON.stringify(feed.export)} }`,
      );
      if (feeds.length > 0) fields.push(`feeds: { ${feeds.join(", ")} }`);
      if (d.file && !d.feedsScene) fields.push(`register: () => import(${from(d.file)})`);
    } else {
      fields.push(`kind: "component"`, `load: () => import(${from(d.file)})`, `name: ${JSON.stringify(d.export)}`);
      if (d.stream) fields.push(`stream: () => import(${from(d.stream)})`);
    }
    return `  ${JSON.stringify(d.id)}: {\n    ${fields.join(",\n    ")},\n  },`;
  });
  for (const story of stories) {
    const from = JSON.stringify(`@gonogo-storybook/dist/stories/${story.story}`);
    entries.push(`  ${JSON.stringify(story.id)}: { kind: "story", load: () => import(${from}), name: ${JSON.stringify(story.export)} },`);
  }
  if (root !== null) {
    for (const [id, name] of Object.entries(PLANTED_DEMOS)) {
      entries.push(`  ${JSON.stringify(id)}: { kind: "component", load: () => import(${from(PLANTED_DEMO_FILE)}), name: ${JSON.stringify(name)} },`);
    }
  }
  writeFileSync(
    resolve(dir, "demos.generated.ts"),
    `// Generated by npm run reference. Do not edit.\nimport type { Demo } from "./demos";\n\nexport const GENERATED: Record<string, Demo> = {\n${entries.join("\n")}\n};\n\n` +
      `export const GENERATED_STYLESHEET = async (): Promise<string> => ${
        root === null ? '""' : '(await import("@gonogo-app/global.css")).default'
      };\n`,
  );
  return root === null
    ? "no Storybook checkout, so no live examples"
    : `${demos.length} live examples and ${stories.length} stories, mounted through ${root}`;
}

/* ------------------------------------------------------------------ *
 * Page kinds.
 * ------------------------------------------------------------------ */

/** Symbols after the lead, grouped under a heading each: components, functions, types. */
function groupedMd(members, project, index) {
  const groups = [
    ["Components", members.filter(isComponent)],
    ["Functions", members.filter(isFunction)],
    ["Types", members.filter((m) => !isFunction(m) && !isComponent(m))],
  ];
  return groups
    .filter(([, list]) => list.length > 0)
    .flatMap(([heading, list]) => [`## ${heading} {#${heading.toLowerCase()}}`, ...list.map((m) => symbolMd(m, project, index))]);
}

/** The sdk's root project, which owns any symbol another package re-exports. Set once the projects load. */
let sdkProject;
/** Each package's root project, which owns any symbol one of its subpaths re-exports. Set once the projects load. */
const rootProjects = {};

/**
 * The symbols a category or guide page documents: its category's, less any
 * the sdk exports under the same name when the page is another package's, and
 * less any its package's root exports when the page is a subpath's. A symbol
 * exported twice is documented once, where an author first meets it.
 */
function pageMembers(page, project) {
  const members = categoryMembers(project, page.category);
  const elsewhere = [];
  if (page.package !== SDK) elsewhere.push(["the sdk", sdkProject]);
  if (page.entry) elsewhere.push([`${page.package}'s root`, rootProjects[page.package]]);
  const own = members.filter((m) => !elsewhere.some(([, other]) => other.getChildByName(m.name)));
  if (own.length === 0) {
    throw new Error(
      `every symbol in ${specifierOf(page)}'s @category ${page.category} is one ${elsewhere.map(([name]) => name).join(" or ")} exports, so its page there documents it: delete this module`,
    );
  }
  return own;
}

function categoryPage(page, project, index) {
  const members = pageMembers(page, project);
  const lead = members.find((m) => m.name === page.lead);
  if (!lead) throw new Error(`${page.lead} is not in @category ${page.category}`);
  // A component's props are rendered under the component, so they are not listed again as a type.
  const props = new Set(members.map((m) => propsOf(m, project)).filter(Boolean));
  const rest = readingOrder(members, lead).slice(1).filter((m) => !props.has(m));
  const leadIsTitle = page.title === lead.name;
  return [
    `# ${page.title}`,
    categoryDescriptionMd(project, page.category, index),
    `${code(specifierOf(page))} · ${versionOf(page.package)}`,
    examplesMd(page),
    symbolMd(lead, project, index, { title: !leadIsTitle, level: 2 }),
    ...groupedMd(rest, project, index),
  ];
}

/** A placeholder in a guide's source: a category symbol, its `@remarks` alone, or one of the page's examples. */
const PLACEHOLDER = /^<!-- (symbol|remarks|example): (\S+) -->$/gm;

/** Where a guide puts every category symbol its prose does not place, grouped as a category page groups them. */
const REST = /^<!-- rest -->$/m;

/**
 * A hand-written guide with the generated reference placed through it. A
 * symbol whose `@remarks` the guide places on their own is rendered without
 * them, so nothing is said twice. Without a `<!-- rest -->` placeholder the
 * guide must place every symbol in its category.
 */
function guidePage(page, project, index) {
  const source = readFileSync(resolve(ROOT, page.source), "utf8");
  const members = new Map(pageMembers(page, project).map((m) => [m.name, m]));
  const examples = new Map((page.examples ?? []).map((e) => [e.id, e]));
  const remarksPlaced = new Set([...source.matchAll(PLACEHOLDER)].filter(([, kind]) => kind === "remarks").map(([, , name]) => name));
  const placed = new Set();
  const body = source.replace(PLACEHOLDER, (_, kind, name) => {
    if (kind === "example") {
      const example = examples.get(name);
      if (!example) throw new Error(`${page.source} places example ${name}, which its page module does not list`);
      if (placed.has(`example:${name}`)) throw new Error(`${page.source} places example ${name} twice`);
      placed.add(`example:${name}`);
      return demoMd(page, example.id, example.file);
    }
    const member = members.get(name);
    if (!member) throw new Error(`${page.source} places ${name}, which is not in @category ${page.category}`);
    if (kind === "remarks") {
      const remarks = remarksMd(member, index);
      if (!remarks) throw new Error(`${page.source} places the remarks of ${name}, which has none`);
      return remarks;
    }
    if (placed.has(name)) throw new Error(`${page.source} places ${name} twice`);
    placed.add(name);
    return symbolMd(member, project, index, { level: 3, omitRemarks: remarksPlaced.has(name) });
  });
  const props = new Set([...members.values()].map((m) => propsOf(m, project)).filter(Boolean));
  const rest = [...members.values()].filter((m) => !placed.has(m.name) && !props.has(m));
  const restPlaced = REST.test(body);
  const placedBody = body.replace(REST, () => groupedMd(rest, project, index).join("\n\n"));
  const missing = restPlaced ? [] : rest.map((m) => m.name);
  missing.push(...[...examples.keys()].filter((id) => !placed.has(`example:${id}`)).map((id) => `example ${id}`));
  if (missing.length > 0) throw new Error(`${page.source} does not place ${missing.join(", ")}`);
  return [placedBody.trim()];
}

const withPrefix = (reflection, prefix) =>
  (reflection?.children ?? []).filter((c) => c.name.startsWith(`${prefix}.`));

/** The names a const tuple such as `FRAMEWORK_AUGMENT_SEGMENTS` holds. */
function tupleValues(reflection) {
  let type = reflection.type;
  if (type?.type === "typeOperator") type = type.target;
  if (type?.type !== "tuple") throw new Error(`${reflection.name} is not a constant tuple`);
  return type.elements.map((e) => e.value);
}

/**
 * Every extension point of one widget: the slots its record declares, typed
 * and described by the registry that declares each, then the standard
 * segments every widget carries, read off the kit's own lists of what the
 * dashboard mounts for every widget. A slot the record names that its
 * registry does not declare, or one the registry declares under the widget's
 * prefix that the record does not name, is a mismatch to fix in gonogo.
 */
function extensionPoints(record, sdk, kit) {
  const points = [];
  const entryOf = (slot) => slot.type?.declaration?.children?.find((f) => f.name === "entry")?.type;
  const declared = [
    ["augment", record.augmentSlots, "SlotRegistry", (slot) => slot.type],
    ["contribution", record.contributionSlots, "ContributionRegistry", entryOf],
  ];
  for (const [kind, ids, registry, typeOf] of declared) {
    const members = sdk.getChildByName(registry)?.children ?? [];
    for (const id of ids) {
      const slot = members.find((m) => m.name === id);
      if (!slot) throw new Error(`the ${record.id} record names ${kind} slot ${id}, which ${registry} in ${SDK} does not declare`);
      points.push({ id, kind, standard: false, type: typeOf(slot), doc: slot.comment });
    }
    const unnamed = withPrefix(sdk.getChildByName(registry), record.id).filter((m) => !ids.includes(m.name));
    if (unnamed.length > 0) {
      throw new Error(`${registry} declares ${unnamed.map((m) => m.name).join(", ")}, which the ${record.id} record does not name as one of its ${kind} slots`);
    }
  }
  const standard = [
    ["FRAMEWORK_AUGMENT_SEGMENTS", "AugmentSegmentRegistry", kit, "augment"],
    ["FRAMEWORK_CONTRIBUTION_SEGMENTS", "ComponentSlotRegistry", sdk, "contribution"],
  ];
  for (const [list, registry, project, kind] of standard) {
    const segments = tupleValues(exported([kit], list, "the widget page lists its standard slots").reflection);
    const declared = exported([project], registry, "the widget page reads its standard slots").reflection;
    for (const segment of segments) {
      const member = declared.children?.find((c) => c.name === segment);
      if (!member) throw new Error(`${list} names ${segment}, which ${registry} does not declare`);
      // A widget that declares a standard segment as its own slot keeps its own description of it, where it wrote one.
      const own = points.find((p) => p.id === `${record.id}.${segment}`);
      if (own) {
        own.standard = true;
        if (!own.doc?.summary?.length) own.doc = member.comment;
        continue;
      }
      points.push({ id: `${record.id}.${segment}`, kind, standard: true, type: member.type, doc: member.comment });
    }
  }
  const bare = points.filter((p) => !p.doc?.summary?.length).map((p) => p.id);
  if (bare.length > 0) throw new Error(`${bare.join(", ")} ${bare.length === 1 ? "has" : "have"} no doc comment on ${SDK}'s registry key, so the ${record.id} page cannot describe ${bare.length === 1 ? "it" : "them"}`);
  return points;
}

/** The named types a widget's extension points pass or produce. */
function slotTypes(record, sdk, kit) {
  const names = new Set();
  for (const point of extensionPoints(record, sdk, kit)) {
    if (point.type?.type === "reference" && point.type.name !== "Record") names.add(point.type.name);
  }
  return [...names];
}

const noProps = (type) => type?.type === "reference" && type.name === "Record";

/** What an author writes to fill one extension point, and what it receives or returns. */
function howToMd(point, index) {
  const shape = noProps(point.type) ? null : typeMd(point.type, index);
  if (point.kind === "augment") {
    const receives = shape ? `Its component receives ${shape} as props.` : "Its component receives no props.";
    return `An augment: ${linkedName("AugmentDefinition", index)} with \`augments: "${point.id}"\`, registered with ${linkedName("registerAugment", index)}. ${receives}`;
  }
  return `A contribution: ${linkedName("ContributionDefinition", index)} with \`contributes: "${point.id}"\`, registered with your client handle's \`registerContribution\`. Its \`compute\` returns a list of ${shape}, or \`null\` for none.`;
}

function linkedName(name, index) {
  const url = index.url(name);
  if (!url) throw new Error(`${name} has no reference page, but the widget pages link to it`);
  return `[${code(name)}](${url})`;
}

/**
 * One widget: the facts its record carries, the widget alone and in each of
 * its Storybook states, then every extension point with its types, a worked
 * example and the story that renders its scaffolding.
 */
function widgetPage(page, record, sdk, kit, index) {
  const points = extensionPoints(record, sdk, kit);
  for (const slot of [...Object.keys(page.extensions ?? {}), ...Object.keys(page.stories?.extensions ?? {})]) {
    if (!points.some((p) => p.id === slot)) throw new Error(`${page.path} has an example for ${slot}, which is not a ${page.widget} slot`);
  }
  if (page.stories) {
    const unshown = points.filter((p) => !page.stories.extensions?.[p.id]).map((p) => p.id);
    if (unshown.length > 0) console.log(`${page.path}: no scaffolding story for ${unshown.join(", ")}`);
  }
  const cell = (text) => text.trim().replace(/\n+/g, " ").replace(/\|/g, "\\|");
  const rows = points.map((p) => {
    const shape = noProps(p.type) ? "none" : cellSafe(typeMd(p.type, index));
    return `| [${code(p.id)}](#${anchorOf(p.id)}) | ${p.kind} | ${p.standard ? "yes" : ""} | ${shape} | ${cell(partsMd(p.doc?.summary, index))} |`;
  });
  const stories = storiesOf(page);
  const stateMd = (story) => {
    const label = story.scene ? `The ${record.name} widget on the ${story.scene} scene` : `The ${record.name} widget, ${story.title}`;
    return [`### ${story.title} {#${story.id}}`, story.description ?? "", demoMd(page, story.id, undefined, { label })].filter(Boolean).join("\n\n");
  };
  const states = stories.states.length === 0 ? [] : ["## States {#states}", ...stories.states.map(stateMd)];
  const out = [
    widgetHeaderMd(record),
    `${code(SDK)} ${versionOf(SDK)} · ${code(KIT)} ${versionOf(KIT)} · ${code(TOOLS)} ${versionOf(TOOLS)}`,
    examplesMd(page, record.name),
    ...states,
    "## Extension points {#extension-points}",
    `Every slot an Uplink can fill on the ${record.name} widget. Standard slots are on every widget. [Extensions](/guide/extensions) explains augments and contributions.`,
    `| Slot | Kind | Standard | Props or entry | Description |\n| --- | --- | --- | --- | --- |\n${rows.join("\n")}`,
  ];
  const shown = new Set();
  for (const point of points) {
    out.push(`### ${code(point.id)} {#${anchorOf(point.id)}}`, partsMd(point.doc?.summary, index).trim(), howToMd(point, index));
    const { file } = extensionOf(page, point.id);
    if (file) {
      const label = `The ${record.name} widget with ${file.split("/").pop()} filling ${point.id}`;
      out.push(demoMd(page, extensionDemoId(point.id), file, { label }));
    }
    const story = stories.extensions.get(point.id);
    if (story) {
      out.push(`#### Where it renders {#${story.id}}`, demoMd(page, story.id, undefined, { label: `Where ${point.id} renders on the ${record.name} widget` }));
    }
    const name = point.type?.type === "reference" && !noProps(point.type) ? point.type.name : null;
    if (name && !shown.has(name)) {
      shown.add(name);
      const { reflection, project } = exported([sdk, kit], name, `the ${page.widget} page documents it`);
      out.push(symbolMd(reflection, project, index, { level: 4 }));
    }
  }
  return out;
}

/**
 * A contract page's types: those it names, or its `lead` then every other
 * type tagged with its `category`.
 */
function contractTypes(page) {
  if (page.types) return page.types;
  const tagged = contractCategory(page.category);
  if (!tagged.includes(page.lead)) throw new Error(`${page.lead} is not in <category>${page.category}</category>`);
  return [page.lead, ...tagged.filter((t) => t !== page.lead)];
}

function contractPage(page, index) {
  const includes = Object.fromEntries(
    Object.entries(page.examples ?? {}).map(([type, include]) => {
      const [path, region] = include.split("#");
      const from = relative(dirname(resolve(DOCS, page.path)), resolve(ROOT, path));
      return [type, `<<< ${from}#${region}{cs}`];
    }),
  );
  const types = contractTypes(page);
  const body = contractMd(types, includes, index);
  // The title stands for the lead type, which the page's own links point at, so it carries that type's anchor.
  const anchor = page.lead ?? (types.includes(page.title) ? page.title : undefined);
  const title = anchor ? `# ${page.title} {#${anchor}}` : `# ${page.title}`;
  const description = page.category ? contractCategoryDescription(page.category, index) : "";
  return [title, description, `${code("Sitrep.Contract")} · ${code("KspGonogo.Sitrep.Contract")} ${versionOf()}`, body];
}

const SIDEBAR = resolve(DOCS, ".vitepress/sidebar.generated.json");

/** The lists a guide page includes with `<!--@include: @/.vitepress/includes/topics.md-->`. */
const INCLUDES = {
  topics: resolve(DOCS, ".vitepress/includes/topics.md"),
  commands: resolve(DOCS, ".vitepress/includes/commands.md"),
};

/**
 * Every generated reference page's sidebar entry, by the section it sits in
 * (`reference/client`, `reference/widgets` ...), in name order. A widget
 * page is named by its record; any other by its module's `title`. The guide
 * pages are placed in the guide sidebar by hand.
 */
function writeSidebar(pages, records) {
  const sections = {};
  for (const page of pages) {
    if (!page.path.startsWith("reference/")) continue;
    const text = page.kind === "widget" ? recordOf(records, page).name : page.title;
    // The reference index heads the whole reference, so it sits in no section.
    if (!SECTIONS.some((s) => s.dir === sectionOf(page))) continue;
    // A section's index page is marked and sorted first.
    const entry = page.kind === "index" ? { text: "Overview", link: urlOf(page), index: true } : { text, link: urlOf(page) };
    (sections[sectionOf(page)] ??= []).push(entry);
  }
  for (const items of Object.values(sections)) items.sort((a, b) => Boolean(b.index) - Boolean(a.index) || a.text.localeCompare(b.text));
  writeFileSync(SIDEBAR, `${JSON.stringify(sections, null, 2)}\n`);
}

/**
 * Keeps what the generator writes under `docs/` out of git: a `.gitignore`
 * there naming each generated file and itself. Git reads an untracked
 * `.gitignore`, so a new page needs no edit to a shared ignore list. Each
 * page's hash is recorded too, so `check-reference-pages.mjs` can tell a page
 * edited by hand from the one written here.
 */
function recordWritten(written) {
  writeFileSync(GENERATED_HASHES, `${JSON.stringify(Object.fromEntries(written.map((file) => [file, hashOf(resolve(ROOT, file))])), null, 2)}\n`);
  const files = [
    ...written.map((file) => resolve(ROOT, file)),
    resolve(DOCS, ".vitepress/theme/islands/demos.generated.ts"),
    SIDEBAR,
    ...Object.values(INCLUDES),
  ];
  const lines = files.map((file) => `/${relative(DOCS, file)}`).sort();
  writeFileSync(resolve(DOCS, ".gitignore"), `# Written by npm run reference.\n/.gitignore\n${lines.join("\n")}\n`);
}

/**
 * Fails on an entry in the ambiguous list that no longer needs to be there:
 * a name with no reference entry, or one no member, parameter or type
 * parameter in the published packages shares.
 */
function assertStillAmbiguous(projects, index) {
  const shared = new Set();
  const kinds = ReflectionKind.Property | ReflectionKind.Method | ReflectionKind.Accessor | ReflectionKind.Parameter |
    ReflectionKind.TypeParameter | ReflectionKind.EnumMember;
  for (const project of projects) {
    for (const reflection of Object.values(project.reflections)) if (reflection.kindOf(kinds)) shared.add(reflection.name);
  }
  for (const [name, reason] of Object.entries(AMBIGUOUS_SYMBOLS)) {
    if (!reason) throw new Error(`scripts/ambiguous-symbols.mjs lists ${name} with no reason`);
    if (!index.url(name)) throw new Error(`scripts/ambiguous-symbols.mjs lists ${name}, which has no reference entry. Delete the entry.`);
    if (!shared.has(name)) throw new Error(`scripts/ambiguous-symbols.mjs lists ${name}, which no member, parameter or type parameter shares any more. Delete the entry.`);
  }
}

/* ------------------------------------------------------------------ *
 * Entry point.
 * ------------------------------------------------------------------ */

export async function generate({ install = true } = {}) {
  if (install) await installArtifacts();
  const projects = { [SDK]: await loadPackage(SDK), [KIT]: await loadPackage(KIT) };
  sdkProject = projects[SDK];
  for (const page of PAGES) {
    if (page.package && !projects[page.package]) projects[page.package] = await loadPackage(page.package);
    if (page.package && !projects[specifierOf(page)]) projects[specifierOf(page)] = await loadPackage(page.package, page.entry);
    if (page.package) rootProjects[page.package] = projects[page.package];
  }
  runXmldocmd();
  const widgetPages = PAGES.filter((page) => page.kind === "widget");
  assertModulesStateNoRecordFacts(widgetPages);
  const records = widgetPages.length > 0 ? loadWidgetRecords() : new Map();

  // Every symbol a page renders, registered before any page is written, so pages can link to each other.
  const index = new SymbolIndex();
  // The sdk's TypeScript mirrors carry the contract's type names, so a C# page links through its own index.
  const contractIndex = new SymbolIndex();
  /*
   * A symbol links to the first page that registers it. Category pages go first, so a type with a
   * category of its own (BadgeEntry, PlotEntry) links there; then widget pages, so a slot's own type
   * links beside its slot; and last the Widget slots page, which holds slot types until their widget has a page.
   */
  const stopgap = (p) => p.kind === "category" && p.category === "Widget slots";
  const indexOrder = [...PAGES.filter((p) => p.kind !== "widget" && !stopgap(p)), ...widgetPages, ...PAGES.filter(stopgap)];
  for (const page of indexOrder) {
    const url = urlOf(page);
    if (page.kind === "category" || page.kind === "guide") {
      const project = projects[specifierOf(page)];
      for (const m of pageMembers(page, project)) {
        index.add(m.name, m.name === page.title ? url : `${url}#${m.name}`);
        const props = propsOf(m, project);
        if (props) index.add(props.name, `${url}#${props.name}`);
      }
    }
    if (page.kind === "contract") {
      for (const t of contractTypes(page)) {
        index.add(t, `${url}#${t}`);
        contractIndex.add(t, `${url}#${t}`);
      }
    }
    if (page.kind === "widget") {
      for (const t of slotTypes(recordOf(records, page), projects[SDK], projects[KIT])) index.add(t, `${url}#${t}`);
    }
  }
  writeFileSync(SYMBOL_INDEX, `${JSON.stringify(index, null, 2)}\n`);
  assertStillAmbiguous(Object.values(projects), index);

  /** A category page's description of its category, from the package's own doc comments. */
  const describedOf = (page) => {
    if (page.kind === "contract") return page.category ? contractCategoryDescription(page.category, contractIndex) : "";
    if (page.kind !== "category" && page.kind !== "guide") return "";
    return categoryDescriptionMd(projects[specifierOf(page)], page.category, index);
  };
  /**
   * What a page is for: its category's description, else its lead symbol's or contract type's summary,
   * or a widget's record description.
   */
  const leadOf = (page) => {
    if (page.kind === "widget") return recordOf(records, page).description;
    const described = describedOf(page);
    if (described) return described;
    if (page.kind === "contract") return contractSummary(contractTypes(page)[0], contractIndex);
    const lead = page.lead && projects[specifierOf(page)]?.getChildByName(page.lead);
    const comment = lead && (lead.comment ?? lead.signatures?.[0]?.comment);
    return comment ? partsMd(comment.summary, index).trim() : "";
  };
  const listing = {
    pages: PAGES,
    projects,
    index,
    urlOf,
    specifierOf,
    version: versionOf,
    leadOf,
    title: (page) => (page.kind === "widget" ? recordOf(records, page).name : page.title),
    sdk: projects[SDK],
  };

  const undescribed = PAGES.filter((p) => (p.kind === "category" || (p.kind === "contract" && p.category)) && !describedOf(p));
  const written = [];
  for (const page of PAGES) {
    let sections;
    if (page.kind === "index") {
      sections = SECTIONS.some((s) => s.dir === sectionOf(page)) ? packageIndexMd(page, listing) : referenceIndexMd(page, listing);
    } else if (page.kind === "topics") sections = topicsPageMd(page, listing);
    else if (page.kind === "cli") sections = cliPageMd(page, listing);
    else if (page.kind === "category") sections = categoryPage(page, projects[specifierOf(page)], index);
    else if (page.kind === "guide") sections = guidePage(page, projects[specifierOf(page)], index);
    else if (page.kind === "widget") sections = widgetPage(page, recordOf(records, page), projects[SDK], projects[KIT], index);
    else sections = contractPage(page, contractIndex);
    const file = resolve(DOCS, page.path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, `${frontmatter(page)}\n${vueSafe(sections.filter(Boolean).join("\n\n"))}\n`);
    written.push(relative(ROOT, file));
  }
  mkdirSync(dirname(INCLUDES.topics), { recursive: true });
  writeFileSync(INCLUDES.topics, `${topicListMd(projects[SDK], index, 3)}\n`);
  writeFileSync(INCLUDES.commands, `${commandListMd(projects[SDK], index, 3)}\n`);
  writeSidebar(PAGES, records);
  recordWritten(written);
  const debt = new Set(UNRESOLVED_LINK_DEBT);
  const unresolved = index.missed.filter((name) => !debt.has(name));
  if (unresolved.length > 0) {
    throw new Error(`a doc comment links to ${unresolved.join(", ")}, which has no reference entry. Give it a @category, or name it without {@link}.`);
  }
  const stale = [...debt].filter((name) => !index.missed.includes(name));
  if (stale.length > 0) throw new Error(`scripts/symbol-link-debt.mjs lists ${stale.join(", ")}, which now resolves. Delete the entry.`);
  console.log(`Generated ${written.length} reference pages:\n  ${written.join("\n  ")}`);
  console.log(`Wired ${writeDemoLoaders()}.`);
  console.log(`${undescribed.length} category pages open with no description of their category: ${undescribed.map((p) => p.path).join(", ")}`);
  return written;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await generate({ install: !process.argv.includes("--no-install") });
}
