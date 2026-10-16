/**
 * An Uplink's spec sheet as the viewer reads it. The shape is the one
 * `uplink-tools` writes to `docs/spec.json`; this reader checks every field it
 * draws and keeps nothing else, so a file with more in it, or a value of the
 * wrong type, cannot reach the page as anything but text.
 */
export const SPEC_VERSION = 1;

export interface SpecField {
  name: string;
  unit?: string;
  shape?: string;
}

export interface SpecPayload {
  name: string;
  fields: SpecField[];
}

export interface SpecTopic {
  id: string;
  payload?: string;
  array: boolean;
  fields: SpecField[];
  delivery?: string;
  delay?: string;
}

export interface SpecCommand {
  id: string;
  args: string;
  result: string;
}

export interface SpecAction {
  id: string;
  label: string;
  description: string;
}

export interface SpecWidget {
  id: string;
  name: string;
  description: string;
  tags: string[];
  channels: string[];
  optionalChannels: string[];
  commands: string[];
  /** The Topics and fields the widget reads that are not declared as channels, as dotted paths. */
  dataRequirements: string[];
  /** What an input device can be bound to on the widget. */
  actions: SpecAction[];
  augmentSlots: string[];
  contributionSlots: string[];
  defaultSize: { w: number; h: number } | null;
  minSize: { w: number; h: number } | null;
}

export interface SpecAugment {
  id: string;
  augments: string;
  channels: string[];
  requires?: string;
}

export interface SpecContribution {
  id: string;
  contributes: string;
  deps: string[];
  requires?: string;
}

export interface SpecErrorCode {
  id: string;
  refines: string | null;
  sentence: string;
  meaning: string;
}

export interface Spec {
  uplink: {
    id: string;
    name: string;
    version: string;
    description: string;
    wraps: { name: string; builtAgainst?: string; tier?: string } | null;
  };
  topics: SpecTopic[];
  nestedPayloads: SpecPayload[];
  otherPayloads: SpecPayload[];
  commands: SpecCommand[];
  commandArgs: SpecPayload[];
  widgets: SpecWidget[];
  augments: SpecAugment[];
  contributions: SpecContribution[];
  models: { processors: string[]; forwardModels: string[]; derivedChannels: string[] };
  errorCodes: SpecErrorCode[];
}

type Json = Record<string, unknown>;

function obj(value: unknown, where: string): Json {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`${where} is not an object`);
  return value as Json;
}

function str(value: unknown, where: string): string {
  if (typeof value !== "string") throw new Error(`${where} is not text`);
  return value;
}

function optStr(value: unknown, where: string): string | undefined {
  return value === undefined || value === null ? undefined : str(value, where);
}

