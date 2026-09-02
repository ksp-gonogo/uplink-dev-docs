# Truncate

Single-line ellipsis truncation for a flex or grid child.

```ts
declare const Truncate: StyledComponent<"span">;
```

<<< ../../../template/client/src/ui/Truncate.tsx#example

The same behaviour is already inside [Row.Name](/reference/ui-kit/Row). Use `Truncate` where a label needs it outside a row: a grid cell, a card title.

It needs a parent that constrains width. Inside a [Cluster](/reference/ui-kit/Cluster) or [Grid](/reference/ui-kit/Grid) it works; inside a plain flex div with no `min-width: 0` it will not.
