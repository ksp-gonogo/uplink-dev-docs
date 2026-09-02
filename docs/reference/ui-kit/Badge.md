# Badge

A compact state pill. The kit's canonical badge; do not hand-roll a styled span for this.

```ts
type BadgeTone = "neutral" | "go" | "nogo" | "warn" | "info";
type BadgeSize = "sm" | "md";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
  children: ReactNode;
}
```

| Prop | Default |
| --- | --- |
| `tone` | `neutral` |
| `size` | `md` |

<<< ../../../template/client/src/ui/Badge.tsx#example

Badges are short and uppercase: `LINKED`, `ARMED`, `S-BAND`. For a sentence of state with a leading dot, use [StatusIndicator](/reference/ui-kit/StatusIndicator).
