# Value

An inline numeric readout, with tabular figures baked in.

```ts
type ValueTone = "accent" | "default" | "muted";
type ValueSize = "xs" | "sm" | "base" | "lg";

interface ValueProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ValueTone;
  spaced?: boolean;
  size?: ValueSize;
  children?: ReactNode;
}
```

| Prop | Default | Meaning |
| --- | --- | --- |
| `tone` | `accent` | |
| `spaced` | `false` | Small left margin, to sit apart from a preceding label |
| `size` | inherits | Set it in dense rows; omit to take the ambient size |

<<< ../../../template/client/src/ui/Value.tsx#example

`font-variant-numeric: tabular-nums` is the reason to use this rather than a span: digits keep their column as the value updates, so a changing number does not jitter its neighbours.

Pair it with [formatNumber](/reference/ui-kit/formatNumber), which renders a missing or non-finite reading as an em dash instead of `NaN`.
