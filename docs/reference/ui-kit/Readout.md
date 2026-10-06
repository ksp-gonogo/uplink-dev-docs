# Readout

The hero element of a widget reduced to one dominant value.

```ts
type ReadoutSize = "hero" | "inline";
declare function Readout(props: HTMLAttributes<HTMLDivElement> & { size?: ReadoutSize; tone?: Tone }): JSX.Element;
declare const ReadoutCaption: StyledComponent<"span">;
```

| Export | Use |
| --- | --- |
| `Readout` | One value. `size="hero"` fills the remaining panel space and centres it; the default `size="inline"` is compact and sits alongside other content |
| `ReadoutCaption` | Muted sub-label under a readout, for units or a mode tag |

A one-token state pill (`NOMINAL`, `GO`, `ABORT`) is [Badge](/reference/ui-kit/Badge), not part of this family.

<<< ../../../template/client/src/ui/Readout.tsx#example

Switch `size` on available width, not on the value.
