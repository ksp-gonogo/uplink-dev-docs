# Text

Inline text: colour, size and weight, with tabular figures baked in.

```ts
type TextLevel = "muted" | "faint";
type TextSize = "xs" | "sm" | "base" | "lg";
type TextWeight = "regular" | "semibold";

interface TextProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  level?: TextLevel;
  spaced?: boolean;
  size?: TextSize;
  weight?: TextWeight;
  children?: ReactNode;
}
```

| Prop | Default | Meaning |
| --- | --- | --- |
| `tone` | `neutral` | The state the text shows, on the kit's one [tone scale](/reference/ui-kit/#shared-vocabulary). `neutral` is the primary text colour |
| `level` | none | Recedes neutral text: `muted` for secondary text, `faint` for the quietest tier. Text with a state keeps its tone's colour, so `tone={alarm ? "nogo" : undefined} level="faint"` reads faint until the alarm |
| `spaced` | `false` | Small left margin, to sit apart from a preceding label |
| `size` | inherits | Set it in dense rows; omit to take the ambient size |
| `weight` | inherits | `semibold` to lift one figure out of several |

<<< ../../../template/client/src/ui/Text.tsx#example

`font-variant-numeric: tabular-nums` is the reason to use this rather than a span: digits keep their column as the value updates, so a changing number does not jitter its neighbours.

It renders what you give it and formats nothing. A number with a unit is [Unit](/reference/ui-kit/Unit)'s job, and the two compose: `<Text tone="go"><Unit value={altitude} /></Text>`.
