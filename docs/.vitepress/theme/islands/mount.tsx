import { type ComponentType, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { StyleSheetManager } from "styled-components";
import { APP_STYLESHEET, type ComponentDemo, DEMOS, type StoryDemo, type WidgetDemo } from "./demos";

/**
 * The app's stylesheet rewritten for a shadow root: what it sets on `:root`,
 * `html` and `body` lands on the host, which starts from no inherited styles,
 * so the example looks as the app does and nothing leaks out to the page.
 */
function forShadowRoot(css: string): string {
  const scoped = css
    .replace(/:root\b/g, ":host")
    .replace(/(^|[\s,}])(html|body)(?=\s*[,{])/g, "$1:host");
  return `:host { all: initial; display: block; }\n${scoped}`;
}

interface StreamBlock {
  emits: { channel: string; value: unknown }[];
}

/** The scene's fixture with each fed Topic's value taken from the example file that exports it. */
async function sceneFixture(demo: WidgetDemo): Promise<Record<string, unknown>> {
  const fixture = (await demo.fixture()).default;
  const feeds = Object.entries(demo.feeds ?? {});
  if (feeds.length === 0) return fixture;
  const stream = fixture._stream as StreamBlock;
  const fed = await Promise.all(
    feeds.map(async ([channel, feed]) => {
      const value = (await feed.load())[feed.name];
      if (value === undefined) throw new Error(`the example file exports no ${feed.name}`);
      // A copy, because the stream turns a payload's numbers into quantities in place.
      return { channel, value: structuredClone(value) };
    }),
  );
  const unfed = stream.emits.filter((e) => !fed.some((f) => f.channel === e.channel));
  return { ...fixture, _stream: { ...stream, emits: [...fed, ...unfed] } };
}

/** A widget on its scene, after the example file has registered its extension. */
async function widgetTree(demo: WidgetDemo, wrap: (tree: ReactNode) => ReactNode): Promise<ReactNode> {
  await demo.register?.();
  const [{ WidgetScene }, fixture] = await Promise.all([
    import("@gonogo-storybook/src/WidgetScene"),
    sceneFixture(demo),
  ]);
  return createElement(WidgetScene, {
    widgetId: demo.widget,
    fixture,
    w: demo.w,
    h: demo.h,
    wrap,
  });
}

/** The component an example file exports, inside a stream when it reads telemetry. */
async function componentTree(demo: ComponentDemo): Promise<ReactNode> {
  const module = await demo.load();
  const Example = module[demo.name] as ComponentType | undefined;
  if (!Example) throw new Error(`the example file exports no ${demo.name}`);
  if (!demo.stream) return createElement(Example);
  const [{ FixtureStream }, stream] = await Promise.all([
    import("@gonogo-storybook/src/FixtureStream"),
    demo.stream(),
  ]);
  const { subscribed, emits } = stream.default;
  return createElement(FixtureStream, { subscribed, emits }, createElement(Example));
}

interface StoryShape {
  component?: ComponentType<Record<string, unknown>>;
  args?: Record<string, unknown>;
}

/**
 * A story's component with its args, the way Storybook renders a story that
 * has no `render` of its own. The frame decorator is left out, since every
 * demo is already mounted in the frame.
 */
async function storyTree(demo: StoryDemo, wrap: (tree: ReactNode) => ReactNode): Promise<ReactNode> {
  const module = await demo.load();
  const meta = module.default as StoryShape;
  const story = module[demo.name] as (StoryShape & { render?: unknown }) | undefined;
  if (!story) throw new Error(`the stories file exports no ${demo.name}`);
  if (story.render) throw new Error(`${demo.name} has a render of its own, which a demo does not run`);
  const component = story.component ?? meta.component;
  if (!component) throw new Error(`${demo.name} names no component`);
  return createElement(component, { ...meta.args, ...story.args, wrap });
}

/** A mounted example: the element its render occupies, and how to take it down. */
export interface MountedDemo {
  content: HTMLElement;
  unmount: () => void;
}

/**
 * Renders the example registered under `id` into a shadow root on `element`,
 * in the app's theme, or returns undefined when no example is registered under
 * that id. The app's page background lands on `element` itself, so whatever
 * size the caller gives it is the app's surface.
 */
export async function mountDemo(id: string, element: HTMLElement): Promise<MountedDemo | undefined> {
  const demo = DEMOS[id];
  if (!demo) return undefined;
  // The host every example registers through, and every built-in widget, before any example file runs.
  await import("@gonogo-storybook/src/setup");
  const [{ GonogoFrame }, css] = await Promise.all([import("@gonogo-storybook/src/frame"), APP_STYLESHEET()]);
  const shadow = element.shadowRoot ?? element.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = forShadowRoot(css);
  const stage = document.createElement("div");
  shadow.replaceChildren(style, stage);
  const styled = (tree: ReactNode) => createElement(StyleSheetManager, { target: shadow }, tree);
  const body =
    demo.kind === "widget"
      ? await widgetTree(demo, styled)
      : demo.kind === "story"
        ? await storyTree(demo, styled)
        : await componentTree(demo);
  const root = createRoot(stage);
  root.render(styled(createElement(GonogoFrame, null, body)));
  return { content: stage, unmount: () => root.unmount() };
}
