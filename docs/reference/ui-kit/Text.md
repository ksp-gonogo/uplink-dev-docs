# Text

Inline text: colour, size and weight, with tabular figures baked in.

```ts
type TextTone =
  | "accent"
  | "default"
  | "muted"
  | "faint"
  | "go"
  | "warn"
  | "nogo"
  | "info";
type TextSize = "xs" | "sm" | "base" | "lg";
type TextWeight = "regular" | "semibold";

interface TextProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: TextTone;
  spaced?: boolean;
  size?: TextSize;
  weight?: TextWeight;
  children?: ReactNode;
}
```

| Prop | Default | Meaning |
| --- | --- | --- |
| `tone` | `accent` | |
| `spaced` | `false` | Small left margin, to sit apart from a preceding label |
| `size` | inherits | Set it in dense rows; omit to take the ambient size |
| `weight` | inherits | `semibold` to lift one figure out of several |

<<< ../../../template/client/src/ui/Text.tsx#example

`font-variant-numeric: tabular-nums` is the reason to use this rather than a span: digits keep their column as the value updates, so a changing number does not jitter its neighbours.

It renders what you give it and formats nothing. A number with a unit is [Unit](/reference/ui-kit/Unit)'s job, and the two compose: `<Text tone="go"><Unit value={altitude} /></Text>`.
