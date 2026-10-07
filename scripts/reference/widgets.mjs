/**
 * The widget record: what a widget's registration says about it, as
 * `@ksp-gonogo/uplink-tools` publishes it in `widgets.json`. The same record
 * writes each widget's section of an Uplink README, so a widget page takes
 * every fact the record carries from it, and its page module states none.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { INSTALL } from "./paths.mjs";

export const WIDGET_RECORDS = "@ksp-gonogo/uplink-tools/widgets.json";

/** Every core widget's record by id, read from the installed uplink-tools through its export map. */
export function loadWidgetRecords() {
  const require = createRequire(resolve(INSTALL, "package.json"));
  let path;
  try {
    path = require.resolve(WIDGET_RECORDS);
  } catch {
    throw new Error(`${WIDGET_RECORDS} is not installed: add @ksp-gonogo/uplink-tools to reference/artifacts.json and pack it`);
  }
  const { widgets } = require(path);
  return new Map(widgets.map((record) => [record.id, record]));
}

/** The record a widget page is written from. */
export function recordOf(records, page) {
  const record = records.get(page.widget);
  if (!record) throw new Error(`${page.path ?? "a widget page"} names widget ${page.widget}, which ${WIDGET_RECORDS} does not list`);
  return record;
}

/** What a widget page module may say: which widget, and how the page shows it. `path` is the loader's, from the module's own location. */
const PAGE_FIELDS = new Set(["kind", "widget", "scene", "examples", "extensions", "stories", "path"]);

/** Page-module fields that would restate the record, by the record field they restate. */
const RECORD_FACTS = {
  title: "name",
  name: "name",
  description: "description",
  id: "id",
  reads: "channels",
  channels: "channels",
  usesIfPresent: "optionalChannels",
  optionalChannels: "optionalChannels",
  dataRequirements: "dataRequirements",
  actions: "actions",
  slots: "augmentSlots and contributionSlots",
  augmentSlots: "augmentSlots",
  contributionSlots: "contributionSlots",
  requires: "requires",
  replaces: "replaces",
  defaultSize: "defaultSize",
};

/** Every field of a widget page module that it may not hold, each with why. Pure, so a planted module is graded the same way. */
export function moduleFaults(page) {
  return Object.keys(page)
    .filter((field) => !PAGE_FIELDS.has(field))
    .map((field) =>
      field in RECORD_FACTS
        ? `states \`${field}\`, which the widget record carries as \`${RECORD_FACTS[field]}\`: delete it from the module`
        : `has a field \`${field}\` a widget page does not take`,
    );
}

const PLANTED_MODULE = { kind: "widget", widget: "planted", title: "Planted", defaultSize: { w: 1, h: 1 }, colour: "red" };

/** Throws on any widget page module that states a record fact, after proving the rule sees one. */
export function assertModulesStateNoRecordFacts(pages) {
  const planted = moduleFaults(PLANTED_MODULE);
  if (planted.length !== 3) {
    throw new Error(`BLIND: the planted widget page module's three faults were not all seen (${planted.length} found), so a clean result would mean nothing`);
  }
  const faults = pages.flatMap((page) => moduleFaults(page).map((fault) => `reference/pages/${page.path.replace(/\.md$/, ".mjs")} ${fault}`));
  if (faults.length > 0) throw new Error(faults.join("\n"));
}

const text = (s) => s.replace(/([<>])/g, "\\$1");
const codeList = (items) => items.map((item) => `\`${item}\``).join(", ");

let standardSegments;

/**
 * The standard segments every widget carries, which a widget's record may name
 * again as its own: the kit's `FRAMEWORK_AUGMENT_SEGMENTS` and
 * `FRAMEWORK_CONTRIBUTION_SEGMENTS`, read off its installed declarations.
 */
function standardSegmentsOf() {
  if (standardSegments) return standardSegments;
  const declarations = readFileSync(resolve(INSTALL, "node_modules/@ksp-gonogo/ui-kit/dist/index.d.ts"), "utf8");
  const lists = [...declarations.matchAll(/declare const FRAMEWORK_(?:AUGMENT|CONTRIBUTION)_SEGMENTS: readonly \[([^\]]*)\]/g)];
  if (lists.length !== 2) throw new Error("the installed ui-kit does not declare both FRAMEWORK_*_SEGMENTS lists");
  standardSegments = new Set(lists.flatMap(([, list]) => [...list.matchAll(/"([^"]+)"/g)].map(([, segment]) => segment)));
  return standardSegments;
}

/**
 * The slots a widget declares as its own, as its record names them. A
 * standard segment its record also names is on every widget, so it is listed
 * with the standard slots on the page rather than here.
 */
export const slotsOf = (record) =>
  [...record.augmentSlots, ...record.contributionSlots].filter((slot) => !standardSegmentsOf().has(slot.slice(record.id.length + 1)));

/** A slot's anchor on its widget's page. */
export const anchorOf = (slot) => slot.replace(/\./g, "-");

/** A header row's label, linked to the `ComponentDefinition` member that fills it. */
const definitionLink = (label, member) => `[${label}](/reference/client/registering#ComponentDefinition.${member})`;

/** What each `ComponentRequirement` asks of the game, in the words its doc comment gives. */
const REQUIREMENT_WORDS = { flight: "a vessel in flight", career: "a career or science save" };

/**
 * The top of a widget page: its name, its description and a table of every
 * other fact the record carries, rows with nothing to say left out. It takes
 * the record alone, so `check-reference-pages.mjs` can write the same text
 * from the packed `widgets.json` and compare.
 */
export function widgetHeaderMd(record) {
  const flatKeys = record.channels.length === 0 && record.dataRequirements.length > 0;
  const slots = slotsOf(record);
  const rows = [
    ["Widget id", `\`${record.id}\``],
    flatKeys
      ? [definitionLink("Reads, as flat keys", "dataRequirements"), codeList(record.dataRequirements)]
      : [definitionLink("Reads", "channels"), codeList(record.channels)],
    [definitionLink("Draws only", "fields"), codeList(record.fields ?? [])],
    [definitionLink("Also reads, if published", "optionalChannels"), codeList(record.optionalChannels)],
    [
      definitionLink("Actions to bind", "actions"),
      record.actions.map((a) => `${text(a.label).replace(/\|/g, "\\|")} (\`${a.id}\`)`).join(", "),
    ],
    ["Slots", slots.map((slot) => `[\`${slot}\`](#${anchorOf(slot)})`).join(", ")],
    [definitionLink("Needs", "requires"), record.requires.map((need) => REQUIREMENT_WORDS[need] ?? `\`${need}\``).join(", ")],
    ["Replaces", record.replaces ? `\`${record.replaces}\`` : ""],
    ["Default size", record.defaultSize ? `${record.defaultSize.w} × ${record.defaultSize.h}` : ""],
  ].filter(([, value]) => value !== "");
  const table = ["| | |", "| --- | --- |", ...rows.map(([label, value]) => `| ${label} | ${value} |`)].join("\n");
  return [`# ${text(record.name)}`, text(record.description), table].join("\n\n");
}

/** Whether a generated widget page opens, after its frontmatter, with exactly the header its record writes. */
export function opensWithHeader(markdown, record) {
  const body = markdown.replace(/^---\n[\s\S]*?\n---\n/, "").trimStart();
  return body.startsWith(`${widgetHeaderMd(record)}\n\n`);
}
