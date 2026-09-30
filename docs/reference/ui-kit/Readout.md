# Readout

The hero element of a widget reduced to one dominant value.

```ts
declare const BigReadout: StyledComponent<"div", { $tone?: Tone }>;
declare const Readout: StyledComponent<"div", { $tone?: Tone }>;
declare const ReadoutCaption: StyledComponent<"span">;
```

| Export | Use |
| --- | --- |
| `BigReadout` | Fills the remaining panel space and centres one value |
| `Readout` | Same treatment, compact, sits alongside other content |
| `ReadoutCaption` | Muted sub-label under either, for units or a mode tag |

A one-token state pill (`NOMINAL`, `GO`, `ABORT`) is [Badge](/reference/ui-kit/Badge), not part of this family.

<<< ../../../template/client/src/ui/Readout.tsx#example

`$tone` carries the `$` because these are styled-components: the prefix keeps the prop off the DOM element.

Switch between `BigReadout` and `Readout` on available width, not on the value.
