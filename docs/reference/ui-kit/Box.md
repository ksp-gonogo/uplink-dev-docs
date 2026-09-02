# Box

The generic surface: background, border, padding, radius.

```ts
type BoxSurface = "app" | "panel" | "raised" | "sunken";
type BoxRadius = "xs" | "sm" | "md" | "pill";
type BoxPad = SpaceToken | [SpaceToken, SpaceToken];

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
| `pad` | none | All sides, or `[vertical, horizontal]` |
| `bordered` | `false` | Adds a 1px subtle border |
| `radius` | none | Omit for square corners |

<<< ../../../template/client/src/ui/Box.tsx#example

The four surfaces are a depth order: `app` behind `panel` behind `raised`, with `sunken` inset. Use them to say which layer something is on, not to vary the colour.
