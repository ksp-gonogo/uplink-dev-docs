# Section

A named group of rows inside a panel, at the tightest gap.

```ts
interface SectionProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

declare const SectionTitle: StyledComponent<"div">;
```

<<< ../../../template/client/src/ui/Section.tsx#example

`SectionTitle` is uppercase and tracked out. It is a label, not a heading: it carries no heading semantics, so use a real heading element if the group needs to appear in a document outline.

For loose vertical spacing, use [Stack](/reference/ui-kit/Stack) instead.
