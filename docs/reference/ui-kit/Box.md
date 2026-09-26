# Box

The generic surface: background, border, padding, radius.

```ts
type BoxSurface = "app" | "panel" | "raised" | "sunken";
type BoxRadius = "regular" | "floating" | "pill";
type BoxPad =
  | "chip"
  | "chip-roomy"
  | "chip-readout"
  | "pill"
  | "surface"
  | "surface-standalone"
  | "popover";

interface BoxProps extends HTMLAttributes<HTMLDivElement> {
  surface?: BoxSurface;
  pad?: BoxPad;
  bordered?: boolean;
  radius?: BoxRadius;
  children?: ReactNode;
}
```

| Prop | Default | Meaning |
| --- | --- | --- |
| `surface` | none | Background tier. Omit for transparent. |
| `pad` | none | A named inset: the padding of a chip, a pill, a surface or a popover |
| `bordered` | `false` | Adds a 1px subtle border |
| `radius` | none | `regular` for ordinary corners, `floating` for something above the app, `pill` for fully rounded. Omit for square corners |

<<< ../../../template/client/src/ui/Box.tsx#example

The four surfaces are a depth order: `app` behind `panel` behind `raised`, with `sunken` inset. Use them to say which layer something is on, not to vary the colour.
