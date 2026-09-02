# Cluster

A horizontal row: items centred, content spread apart, and a `min-width: 0` so a truncating child truncates instead of overflowing.

```ts
type ClusterJustify = "between" | "start" | "end";

interface ClusterProps extends HTMLAttributes<HTMLDivElement> {
  justify?: ClusterJustify;
  gap?: SpaceToken;
  children?: ReactNode;
}
```

| Prop | Default |
| --- | --- |
| `justify` | `between` |
| `gap` | `md` |

<<< ../../../template/client/src/ui/Cluster.tsx#example

The `min-width: 0` is the reason to use this rather than a flex div of your own. Without it, a long label pushes everything to its right off the panel instead of ellipsising.

For a group that must not shrink, put an [Inline](/reference/ui-kit/Inline) inside.
