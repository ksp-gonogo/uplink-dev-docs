# Publishing a Topic

A Topic is a named stream of one payload shape, such as `example.heartbeat`. This page covers its four parts: the type that describes the payload, the codegen that turns it into TypeScript, the declaration in the manifest, and the source that publishes it.

## The payload type

In `mod-contract/ExamplePayloads.cs`:

<<< ../../example/mod-contract/ExamplePayloads.cs#heartbeat{cs}

Every Topic's payload is a class in the contract slice, carrying three attributes:

- **`SitrepContractAttribute`** marks it as a wire type
- **`SitrepTopicAttribute`** names the Topic it is the payload of
- **`TsInterface`**, from the [Reinforced.Typings](https://www.nuget.org/packages/Reinforced.Typings) package codegen runs, tells codegen to write a TypeScript interface for it. It sits inside `#if SITREP_CODEGEN` because it exists only in the build `codegen` runs, never in the assembly you ship, and so does the file's `using Reinforced.Typings.Attributes;` at its top

A property carrying `SitrepUnitAttribute` reaches the client as a quantity in that unit, such as `Value<"ut">` for `Units.UniversalTime`. [`Units`](/reference/mod/serialization#Units), on the Serialization page, lists every unit; the ones an Uplink reaches for most:

| Member | Client unit id | For |
| --- | --- | --- |
| `Units.UniversalTime` | `"ut"` | a moment: the game time something happens or happened |
| `Units.Seconds` | `"s"` | a duration: how long something takes, or how long is left |
| `Units.Metres`, `Units.MetresPerSecond` | `"m"`, `"m/s"` | a distance or altitude, a speed |
| `Units.Degrees` | `"°"` | an angle, latitude or longitude |
| `Units.Tonnes`, `Units.Kilonewtons`, `Units.Kelvin` | `"t"`, `"kN"`, `"K"` | a mass, a thrust, a temperature |
| `Units.Ratio` | `"ratio"` | a fraction from 0 to 1, drawn as a percentage |
| `Units.Count` | `"count"` | a whole number of things, such as crew or samples |
| `Units.Funds`, `Units.Science`, `Units.Reputation` | `"funds"`, `"science"`, `"rep"` | a career resource |
| `Units.Id`, `Units.Text`, `Units.Flag`, `Units.Enumeration` | `"id"`, `"text"`, `"flag"`, `"enum"` | a field that is not a quantity: an identifier, a string, a boolean, a member of an enum |

Each member is the client's unit id: `Units.MetresPerSecond` is the string `"m/s"`, so a property tagged with it reads as `Value<"m/s">` and `value("m/s", 3)` makes one. The wire carries the unit named, never a converted one, and `Unit` picks the symbol to draw: a mass tagged `Units.Tonnes` is handed to `Unit` as it arrived. [`UNIT_DEFINITIONS`](/reference/client/units-and-values#UNIT_DEFINITIONS) lists every id the SDK knows.

When the catalog lacks a unit your Uplink needs, tag the property with a plain string of your own, namespaced with your Uplink's id (`"snacks:crate"`). On the client declare it for the compiler by merging into [`UnitDeclarations`](/reference/client/units-and-values#UnitDeclarations) with a `declare module "@ksp-gonogo/sitrep-sdk"` block, and register the same unit at runtime with [`registerUnit`](/reference/client/units-and-values#registerUnit), which checks it against the declaration; from then on `Unit`, `Meter` and `Band` take it like a built-in.

A string meant to be read by a person, such as a name or a status message, takes `Units.Text`; a string that identifies something and is never read as prose takes `Units.Id`. A property that holds a list of a nested payload type, such as `List<Alarm>`, is supported: codegen writes `Alarm[]`, the nested type needs its own entry in the wire types below, and the units on its fields do the describing, so the list property itself carries no `SitrepUnitAttribute`.

A nullable property reaches the client as a field that can be `null`. The doc comments reach the client too, so say what each field is, its unit and when it is `null`. A paragraph inside `<internal>` stays in the C#, for notes meant only for whoever maintains the plugin.

Name Topics `<uplinkId>.<thing>`. The prefix keeps them clear of every other Uplink's.

### How each unit is drawn

`Unit` and `writeQuantity` choose the symbol, the precision and the step on the ladder (metres to kilometres, kilowatts to megawatts) from the unit id and the size of the value, so a field is handed over as it arrived. The table gives each unit's id and what a sample value comes out as, written with `writeQuantity`; `Unit` draws the same text, with a thin space before the symbol. A duration is the one that surprises: `Units.Seconds` is drawn as steps of time (`95` is `1min 35s`, `3600` is `1h`) with no symbol after it, and a moment, `Units.UniversalTime`, is drawn as a date and a clock time, never as a number of seconds. A test that asserts what a widget shows asserts these strings ([Testing](/guide/testing#what-unit-draws)).

For a latitude or a longitude use `Units.Degrees`: it is what the contract's own `latitude` and `longitude` fields carry, drawn as `28.61°`. The wire carries the angle in degrees, not radians, and a longitude is passed through in the range the game reports. `Units.Radians` is for an angle a field carries in radians.

| Member | Client unit id | Value sent | Drawn as |
| --- | --- | --- | --- |
| `Units.Metres` | `"m"` | `1234.5` | 1.2 km |
| `Units.Kilometres` | `"km"` | `1.2345` | 1.2 km |
| `Units.SquareMetres` | `"m²"` | `1234.5` | 1234.5 m² |
| `Units.CubicMetres` | `"m³"` | `1234.5` | 1234.5 m³ |
| `Units.MetresPerSecond` | `"m/s"` | `1234.5` | 1234.5 m/s |
| `Units.Degrees` | `"°"` | `28.608` | 28.61° |
| `Units.Radians` | `"rad"` | `1.5708` | 1.57 rad |
| `Units.Seconds` | `"s"` | `95` | 1min 35s |
| `Units.UniversalTime` | `"ut"` | `1000000` | Y1 D47 01:46:40 |
| `Units.SpecificImpulse` | `"isp"` | `320` | 320 s |
| `Units.Rpm` | `"rpm"` | `120` | 120 rpm |
| `Units.Kelvin` | `"K"` | `293.15` | 293 K |
| `Units.Tonnes` | `"t"` | `12.4` | 12.40 t |
| `Units.Kilograms` | `"kg"` | `1234.5` | 1.23 t |
| `Units.KilogramsPerSecond` | `"kg/s"` | `1.5` | 1.50 kg/s |
| `Units.Kilonewtons` | `"kN"` | `250` | 250.0 kN |
| `Units.Kilopascals` | `"kPa"` | `101.3` | 101.30 kPa |
| `Units.Kilowatts` | `"kW"` | `1500` | 1.5 MW |
| `Units.Bits` | `"bit"` | `8000` | 1.0 KB |
| `Units.BitsPerSecond` | `"bit/s"` | `2000` | 2.0 kbit/s |
| `Units.RadPerSecond` | `"rad/s"` | `0.001` | 3.6000 rad/h |
| `Units.WattsPerSquareMetre` | `"W/m²"` | `1360` | 1360.0 W/m² |
| `Units.Mits` | `"Mit"` | `12` | 12.0 mits |
| `Units.Decibels` | `"dB"` | `-120.5` | -120.5 dB |
| `Units.KilogramsPerCubicMetre` | `"kg/m³"` | `1.225` | 1.2250 kg/m³ |
| `Units.GForce` | `"g"` | `1.5` | 1.50 g |
| `Units.CubicMetresPerSecondSquared` | `"m³/s²"` | `1e12` | 1.000×10¹² m³/s² |
| `Units.Ratio` | `"ratio"` | `0.42` | 42 % |
| `Units.Dimensionless` | `"1"` | `0.5` | 0.50 |
| `Units.Percent` | `"%"` | `42` | 42.0 % |
| `Units.Funds` | `"funds"` | `250000` | 250,000f |
| `Units.FundsPerDay` | `"f/day"` | `5000` | 5000.0 f/day |
| `Units.Science` | `"science"` | `12.5` | 12.5, then the science mark |
| `Units.SciencePerDay` | `"science/day"` | `1.2` | 1.2 science/day |
| `Units.Reputation` | `"rep"` | `50` | 50.0, then the reputation mark |
| `Units.ReputationPerDay` | `"rep/day"` | `1.5` | 1.50 rep/day |
| `Units.Count` | `"count"` | `7` | 7 |
| `Units.Id` | `"id"` | `7` | 7 |
| `Units.ResourceUnits` | `"units"` | `1234.5` | 1234.5 units |
| `Units.ResourceUnitsPerSecond` | `"units/s"` | `1.5` | 1.50 units/s |

`Units.Text`, `Units.Flag`, `Units.Enumeration` and `Units.NotApplicable` name a field that is not a quantity (`"text"`, `"flag"`, `"enum"`, `"n/a"`), so `Unit` does not draw them: a string, a boolean or an enum is read from the reading and drawn by the widget.

## Generating the client's types

`mod-contract/ExampleRtConfig.cs` lists the wire types codegen exports, in the array its `Configure` method hands to Reinforced.Typings. Add every new payload type here; `new` writes only the `typeof(ExampleHeartbeat)` entry. The `ExampleResetArgs` entry below is the command [Accepting a command](/guide/commands) adds:

<<< ../../example/mod-contract/ExampleRtConfig.cs#wiretypes{cs}

Then regenerate, and commit what changes:

```bash
cd client
npm run codegen
```

It writes `client/src/__generated__/`: `contract.ts` with an interface per wire type, and `units.ts` and `units.json` with each field's unit, which `src/topics.ts` registers with the SDK (`registerTopicUnits` and `registerTypeUnits`, imported from `@ksp-gonogo/sitrep-sdk`):

<<< ../../example/client/src/topics.ts#units

The first loop tells the SDK the unit of each field of each Topic, so a field reading of `example.heartbeat` is a `Value` in its unit; the second does the same for each wire type by name, which is what a type nested inside a payload needs, such as the item type of a list: without it the item's numbers arrive as plain numbers. Codegen also writes `topic-map.ts`, the slice's Topics and their payload types, which the page generator (`npm run page`, [Documenting your Uplink](/guide/documenting)) reads, and `command-map.ts`, the slice's commands ([Sending a command](/guide/client-commands)). What types `useTelemetry("example.heartbeat")` is the declaration in `src/topics.ts`, which you extend by hand for each Topic ([A widget](/guide/client-widget#the-topics-typed)). `npm run codegen:check` fails when the committed files no longer match the slice, which is the command to run in CI (the workflow `new --workflows` writes already runs it).

## Declaring the Topic

The manifest's `Channels` list declares each Topic with a `ChannelDeclaration`:

<<< ../../example/mod/ExampleUplink.cs#channels{cs}

- **`Topic`** is the name, exactly as the payload type's `SitrepTopicAttribute` gives it
- **`Delivery`**: `Delivery.LossyLatest` drops a superseded sample under load, which is right for anything a later value replaces. `ReliableOrdered` keeps every sample in order, for events that cannot be dropped
- **`Delay`**: `DelayRole.Delayed` holds each sample for the signal delay between the craft and the operator's command centre, so the operator sees it when a real signal would arrive. `TrueNow` skips the delay, for facts about the ground or about the connection itself, like this heartbeat. A fact about a craft is `Delayed`
- **`Emission`**: an `EmissionPolicy`. `keyframeIntervalUt` is the longest a Topic goes without a sample, in game seconds; `quantum`, an `EmissionQuantum`, is how much a number must change before a new sample goes out early. `EmissionQuantum.Absolute(0)` sends one on any change

Emission is counted in game seconds, and under time warp a game second passes in a fraction of a real one. A value that changes on every tick, with a quantum of zero, is published on every tick at any warp, so give a value that changes continuously a quantum of a size an operator would notice. The heartbeat's `Absolute(0)` is on purpose: its count changes on every tick, and each new count is what it exists to show.

The other members of `ChannelDeclaration` cover less common cases, such as [`AbsenceIsData`](/reference/mod/channels-and-emission#ChannelDeclaration.AbsenceIsData) for a Topic whose empty value is itself information. [Channels and emission](/reference/mod/channels-and-emission) documents them all.

### A Topic with no payload class

A Topic whose payload is one bare value, such as the `<id>.available` boolean [Wrapping a mod](/guide/wrapping-a-mod#declaring-id-available) recommends, has no class in the contract slice, no `typeof` entry in `ExampleRtConfig.cs`, and so no interface in `contract.ts` or entry in `topic-map.ts`: codegen only reads classes. The plugin declares the `ChannelDeclaration` in `Channels` as for any Topic and publishes `true` or `false` from its source. The client declares the Topic itself, in `client/src/topics.ts`: it adds the id to `TopicPayloadMap` with a `declare module "@ksp-gonogo/sitrep-sdk"` block and calls `registerBarePrimitiveTopic` at load, after which `useTelemetry("<id>.available")` is typed and the Topic is known at runtime like a generated one. The worked snippet is on [Wrapping a mod](/guide/wrapping-a-mod#declaring-id-available).

## Publishing

The heartbeat's sample function, on [the plugin class](/guide/plugin#the-sample), returns a `Dictionary<string, object?>`, not an instance of `ExampleHeartbeat`. The Gonogo mod writes dictionaries, lists, strings, numbers and booleans, and its own contract's types, but not a class of yours. So build the payload as a dictionary whose keys are the payload type's property names in camelCase (`ut`, `ticks`), with an enum as its number and a nested object as another dictionary.

Nothing compares the dictionary with the payload type, so a key spelled differently arrives as a field the client never reads. Hold the two together in the plugin's tests, as the scaffold's `CarriesTheSnapshotUtAndACountThatAdvances` does. A sample the mod cannot write marks the Uplink unavailable, and every subscriber receives an error naming the type.

## The three ways to publish

- **`IUplinkHost.AddChannelSource`**, as here: a function from the tick's snapshot to the payload, run on the Courier thread. For values that need nothing from the game but the snapshot
- **`IUplinkHost.AddSampledSource`**: a function on the main thread that reads the game, and one on the Courier thread that publishes ([The plugin class](/guide/plugin#calling-the-game))
- **`IUplinkHost.Publisher`**: an `IChannelPublisher` you publish to yourself, from the main thread or from the second function of a sampled source, when the value comes from an event of your own rather than a cadence. Pass the game time the value was true at, not the time you send it

Next: [Accepting a command](/guide/commands).
