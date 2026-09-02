# Spinner

A small inline pending indicator, sized to slot beside a label without reflowing the row.

```ts
interface SpinnerProps {
  size?: number;
  thickness?: number;
  color?: string;
  ariaLabel?: string;
}
```

| Prop | Default |
| --- | --- |
| `size` | `12` (px outer diameter) |
| `thickness` | `2` (px stroke) |
| `color` | accent foreground |
| `ariaLabel` | none |

<<< ../../../template/client/src/ui/Spinner.tsx#example

The spin is gated on `prefers-reduced-motion: no-preference`; users who asked for less motion see a static ring.

A command in flight can be waiting on light-time for minutes. A spinner says "pending", not "nearly there". Pair it with the elapsed time when the wait is long.
