# StatusIndicator

A coloured dot and a line of state.

```ts
type StatusTone = "neutral" | "info" | "go" | "warn" | "nogo";

interface StatusIndicatorProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  tone: StatusTone;
  children: ReactNode;
  live?: boolean;
}
```

| Prop | Default | Meaning |
| --- | --- | --- |
| `tone` | required | Same palette as [Badge](/reference/ui-kit/Badge) |
| `live` | `false` | Makes the indicator a polite live region |

<<< ../../../template/client/src/ui/StatusIndicator.tsx#example

Set `live` for state that changes on its own and is worth being told about: a link going down, a data source failing. Leave it off otherwise.

**Never set `live` on streaming telemetry.** A live region that updates with the stream reads every change aloud and makes the page unusable with a screen reader.

Use this for a sentence; use [Badge](/reference/ui-kit/Badge) for a token.
