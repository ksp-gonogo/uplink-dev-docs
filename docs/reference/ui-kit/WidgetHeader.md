# WidgetHeader

The standard widget header: a title on the left, actions on the right, a subtle bottom border.

```ts
interface WidgetHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}
```

| Prop | Meaning |
| --- | --- |
| `title` | The left side, string or node |
| `actions` | Right-aligned slot for toggles and buttons |
| `children` | Replaces the left side entirely, for full control |

<<< ../../../template/client/src/ui/WidgetHeader.tsx#example

Pass `title` or `children`, not both.

A widget that spends career funds must show the balance in its body, not only here: the header's right-hand slot collapses at narrow widths and takes the balance with it.
