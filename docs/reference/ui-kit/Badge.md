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
| `tone` | `neutral` | Colour, and what the chip is claiming. `neutral` is the decorative one: a kind tag or a count, making no claim about state |
| `size` | `md` | `sm` or `md` |

`tone` is the shared state vocabulary, the same five names every kit component
that shows state takes, so a panel of chips reads as one instrument rather than
five colour choices.

| `tone` | Use for |
| --- | --- |
| `go` | Working as intended. `LINKED`, `ARMED` |
| `info` | True and worth showing, but not a state to act on |
| `warn` | Action will be required |
| `nogo` | Action required now, or not reporting at all |
| `neutral` | No claim. A kind tag, a count |

<<< ../../../template/client/src/ui/Badge.tsx#example

Badges are short and uppercase: `LINKED`, `ARMED`, `S-BAND`. For a sentence of state with a leading dot, use [StatusIndicator](/reference/ui-kit/StatusIndicator).
