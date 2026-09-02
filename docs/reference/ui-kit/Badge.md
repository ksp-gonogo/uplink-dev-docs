# Badge

A compact state pill.

```ts
type BadgeTone = "neutral" | "go" | "nogo" | "warn" | "info";
type BadgeSize = "sm" | "md";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
  children: ReactNode;
}
```

| Prop | Default | Meaning |
| --- | --- | --- |
| `severity` | none | Colour, and the rank it contributes to a panel summary. Omit for a decorative badge (a kind tag, a count): it renders a neutral grey chip and never moves a summary |
| `size` | `md` | `sm` or `md` |

`severity` is the canonical vocabulary, shared by every kit component that shows
state, so a panel can aggregate its children with a single max-merge. Six values,
best to worst:

| `severity` | Use for |
| --- | --- |
| `nominal` | Working as intended. `LINKED`, `ARMED` |
| `info` | True and worth showing, but not a state to act on |
| `caution` | Off-nominal, no action required yet |
| `warning` | Action will be required |
| `critical` | Action required now |
| `offline` | Not reporting, so no severity can be known. Distinct from nominal |

::: warning `tone` is deprecated
`tone` (`neutral` / `go` / `nogo` / `warn` / `info`) is a fold alias kept through
a migration window and removed by a lint ratchet when that window closes. It maps
onto `severity` internally. Write `severity` in new code.
:::

<<< ../../../template/client/src/ui/Badge.tsx#example

Badges are short and uppercase: `LINKED`, `ARMED`, `S-BAND`. For a sentence of state with a leading dot, use [StatusIndicator](/reference/ui-kit/StatusIndicator).
