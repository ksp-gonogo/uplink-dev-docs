/**
 * The widget record: what a widget's registration says about it, as
 * `@ksp-gonogo/uplink-tools` publishes it in `widgets.json`. The same record
 * writes each widget's section of an Uplink README, so a widget page takes
 * every fact the record carries from it, and its page module states none.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { INSTALL } from "./paths.mjs";

export const WIDGET_RECORDS = "@ksp-gonogo/uplink-tools/widgets.json";

/** Every core widget's record by id, read from the installed uplink-tools through its export map. */
export async function loadWidgetRecords() {
  const require = createRequire(resolve(INSTALL, "package.json"));
  let path;
  try {
    path = require.resolve(WIDGET_RECORDS);
  } catch {
    throw new Error(`${WIDGET_RECORDS} is not installed: add @ksp-gonogo/uplink-tools to reference/artifacts.json and pack it`);
  }
  facts = await import(pathToFileURL(path.replace(/widgets\.json$/, "widget-facts.js")).href);
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

/**
 * The fact rows `@ksp-gonogo/uplink-tools` writes an Uplink README's widget
 * section from, read off the installed package by `loadWidgetRecords`.
 */
let facts = null;

const text = (s) => s.replace(/([<>])/g, "\\$1");

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

/** The `ComponentDefinition` member that fills each fact, where there is one. */
const MEMBER_OF_FACT = { reads: "channels", drawsOnly: "fields", alsoReads: "optionalChannels", actions: "actions", needs: "requires" };

/** A header row's label, linked to the `ComponentDefinition` member that fills it. */
const definitionLink = (label, member) => `[${label}](/reference/client/registering#ComponentDefinition.${member})`;

/**
 * The top of a widget page: its name, its description and a table of every
 * fact the record carries. The rows are the package's own, the ones its README
 * writes, so this page can add links to them and never say them differently.
 * It takes the record alone, so `check-reference-pages.mjs` can write the same
 * text from the packed `widgets.json` and compare.
 */
export function widgetHeaderMd(record) {
  if (facts === null) throw new Error("widgetHeaderMd needs the installed widget-facts module: await loadWidgetRecords() first");
  const rows = facts.widgetFactsOf(record, { omitSlot: (slot) => standardSegmentsOf().has(slot.slice(record.id.length + 1)) }).map((fact) => {
    const label = MEMBER_OF_FACT[fact.id] ? definitionLink(fact.label, MEMBER_OF_FACT[fact.id]) : fact.label;
    const value =
      fact.id === "slots"
        ? fact.items.map(({ code }) => `[\`${code}\`](#${anchorOf(code)})`).join(", ")
        : facts.widgetFactValueMd(fact.items);
    return [label, value];
  });
  const table = ["| | |", "| --- | --- |", ...rows.map(([label, value]) => `| ${label} | ${value} |`)].join("\n");
  return [`# ${text(record.name)}`, text(record.description), table].join("\n\n");
}

/** Whether a generated widget page opens, after its frontmatter, with exactly the header its record writes. */
export function opensWithHeader(markdown, record) {
  const body = markdown.replace(/^---\n[\s\S]*?\n---\n/, "").trimStart();
  return body.startsWith(`${widgetHeaderMd(record)}\n\n`);
}
