# StatusIndicator

A coloured dot and a line of state.

```ts
interface StatusIndicatorProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  tone: Tone;
  children: ReactNode;
  live?: boolean;
  pulse?: "slow" | "fast";
}
```

| Prop | Default | Meaning |
| --- | --- | --- |
| `tone` | required | The dot's colour, on the kit's one [tone scale](/reference/ui-kit/#shared-vocabulary) |
| `live` | `false` | Makes the indicator a polite live region |
| `pulse` | none | Pulses the dot for an active, changing state: `slow` reads as steady-live, `fast` as working or reconnecting. Held still under `prefers-reduced-motion` |

<<< ../../../template/client/src/ui/StatusIndicator.tsx#example

Set `live` for state that changes on its own and is worth being told about: a link going down, a data source failing. Leave it off otherwise.

**Never set `live` on streaming telemetry.** A live region that updates with the stream reads every change aloud and makes the page unusable with a screen reader.

Use this for a sentence; use [Badge](/reference/ui-kit/Badge) for a token.
