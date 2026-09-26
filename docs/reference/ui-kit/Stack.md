# Stack

A vertical flex list. The most common container in a widget.

```ts
interface StackProps extends HTMLAttributes<HTMLDivElement> {
  gap?:
    | "related"
    | "section"
    | "related-comfortable"
    | "related-compact"
    | "related-dense"
    | "related-packed"
    | "section-comfortable"
    | "section-compact"
    | "rows"
    | "caption"
    | "readout-row"
    | "label-value";
  as?: ElementType;
  fill?: boolean;
  children?: ReactNode;
}
```

| Prop | Default | Meaning |
| --- | --- | --- |
| `gap` | inherited `related` | The spacing job between children |
| `as` | `div` | The rendered element |
| `fill` | `false` | Takes the remaining height in a flex parent and may shrink below its content, so a scroller inside it scrolls |

<<< ../../../template/client/src/ui/Stack.tsx#example

A gap names a job, not a size. `related` spaces things that belong together and `section` spaces the groups; both step with the container, so the same stack is tighter inside a card than on a panel. The `-comfortable`, `-compact`, `-dense` and `-packed` tiers hold one density whatever the container, and `rows`, `caption`, `readout-row` and `label-value` are single jobs named for where they go.

Omit `gap` and the stack inherits `related` from whatever it sits in. Pass one only from the container that is deciding the spacing of what it holds. The same union is every `gap` in the kit; the kit does not export it by name, so write `StackProps["gap"]` when you need the type.
