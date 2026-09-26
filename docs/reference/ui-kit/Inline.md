# Inline

A compact horizontal group that never yields space (`flex-shrink: 0`)

```ts
interface InlineProps extends HTMLAttributes<HTMLSpanElement> {
  gap?: StackProps["gap"];
  inset?: boolean;
  wrap?: boolean;
  children?: ReactNode;
}
```

| Prop | Default | Meaning |
| --- | --- | --- |
| `gap` | inherited `related` | See [Stack](/reference/ui-kit/Stack) |
| `inset` | `false` | Adds a left margin so this group sits apart from a preceding one |
| `wrap` | `false` | Lets the group break onto further lines, and drops the `flex-shrink: 0` |

<<< ../../../template/client/src/ui/Inline.tsx#example

Use it for the badges and buttons on the right of a row, so a long label on the left truncates rather than squeezing the controls.

Refusing to shrink is right for two badges and wrong for six: an unbreakable group wider than its column does not stop at the column edge, it runs on across whatever is drawn beside it. Set `wrap` wherever the number of children comes from data rather than being fixed.

[Cluster](/reference/ui-kit/Cluster) is the row; `Inline` is a group within it.
