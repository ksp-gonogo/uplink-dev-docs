# Building the UI

`@ksp-gonogo/ui-kit` is the design system the built-in screens are made of. Use it and your Uplink looks native; hand-roll CSS and it does not.

The kit is presentational only. No primitive reads telemetry or dispatches a command; data comes in as props and interaction goes out as callbacks.

## Wrap the tree once

Every primitive reads the theme through styled-components, so a `ThemeProvider` is required. `GonogoTokens` injects the custom properties the theme's values refer to.

<<< ../../template/client/src/ui/Provider.tsx#provider

If your build imports CSS files, `@ksp-gonogo/ui-kit/tokens.css` is the same block as a stylesheet and you can drop `<GonogoTokens />`.

## A widget

<<< ../../template/client/src/ExampleWidget.tsx#widget

Four things there are worth copying:

- **`Panel` and `WidgetHeader`** give the widget the frame every other widget has
- **`EmptyState` for a missing value**, never a zero. Until the first frame lands you do not know the mode; showing `Idle` claims you do
- **`Value` for numbers**, which sets tabular figures so digits stop jittering as they update
- **`Badge` tone carries the state**, `go` and `nogo` rather than a colour you picked

## Layout primitives

`Stack` is vertical, `Cluster` is a horizontal row justified apart, `Inline` is a group that must not shrink, `Grid` is columns, `Box` is a surface with padding. Between them they cover nearly every arrangement, and all four snap their gaps to the same five-step scale, so widgets line up with each other.

The [ui-kit reference](/reference/ui-kit/) has a page per primitive.

## Accessibility

The primitives carry their own semantics: `ProgressBar` renders `role="progressbar"`, `StatusIndicator` can be a live region, `Spinner` honours `prefers-reduced-motion`. What is on you:

- Give every icon-only control an `aria-label`
- Never live-region streaming telemetry. It floods a screen reader
- Keep focus visible

Next: [Distribution](/guide/distribution).
