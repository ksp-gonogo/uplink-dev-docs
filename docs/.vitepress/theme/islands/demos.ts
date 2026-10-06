import { GENERATED, GENERATED_STYLESHEET } from "./demos.generated";

/** A stream fixture for a component that reads telemetry: the Topics held subscribed and what is emitted onto them. */
export interface StreamFixture {
  subscribed: string[];
  emits: { topic: string; payload: unknown }[];
}

/** A Topic value an example file exports, emitted onto the scene's stream in place of the fixture's. */
export interface SceneFeed {
  load: () => Promise<Record<string, unknown>>;
  name: string;
}

/**
 * A registered widget on a fixture scene. With `register`, the example file is
 * loaded first, so the extension it registers is in place before the widget
 * mounts.
 */
export interface WidgetDemo {
  kind: "widget";
  widget: string;
  fixture: () => Promise<{ default: Record<string, unknown> }>;
  feeds?: Record<string, SceneFeed>;
  w: number;
  h: number;
  register?: () => Promise<unknown>;
}

/** A component an example file exports, fed a stream when it reads telemetry. */
export interface ComponentDemo {
  kind: "component";
  load: () => Promise<Record<string, unknown>>;
  name: string;
  stream?: () => Promise<{ default: StreamFixture }>;
}

/**
 * A story from the Storybook package's generated stories: its component
 * rendered with the meta's args under the story's own.
 */
export interface StoryDemo {
  kind: "story";
  load: () => Promise<Record<string, unknown>>;
  name: string;
}

export type Demo = WidgetDemo | ComponentDemo | StoryDemo;

/** Every example a page can mount, by the id its `<Demo>` names. */
export const DEMOS: Record<string, Demo> = GENERATED;

/** The stylesheet the app loads, as text for a demo to adopt. */
export const APP_STYLESHEET: () => Promise<string> = GENERATED_STYLESHEET;
