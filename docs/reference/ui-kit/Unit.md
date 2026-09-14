# Unit

A quantity, drawn with its unit.

```tsx
<Unit value={flight.altitudeAsl} />
```

That is the whole of it. A quantity carries its own unit, so the call site names neither the unit nor the format, and the ladder picks the rung as the number moves: a length under a kilometre draws in metres and above it in kilometres, on up to interplanetary distances.

| Prop | Meaning |
| --- | --- |
| `value` | The quantity. Absent or null draws the null token, so a reading goes straight across without an absence check of its own. A magnitude of zero is a reading and keeps its zero |
| `format` | Pin the rung instead of letting the ladder choose: km/h on a broadcast, km/s in a technical readout. Typed `FormatsFor` the value's own kind, so a speed format is a type error on a length |
| `as` | Draw it in another unit of the same kind: °C on a kelvin field, g on an m/s² one. A cross-kind request is refused, and the value draws in its own unit |
| `decimals` | Override the kind's decimal places |
| `scale` | `auto` climbs the ladder, `never` holds the base unit, `scientific` forces scientific notation |

<<< ../../../template/client/src/ui/Unit.tsx#example

## Where a quantity comes from

Every quantity-bearing field the mod publishes is typed with its unit, so a field off a core Topic is already one and needs nothing done to it. A number off your own Topic is not: pair it with its unit through the SDK's `value` factory at the point you read it, and everything downstream is the same shape as the rest.

```ts
value("m", 1234); // { magnitude: 1234, unit: "m" }
```

Quantities refuse to cross dimensions, so a length will not add to a speed.

## Your own units

A unit your Uplink introduces is declared to the client exactly as every built-in unit is: one entry merged into the SDK's unit declarations, stating its kind, its dimension, its ratio onto that dimension's base and, if it climbs one, the name of its ladder. It is then registered once, with the SDK's `registerUnit`, whose argument is typed from that declaration. There is no second registration on the kit side.

From then on it gets the same checks a metre does. `format` and `as` accept exactly the units of its kind, a shared-format pin addresses its ladder by name or, for a unit on no ladder, the unit itself, and a value in it adds only to values of its dimension. A token nothing declares still draws, bare and unscaled, but `format` accepts nothing for it, because there is no kind to check the request against.

The published SDK does not carry the declaration yet: see [Known limits](/guide/limits).

## What it draws

The number, a thin space, and the symbol, in one run that cannot break across a line. Currency and science are kinds like any other: funds keep the game's `f`, science draws a microscope and reputation a star.

The symbol sizes and dims itself against the text around it, so there is no size or tone prop. In a large readout it draws proportionally large; in a table cell, proportionally small.

Each unit announces its word rather than its symbol, so a screen reader says "kilometres" where the page shows `km`. That needs nothing at the call site.

## There is no number formatter

The kit exports none, and `<Unit>` is the only way it renders a quantity. Two string escapes exist for the places a React node cannot go: `writeQuantity` for visible text something else has to measure, such as an SVG or canvas label, and `speakQuantity` for an accessible name. Both take a quantity rather than a bare number. `NULL_DISPLAY` is the em dash they render for a reading that has not arrived.

`setQuantityLocale` is the one global lever: call it once at start-up and every readout follows.
