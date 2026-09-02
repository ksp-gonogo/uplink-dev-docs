# Row

A spaced-between list row: name on the left, badges and actions on the right.

```ts
interface RowProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children?: ReactNode;
}

declare function Row(props: RowProps): JSX.Element;
declare const RowName: StyledComponent<"span">;
declare namespace Row {
  const Name: typeof RowName;
}
```

| Prop | Default | Meaning |
| --- | --- | --- |
| `as` | `li` | The rendered tag. A `Row` normally sits in a plain `<ul>`. |

<<< ../../../template/client/src/ui/Row.tsx#example

`Row.Name` and the standalone `RowName` export are the same component: a truncating label that flexes to fill and ellipsises rather than pushing the right-hand side off the panel.

Pass `as="div"` when the row is not in a list. A `<li>` outside a list is invalid, and a screen reader will announce a list that is not there.
