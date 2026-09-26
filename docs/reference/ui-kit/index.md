# @ksp-gonogo/ui-kit

```bash
npm install @ksp-gonogo/ui-kit react@18 styled-components
```

The design system the built-in mission-control screens are made of. Use it and your Uplink looks native.

React 18 only: the package declares `react@^18` as a peer dependency, and installing it beside React 19 fails.

## Setup

Every primitive reads the theme through styled-components, so the tree needs a theme provider. `DefaultThemeProvider` is the built-in one.

<<< ../../../template/client/src/ui/Provider.tsx#provider

The theme's values are custom properties, and the sheet that defines them goes in your entry point:

```ts
import "@ksp-gonogo/ui-kit/tokens.css";
```

Without it every themed size resolves to nothing. See [Theme](/reference/ui-kit/theme).

## It is presentational only

No primitive reads telemetry, dispatches a command, or holds anything but its own control state. Data comes in as props, interaction goes out as callbacks. That is what lets you render one in a test without a stream.

## The primitives

**Layout**: [Stack](/reference/ui-kit/Stack), [Cluster](/reference/ui-kit/Cluster), [Inline](/reference/ui-kit/Inline), [Grid](/reference/ui-kit/Grid), [Box](/reference/ui-kit/Box), [Section](/reference/ui-kit/Section)

**Containers**: [Panel](/reference/ui-kit/Panel), [Card](/reference/ui-kit/Card)

**Readouts**: [Unit](/reference/ui-kit/Unit), [Text](/reference/ui-kit/Text), [Readout](/reference/ui-kit/Readout) (with `BigReadout`, `ReadoutCaption` and `StatusPill`), [ProgressBar](/reference/ui-kit/ProgressBar), [Truncate](/reference/ui-kit/Truncate)

**State**: [Badge](/reference/ui-kit/Badge), [StatusIndicator](/reference/ui-kit/StatusIndicator), [Spinner](/reference/ui-kit/Spinner), [EmptyState](/reference/ui-kit/EmptyState)

**Rows**: [Row](/reference/ui-kit/Row)

**Controls**: [ActionButton](/reference/ui-kit/ActionButton)

**Non-component**: [Theme](/reference/ui-kit/theme)

## Shared vocabulary

Three scales run through the whole kit.

**Space**: every `gap` takes a spacing job, `related` between things that belong together and `section` between groups, with fixed-density tiers and a few named single jobs beside them. The union is declared on [Stack](/reference/ui-kit/Stack). A [Box](/reference/ui-kit/Box) `pad` takes a named inset instead. Naming the job rather than a size is what makes separate widgets line up.

**Severity**: what a chip is claiming about state, on one six-step scale from `nominal` to `offline`. [Badge](/reference/ui-kit/Badge) takes it, and a [Panel](/reference/ui-kit/Panel) merges the chips under it into a single worst-case summary, so the scale is what lets separate chips add up to a panel state.

**Tone**: colour, on the components that are not claiming state. Each names its own small union, and none of them is a free colour choice.

| Prop | Type | On |
| --- | --- | --- |
| `tone` | `ActionButtonTone` | `ActionButton` |
| `tone` | `StatusTone` | `StatusIndicator` |
| `tone` | `TextTone` | `Text` |
| `$tone` | `ReadoutTone` | `BigReadout`, `Readout`, `StatusPill` |

The `$` marks a styled-component transient prop, which is what keeps it off the DOM element. Everything else takes a plain `tone`.
