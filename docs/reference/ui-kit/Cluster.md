# Cluster

A horizontal row: items centred, content spread apart, and a `min-width: 0` so a truncating child truncates instead of overflowing.

```ts
type ClusterJustify = "between" | "start" | "center" | "end";
type ClusterAlign = "center" | "start" | "baseline";

interface ClusterProps extends HTMLAttributes<HTMLDivElement> {
  justify?: ClusterJustify;
  align?: ClusterAlign;
  gap?: StackProps["gap"];
  wrap?: boolean;
  children?: ReactNode;
}
```

| Prop | Default | Meaning |
| --- | --- | --- |
| `justify` | `between` | `justify-content` |
| `align` | `center` | `align-items`. Use `start` when one side can grow taller than the other, so a label stays level with the top of a control that wraps to two lines |
| `gap` | inherited `related` | See [Stack](/reference/ui-kit/Stack) |
| `wrap` | `false` | Lets children wrap onto further lines. Turn it on for chip strips and tag lists; a row of controls that wraps silently turns ragged at a narrow width |

<<< ../../../template/client/src/ui/Cluster.tsx#example

The `min-width: 0` is the reason to use this rather than a flex div of your own. Without it, a long label pushes everything to its right off the panel instead of ellipsising.

For a group that must not shrink, put an [Inline](/reference/ui-kit/Inline) inside.