function bool(value: unknown, where: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${where} is not true or false`);
  return value;
}

function list<Item>(value: unknown, where: string, each: (item: unknown, at: string) => Item): Item[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`${where} is not a list`);
  return value.map((item, index) => each(item, `${where}[${index}]`));
}

function strings(value: unknown, where: string): string[] {
  return list(value, where, str);
}

function size(value: unknown, where: string): { w: number; h: number } | null {
  if (value === null || value === undefined) return null;
  const o = obj(value, where);
  if (typeof o.w !== "number" || typeof o.h !== "number") throw new Error(`${where} has no numeric w and h`);
  return { w: o.w, h: o.h };
}

function field(value: unknown, where: string): SpecField {
  const o = obj(value, where);
  return { name: str(o.name, `${where}.name`), unit: optStr(o.unit, `${where}.unit`), shape: optStr(o.shape, `${where}.shape`) };
}

function payload(value: unknown, where: string): SpecPayload {
  const o = obj(value, where);
  return { name: str(o.name, `${where}.name`), fields: list(o.fields, `${where}.fields`, field) };
}

/** Reads a parsed spec sheet, or throws a sentence saying what is wrong and where. */
export function readSpec(value: unknown): Spec {
  const root = obj(value, "the file");
  if (root.specVersion !== SPEC_VERSION) {
    throw new Error(
      `this spec sheet is version ${String(root.specVersion)}, and this page reads version ${SPEC_VERSION}`,
    );
  }
  const uplink = obj(root.uplink, "uplink");
  const wraps = uplink.wraps === null || uplink.wraps === undefined ? null : obj(uplink.wraps, "uplink.wraps");
  const models = obj(root.models ?? {}, "models");
  return {
    uplink: {
      id: str(uplink.id, "uplink.id"),
      name: str(uplink.name, "uplink.name"),
      version: str(uplink.version, "uplink.version"),
      description: str(uplink.description, "uplink.description"),
      wraps: wraps && {
        name: str(wraps.name, "uplink.wraps.name"),
        builtAgainst: optStr(wraps.builtAgainst, "uplink.wraps.builtAgainst"),
        tier: optStr(wraps.tier, "uplink.wraps.tier"),
      },
    },
    topics: list(root.topics, "topics", (item, at) => {
      const o = obj(item, at);
      const disposition = obj(o.disposition ?? {}, `${at}.disposition`);
      return {
        id: str(o.id, `${at}.id`),
        payload: optStr(o.payload, `${at}.payload`),
        array: bool(o.array, `${at}.array`),
        fields: list(o.fields, `${at}.fields`, field),
        delivery: optStr(disposition.delivery, `${at}.disposition.delivery`),
        delay: optStr(disposition.delay, `${at}.disposition.delay`),
      };
    }),
    nestedPayloads: list(root.nestedPayloads, "nestedPayloads", payload),
    otherPayloads: list(root.otherPayloads, "otherPayloads", payload),
    commands: list(root.commands, "commands", (item, at) => {
      const o = obj(item, at);
      return { id: str(o.id, `${at}.id`), args: str(o.args, `${at}.args`), result: str(o.result, `${at}.result`) };
    }),
    commandArgs: list(root.commandArgs, "commandArgs", payload),
    widgets: list(root.widgets, "widgets", (item, at) => {
      const o = obj(item, at);
      return {
        id: str(o.id, `${at}.id`),
        name: str(o.name, `${at}.name`),
        description: str(o.description, `${at}.description`),
        tags: strings(o.tags, `${at}.tags`),
        channels: strings(o.channels, `${at}.channels`),
        optionalChannels: strings(o.optionalChannels, `${at}.optionalChannels`),
        commands: strings(o.commands, `${at}.commands`),
        dataRequirements: strings(o.dataRequirements, `${at}.dataRequirements`),
        actions: list(o.actions, `${at}.actions`, (action, where) => {
          const a = obj(action, where);
          return { id: str(a.id, `${where}.id`), label: str(a.label, `${where}.label`), description: optStr(a.description, `${where}.description`) ?? "" };
        }),
        augmentSlots: strings(o.augmentSlots, `${at}.augmentSlots`),
        contributionSlots: strings(o.contributionSlots, `${at}.contributionSlots`),
        defaultSize: size(o.defaultSize, `${at}.defaultSize`),
        minSize: size(o.minSize, `${at}.minSize`),
      };
    }),
    augments: list(root.augments, "augments", (item, at) => {
      const o = obj(item, at);
      return {
        id: str(o.id, `${at}.id`),
        augments: str(o.augments, `${at}.augments`),
        channels: strings(o.channels, `${at}.channels`),
        requires: optStr(o.requires, `${at}.requires`),
      };
    }),
    contributions: list(root.contributions, "contributions", (item, at) => {
      const o = obj(item, at);
      return {
        id: str(o.id, `${at}.id`),
        contributes: str(o.contributes, `${at}.contributes`),
        deps: strings(o.deps, `${at}.deps`),
        requires: optStr(o.requires, `${at}.requires`),
      };
    }),
    models: {
      processors: strings(models.processors, "models.processors"),
      forwardModels: strings(models.forwardModels, "models.forwardModels"),
      derivedChannels: strings(models.derivedChannels, "models.derivedChannels"),
    },
    errorCodes: list(root.errorCodes, "errorCodes", (item, at) => {
      const o = obj(item, at);
      return {
        id: str(o.id, `${at}.id`),
        refines: optStr(o.refines, `${at}.refines`) ?? null,
        sentence: str(o.sentence, `${at}.sentence`),
        meaning: str(o.meaning, `${at}.meaning`),
      };
    }),
  };
}
