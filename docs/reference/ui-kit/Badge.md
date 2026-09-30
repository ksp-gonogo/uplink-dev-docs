# Badge

A compact state pill.

```ts
type BadgeSize = "sm" | "md";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: BadgeSize;
  live?: boolean;
  report?: { id: string; label?: string };
  children: ReactNode;
}
```

| Prop | Default | Meaning |
| --- | --- | --- |
| `tone` | `neutral` | Colour, and what the chip is claiming. Omit it, or pass `neutral`, for a decorative chip: a kind tag or a count, making no claim about state |
| `size` | `md` | `sm` or `md` |
| `live` | `false` | Announce changes to this chip through `role="status"` |
| `report` | none | Register this chip in the enclosing [Panel](/reference/ui-kit/Panel)'s status summary, under an `id` that is stable for the chip's lifetime |

`tone` is the kit's one state scale, `Tone` from `@ksp-gonogo/sitrep-sdk`, so a panel of chips reads as one instrument rather than six colour choices.

| `tone` | Use for |
| --- | --- |
| `neutral` | No state. A kind tag or a count |
| `go` | Working as intended. `LINKED`, `ABOARD` |
| `info` | True and worth showing, but not a state to act on |
| `caution` | Worth watching. Nothing is required yet |
| `warn` | Action will be required |
| `nogo` | Action required now |
| `offline` | Not reporting at all. The reading is gone, not bad |

A panel summary ranks them `go`, `info`, `caution`, `warn`, `nogo`, `offline`, and `neutral` takes no part. `offline` outranks `nogo` rather than sitting below it: a chip whose data has stopped arriving is the most degraded thing it can say, and a nogo alarm cannot be trusted once the feed behind it is gone.

<<< ../../../template/client/src/ui/Badge.tsx#example

Set `live` for state the operator benefits from being told about as it changes, and leave it off everywhere else. A panel of live chips floods a screen reader.

Badges are short and uppercase: `LINKED`, `ARMED`, `S-BAND`. For a sentence of state with a leading dot, use [StatusIndicator](/reference/ui-kit/StatusIndicator).
