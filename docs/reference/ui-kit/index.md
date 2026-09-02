# @ksp-gonogo/ui-kit

```bash
npm install @ksp-gonogo/ui-kit react@18 styled-components
```

The design system the built-in mission-control screens are made of. Use it and your Uplink looks native.

React 18 only: the package declares `react@^18` as a peer dependency, and installing it beside React 19 fails.

## Setup

Every primitive reads the theme through styled-components, so the tree needs a `ThemeProvider`. `GonogoTokens` injects the custom properties the theme's values refer to.

<<< ../../../template/client/src/ui/Provider.tsx#provider

If your build imports CSS, `@ksp-gonogo/ui-kit/tokens.css` is the same block as a stylesheet and replaces `<GonogoTokens />`.

## It is presentational only

No primitive reads telemetry, dispatches a command, or holds anything but its own control state. Data comes in as props, interaction goes out as callbacks. That is what lets you render one in a test without a stream.

## The primitives

**Layout**: [Stack](/reference/ui-kit/Stack), [Cluster](/reference/ui-kit/Cluster), [Inline](/reference/ui-kit/Inline), [Grid](/reference/ui-kit/Grid), [Box](/reference/ui-kit/Box), [Section](/reference/ui-kit/Section)

**Containers**: [Panel](/reference/ui-kit/Panel), [Card](/reference/ui-kit/Card), [WidgetHeader](/reference/ui-kit/WidgetHeader)

**Readouts**: [Value](/reference/ui-kit/Value), [Readout](/reference/ui-kit/Readout) (with `BigReadout`, `ReadoutCaption` and `StatusPill`), [ProgressBar](/reference/ui-kit/ProgressBar), [Truncate](/reference/ui-kit/Truncate)

**State**: [Badge](/reference/ui-kit/Badge), [StatusIndicator](/reference/ui-kit/StatusIndicator), [Spinner](/reference/ui-kit/Spinner), [EmptyState](/reference/ui-kit/EmptyState)

**Rows**: [Row](/reference/ui-kit/Row), [ScienceExperimentRow](/reference/ui-kit/ScienceExperimentRow)

**Controls**: [ActionButton](/reference/ui-kit/ActionButton)

**Non-component**: [Theme](/reference/ui-kit/theme), [formatNumber](/reference/ui-kit/formatNumber)

## Shared vocabulary

Two scales run through the whole kit.

**Space**: the `SpaceToken` union, `xs` `sm` `md` `lg` `xl`, taken by every `gap` and every `pad` in the kit. It is exported from the root and declared on [Stack](/reference/ui-kit/Stack). Snapping to it is what makes separate widgets line up.

**Tone**: the colour of state, never a colour you choose. `go` and `nogo` for binary readiness, `warn` for attention, `info` for neutral emphasis, `neutral` for none. `Readout` and `StatusPill` use a narrower set: `default`, `go`, `warning`, `alert`.

| Prop | Type | On |
| --- | --- | --- |
| `tone` | `ActionButtonTone` | `ActionButton` |
| `tone` | `BadgeTone` | `Badge` |
| `tone` | `StatusTone` | `StatusIndicator` |
| `tone` | `ValueTone` | `Value` |
| `$tone` | `ReadoutTone` | `BigReadout`, `Readout`, `StatusPill` |

The `$` marks a styled-component transient prop, which is what keeps it off the DOM element. Everything else takes a plain `tone`.
