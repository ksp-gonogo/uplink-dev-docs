# Badge

A compact state pill.

```ts
type Severity =
  | "nominal"
  | "info"
  | "caution"
  | "warning"
  | "critical"
  | "offline";
type BadgeSize = "sm" | "md";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  severity?: Severity;
  size?: BadgeSize;
  live?: boolean;
  report?: { id: string; label?: string };
  children: ReactNode;
}
```

| Prop | Default | Meaning |
| --- | --- | --- |
| `severity` | none | Colour, and what the chip is claiming. Omit it for a decorative chip: a kind tag or a count, making no claim about state |
| `size` | `md` | `sm` or `md` |
| `live` | `false` | Announce changes to this chip through `role="status"` |
| `report` | none | Register this chip in the enclosing [Panel](/reference/ui-kit/Panel)'s status summary, under an `id` that is stable for the chip's lifetime |

`severity` is the one state vocabulary the whole kit speaks, so a panel of chips reads as one instrument rather than six colour choices.

| `severity` | Use for |
| --- | --- |
| `nominal` | Working as intended. `LINKED`, `ARMED` |
| `info` | True and worth showing, but not a state to act on |
| `caution` | Worth watching. Nothing is required yet |
| `warning` | Action will be required |
| `critical` | Action required now |
| `offline` | Not reporting at all. The reading is gone, not bad |

`offline` outranks `critical` rather than sitting below it: a chip whose data has stopped arriving is the most degraded thing it can say, and a critical alarm cannot be trusted once the feed behind it is gone.

<<< ../../../template/client/src/ui/Badge.tsx#example

Set `live` for state the operator benefits from being told about as it changes, and leave it off everywhere else. A panel of live chips floods a screen reader.

Badges are short and uppercase: `LINKED`, `ARMED`, `S-BAND`. For a sentence of state with a leading dot, use [StatusIndicator](/reference/ui-kit/StatusIndicator).
