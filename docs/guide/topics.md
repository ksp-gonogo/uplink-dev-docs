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

| Member | For |
| --- | --- |
| `Units.UniversalTime` | a moment: the game time something happens or happened |
| `Units.Seconds` | a duration: how long something takes, or how long is left |
| `Units.Metres`, `Units.MetresPerSecond` | a distance or altitude, a speed |
| `Units.Degrees` | an angle, latitude or longitude |
| `Units.Tonnes`, `Units.Kilonewtons`, `Units.Kelvin` | a mass, a thrust, a temperature |
| `Units.Ratio` | a fraction from 0 to 1, drawn as a percentage |
| `Units.Count` | a whole number of things, such as crew or samples |
| `Units.Funds`, `Units.Science`, `Units.Reputation` | a career resource |
| `Units.Id`, `Units.Text`, `Units.Flag`, `Units.Enumeration` | a field that is not a quantity: an identifier, a string, a boolean, a member of an enum |

A string meant to be read by a person, such as a name or a status message, takes `Units.Text`; a string that identifies something and is never read as prose takes `Units.Id`. A property that holds a list of a nested payload type, such as `List<Alarm>`, is supported: codegen writes `Alarm[]`, the nested type needs its own entry in the wire types below, and the units on its fields do the describing, so the list property itself carries no `SitrepUnitAttribute`.

A nullable property reaches the client as a field that can be `null`. The doc comments reach the client too, so say what each field is, its unit and when it is `null`. A paragraph inside `<internal>` stays in the C#, for notes meant only for whoever maintains the plugin.

Name Topics `<uplinkId>.<thing>`. The prefix keeps them clear of every other Uplink's.

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

## Publishing

The heartbeat's sample function, on [the plugin class](/guide/plugin#the-sample), returns a `Dictionary<string, object?>`, not an instance of `ExampleHeartbeat`. The Gonogo mod writes dictionaries, lists, strings, numbers and booleans, and its own contract's types, but not a class of yours. So build the payload as a dictionary whose keys are the payload type's property names in camelCase (`ut`, `ticks`), with an enum as its number and a nested object as another dictionary.

Nothing compares the dictionary with the payload type, so a key spelled differently arrives as a field the client never reads. Hold the two together in the plugin's tests, as the scaffold's `CarriesTheSnapshotUtAndACountThatAdvances` does. A sample the mod cannot write marks the Uplink unavailable, and every subscriber receives an error naming the type.

## The three ways to publish

- **`IUplinkHost.AddChannelSource`**, as here: a function from the tick's snapshot to the payload, run on the Courier thread. For values that need nothing from the game but the snapshot
- **`IUplinkHost.AddSampledSource`**: a function on the main thread that reads the game, and one on the Courier thread that publishes ([The plugin class](/guide/plugin#calling-the-game))
- **`IUplinkHost.Publisher`**: an `IChannelPublisher` you publish to yourself, from the main thread or from the second function of a sampled source, when the value comes from an event of your own rather than a cadence. Pass the game time the value was true at, not the time you send it

Next: [Accepting a command](/guide/commands).
