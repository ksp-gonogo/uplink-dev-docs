# Inline

A compact horizontal group that never yields space (`flex-shrink: 0`)

```ts
interface InlineProps extends HTMLAttributes<HTMLSpanElement> {
  gap?: SpaceToken;
  inset?: boolean;
  children?: ReactNode;
}
```

| Prop | Default | Meaning |
| --- | --- | --- |
| `gap` | `sm` | |
| `inset` | `false` | Adds a left margin so this group sits apart from a preceding one |

<<< ../../../template/client/src/ui/Inline.tsx#example

Use it for the badges and buttons on the right of a row, so a long label on the left truncates rather than squeezing the controls.

[Cluster](/reference/ui-kit/Cluster) is the row; `Inline` is a group within it.
