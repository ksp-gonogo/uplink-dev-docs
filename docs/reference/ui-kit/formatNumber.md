# formatNumber

```ts
interface FormatNumberOptions {
  decimals?: number;
}

function formatNumber(value: number | undefined, opts?: FormatNumberOptions): string;
```

Formats a telemetry number for display.

`undefined`, `NaN` and `Infinity` all render as an em dash. Those are the three shapes a reading takes when it has not arrived or the source reported a sentinel, and none of them should reach the screen as text.

```ts
formatNumber(1234.5678, { decimals: 1 }); // "1234.6"
formatNumber(undefined);                  // "—"
formatNumber(Number.NaN);                 // "—"
```

Omit `decimals` to stringify as-is.

<<< ../../../template/client/src/ui/Value.tsx#example
