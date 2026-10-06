# Building the UI

`@ksp-gonogo/ui-kit` is the design system the built-in screens are made of. Use it to make your Uplink fit in with Gonogo.

The kit is presentational only. No primitive reads telemetry or dispatches a command; data comes in as props and interaction goes out as callbacks.

## Wrap the tree once

Every primitive reads the theme through styled-components, so a theme provider is required. `DefaultThemeProvider` is the built-in one.

<<< ../../template/client/src/ui/Provider.tsx#provider

The theme's values are CSS custom properties, and the sheet that defines them is imported once, from your entry point:

```ts
import "@ksp-gonogo/ui-kit/tokens.css";
```

## A widget

<<< ../../template/client/src/ExampleWidget.tsx#widget

Four things there are worth copying:

- **`Panel` takes its title and its body as props**, `panelTitle` and `sections`. That is what gives the widget the padded frame every other widget has, and what lets the body reflow when an operator makes the tile wider
- **`EmptyState` for a missing value**, never a zero. Until the first frame lands you do not know the mode; showing `Idle` claims you do
- **`Text` for a string you have already made**, which sets tabular figures so digits stop jittering as they update. A number with a unit goes through `Unit` instead, which formats it and draws its symbol
- **`Badge` tone carries the state**, `go` and `neutral` rather than a colour you picked

## Layout primitives

`Stack` is vertical, `Cluster` is a horizontal row justified apart, `Inline` is a group that must not shrink, `Grid` is columns, `Box` is a surface with padding. Between them they cover nearly every arrangement, and all four snap their gaps to the same five-step scale, so widgets line up with each other.

The [ui-kit reference](/reference/ui-kit/) has a page per primitive.

## Running it

<<< ../../template/client/src/main.tsx#main

```bash
cd client
npm install
npm run dev
```

With KSP running and your plugin loaded, the widget fills in as frames arrive. If it stays on its empty state, check the Topic name against [what the plugin declared](/guide/topics): an unknown Topic is answered with an `unknown-topic` error, which the template's stream client hands to `onError`.

## Accessibility

The primitives carry their own semantics: `Meter` renders `role="meter"`, `StatusIndicator` can be a live region, `Spinner` honours `prefers-reduced-motion`. What is on you:

- Give every icon-only control an `aria-label`
- Never live-region streaming telemetry. It floods a screen reader
- Keep focus visible

Next: [Distribution](/guide/distribution).
