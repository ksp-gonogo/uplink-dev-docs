/**
 * The viewer's host for a loaded Uplink client. It is built by
 * `scripts/build-uplink-externals.mjs` in the same run as the modules a client
 * imports, so the registry it reads is the one the client registered into, and
 * the page imports it from `/uplink-externals/viewer-host.js` at run time.
 *
 * A widget is drawn against a stream that has delivered nothing, so it shows
 * the state it has before any sample arrives.
 */
import { type AnyDef, getComponents } from "@ksp-gonogo/sitrep-sdk/registry";
import { installRealTestHost, setupStreamFixture } from "@ksp-gonogo/sitrep-sdk/testing";
import { AugmentSlot, clearAugments, DefaultThemeProvider, getAugmentsForSlot, registerAugment } from "@ksp-gonogo/ui-kit";
import { gridToPixels } from "@ksp-gonogo/ui-kit/grid";
import tokens from "@ksp-gonogo/ui-kit/tokens.css";
import { createRoot } from "react-dom/client";
import { StyleSheetManager } from "styled-components";

let hostInstalled = false;

/** Installs the host the widgets call into, once for the page. */
export function installViewerHost(): void {
  if (hostInstalled) return;
  installRealTestHost({ AugmentSlot, clearAugments, getAugmentsForSlot, registerAugment });
  hostInstalled = true;
}

/** Every widget registered so far, by id. */
export function registeredWidgets(): AnyDef[] {
  return getComponents();
}

export interface WidgetSize {
  w: number;
  h: number;
}

/**
 * Draws one registered widget inside a shadow root under `container`, at the
 * size given in grid units, and returns the function that takes it down. The
 * shadow root keeps the kit's tokens and the widget's styles off the page.
 */
export function mountWidget(container: HTMLElement, def: AnyDef, size: WidgetSize): () => void {
  const shadow = container.shadowRoot ?? container.attachShadow({ mode: "open" });
  shadow.replaceChildren();
  const style = document.createElement("style");
  style.textContent = `:host { all: initial; display: block; }\n${tokens.replace(/:root\b/g, ":host")}`;
  const frame = document.createElement("div");
  const { pxW, pxH } = gridToPixels(size.w, size.h);
  frame.style.cssText = `width:${pxW}px;height:${pxH}px;max-width:100%;overflow:auto;background:var(--color-surface-app);color:var(--color-text-primary);font-family:var(--font-family-mono);`;
  shadow.append(style, frame);

  const stream = setupStreamFixture();
  const Widget = def.component;
  const root = createRoot(frame);
  root.render(
    <StyleSheetManager target={shadow as unknown as HTMLElement}>
      <DefaultThemeProvider>
        <stream.Provider>
          <Widget id={`viewer-${def.id}`} w={size.w} h={size.h} />
        </stream.Provider>
      </DefaultThemeProvider>
    </StyleSheetManager>,
  );
  return () => root.unmount();
}
