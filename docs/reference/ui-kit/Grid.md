# Grid

CSS grid for the two shapes widgets need: a fixed-column row, and a responsive card gallery.

```ts
interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: string;
  minColWidth?: string;
  gap?: SpaceToken;
  children?: ReactNode;
}
```

| Prop | Default | Meaning |
| --- | --- | --- |
| `cols` | none | A `grid-template-columns` value, e.g. `"120px 1fr 60px"`. Wins over `minColWidth`. |
| `minColWidth` | none | Auto-fill: `repeat(auto-fill, minmax(minColWidth, 1fr))` |
| `gap` | `sm` | |

<<< ../../../template/client/src/ui/Grid.tsx#example

A grid keeps values in a column across rows; a stack of [Cluster](/reference/ui-kit/Cluster)s does not. For a table of readings, use the grid.
