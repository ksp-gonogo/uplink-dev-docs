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

**Readouts**: [Unit](/reference/ui-kit/Unit), [Text](/reference/ui-kit/Text), [Readout](/reference/ui-kit/Readout) (with `BigReadout` and `ReadoutCaption`), [ProgressBar](/reference/ui-kit/ProgressBar), [Truncate](/reference/ui-kit/Truncate)

**State**: [Badge](/reference/ui-kit/Badge), [StatusIndicator](/reference/ui-kit/StatusIndicator), [Spinner](/reference/ui-kit/Spinner), [EmptyState](/reference/ui-kit/EmptyState)

**Rows**: [Row](/reference/ui-kit/Row)

**Controls**: [Button](/reference/ui-kit/Button)

**Non-component**: [Theme](/reference/ui-kit/theme)

## Shared vocabulary

Two scales run through the whole kit.

**Space**: every `gap` takes a spacing job, `related` between things that belong together and `section` between groups, with fixed-density tiers and a few named single jobs beside them. The union is declared on [Stack](/reference/ui-kit/Stack). A [Box](/reference/ui-kit/Box) `pad` takes a named inset instead. Naming the job rather than a size is what makes separate widgets line up.

**Tone**: what state a thing is in, on one scale every surface speaks. `Tone` is exported by `@ksp-gonogo/sitrep-sdk`:

```ts
type Tone = "neutral" | "info" | "go" | "caution" | "warn" | "nogo" | "offline";
```

`neutral` carries no state. `caution` is the milder rung of `warn`. `offline` means the data behind the thing is gone, which is not the same as a neutral reading. A component names a tone and never a colour: how the tone is drawn depends on whether it colours text, a mark, or a fill, and the kit decides that.

| Prop | Takes | On |
| --- | --- | --- |
| `tone` | `Tone` | [Badge](/reference/ui-kit/Badge), [StatusIndicator](/reference/ui-kit/StatusIndicator), [Text](/reference/ui-kit/Text) |
| `tone` | `ButtonTone`, the four a button's action can mean | [Button](/reference/ui-kit/Button) |
| `$tone` | `Tone` | `BigReadout`, `Readout` |

A [Panel](/reference/ui-kit/Panel) merges the badges under it into a single worst-case summary, so the one scale is what lets separate chips add up to a panel state.

The `$` marks a styled-component transient prop, which is what keeps it off the DOM element. Everything else takes a plain `tone`.
