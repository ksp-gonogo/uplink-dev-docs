# EmptyState

Muted placeholder text for a panel with nothing to render.

```ts
type EmptyStateLayout = "inline" | "fill";

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  layout?: EmptyStateLayout;
}
```

| Prop | Default | Meaning |
| --- | --- | --- |
| `layout` | `inline` | `inline` sits in a stack of siblings. `fill` centres in the available space, for a panel's only child. |

<<< ../../../template/client/src/ui/EmptyState.tsx#example

Use it for a value you have not received. A telemetry reading that has not arrived is not zero, and rendering `0` claims a measurement you do not have.

Say what is missing and why, not "no data".
