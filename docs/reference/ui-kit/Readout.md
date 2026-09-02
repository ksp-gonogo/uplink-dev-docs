# Readout

The hero element of a widget reduced to one dominant value.

```ts
type ReadoutTone = "default" | "go" | "warning" | "alert";

declare const BigReadout: StyledComponent<"div", { $tone?: ReadoutTone }>;
declare const Readout: StyledComponent<"div", { $tone?: ReadoutTone }>;
declare const ReadoutCaption: StyledComponent<"span">;
declare const StatusPill: StyledComponent<"div", { $tone: ReadoutTone }>;
```

| Export | Use |
| --- | --- |
| `BigReadout` | Fills the remaining panel space and centres one value |
| `Readout` | Same treatment, compact, sits alongside other content |
| `ReadoutCaption` | Muted sub-label under either, for units or a mode tag |
| `StatusPill` | One token of state: `NOMINAL`, `GO`, `ABORT`. `$tone` is required. |

<<< ../../../template/client/src/ui/Readout.tsx#example

`$tone` carries the `$` because these are styled-components: the prefix keeps the prop off the DOM element.

Switch between `BigReadout` and `Readout` on available width, not on the value.
