# Stack

A vertical flex list. The most common container in a widget.

```ts
type SpaceToken = "xs" | "sm" | "md" | "lg" | "xl";

interface StackProps extends HTMLAttributes<HTMLDivElement> {
  gap?: SpaceToken;
  children?: ReactNode;
}
```

| Prop | Default |
| --- | --- |
| `gap` | `sm` |

<<< ../../../template/client/src/ui/Stack.tsx#example

`SpaceToken` is the kit's five-step scale, and every `gap` and `pad` in the kit takes it. Snapping to it is what makes your widget line up with the ones beside it.
