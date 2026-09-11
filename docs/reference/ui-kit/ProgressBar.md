# ProgressBar

A thin track-and-fill indicator, rendered as a native `role="progressbar"`.

```ts
interface ProgressBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  value: number;
  ariaLabel?: string;
}
```

| Prop | Meaning |
| --- | --- |
| `value` | 0–100. Clamped into range before rendering. |
| `ariaLabel` | What is being measured, e.g. `"Biome coverage, Kerbin"` |

<<< ../../../template/client/src/ui/ProgressBar.tsx#example

Always pass `ariaLabel`. A screen reader announces the percentage and nothing else, so without it the operator hears a number with no subject.

The bar shows the fraction; it does not show the number. Pair it with a [Unit](/reference/ui-kit/Unit) when the exact figure matters.
