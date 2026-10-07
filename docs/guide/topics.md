# Publishing a Topic

A Topic is a named stream of one payload shape, such as `example.heartbeat`. This page covers its three parts: the type that describes the payload, the declaration in the manifest, and the source that publishes it.

## The payload type

<<< ../../example/mod-contract/ExamplePayloads.cs#heartbeat{cs}

Every Topic's payload is a class in the contract slice, `mod-contract/`, carrying three attributes:

- **`SitrepContractAttribute`** marks it as a wire type
- **`SitrepTopicAttribute`** names the Topic it is the payload of
- **`TsInterface`**, inside `#if SITREP_CODEGEN`, tells codegen to write a TypeScript interface for it. The attribute exists only in the build `codegen` runs, never in the assembly you ship

A property carrying `SitrepUnitAttribute` reaches the client as a quantity in that unit, such as `Value<"ut">` for `Units.UniversalTime`, so the client draws and converts it without knowing the number's unit. A nullable property reaches the client as a field that can be `null`.

Name Topics `<uplinkId>.<thing>`. The prefix keeps them clear of every other Uplink's.

## The client's types

After changing a payload type, regenerate the client's types and commit what changes:

```bash
cd client
npm run codegen
```

It writes `client/src/__generated__/`: `contract.ts` with an interface per wire type, `topic-map.ts` mapping each Topic to its payload, and the unit maps. `npm run codegen:check` fails when the committed files no longer match the slice, which is the command to run in CI. [A widget](/guide/client-widget) shows how the client uses them.

## Declaring the Topic

The manifest's `Channels` list declares each Topic, with a `ChannelDeclaration`:

<<< ../../example/mod/ExampleUplink.cs#manifest{cs}

- **`Topic`** is the name, exactly as the payload type's `SitrepTopicAttribute` gives it
- **`Delivery`**: `Delivery.LossyLatest` drops a superseded sample under load, which is right for anything a later value replaces. `ReliableOrdered` keeps every sample in order, for events that cannot be dropped
- **`Delay`**: `DelayRole.Delayed` holds each sample for the signal delay between the craft and the operator's command centre, so the operator sees it when a real signal would arrive. `TrueNow` skips the delay, for facts about the ground or about the connection itself, like this heartbeat. A fact about a craft is `Delayed`
- **`Emission`**: an `EmissionPolicy`. `keyframeIntervalUt` is the longest a Topic goes without a sample, in game seconds; `quantum`, an `EmissionQuantum`, is how much a number must change before a new sample goes out early. `EmissionQuantum.Absolute(0)` sends one on any change

Emission is measured in game time, and time warp compresses game time. A value that changes continuously, with a quantum of zero, is published on every tick at any warp, so give such a value a real quantum.

The other members of `ChannelDeclaration` cover less common cases, such as [`AbsenceIsData`](/reference/mod/channels-and-emission#ChannelDeclaration.AbsenceIsData) for a Topic whose empty value is itself information. [Channels and emission](/reference/mod/channels-and-emission) documents them all.

## Publishing

The heartbeat's source returns a dictionary, not an instance of `ExampleHeartbeat`:

<<< ../../example/mod/ExampleUplink.cs#sample{cs}

The Gonogo mod writes dictionaries, lists, strings, numbers and booleans, and its own contract's types, but not a class of yours. So build the payload as a `Dictionary<string, object?>` whose keys are the payload type's property names in camelCase (`ut`, `ticks`), with an enum as its number and a nested object as another dictionary. The payload type describes that dictionary to the client; nothing compares the two, so a key spelled differently arrives as a field the client never reads. The plugin's tests are where to hold them together, as the scaffold's `CarriesTheSnapshotUtAndACountThatAdvances` does.

A sample the mod cannot write marks the Uplink unavailable, and every subscriber receives an error naming the type it could not write.

## The three ways to publish

- **`IUplinkHost.AddChannelSource`**, as here: a function from the tick's snapshot to the payload, run on the Courier thread. For values that need nothing from the game but the snapshot
- **`IUplinkHost.AddSampledSource`**: a function on the main thread that reads the game, and one on the Courier thread that publishes ([The plugin class](/guide/plugin#calling-the-game))
- **`IUplinkHost.Publisher`**: an `IChannelPublisher` you publish to yourself, from the main thread, when the value comes from an event of your own rather than a cadence. Pass the game time the value was true at, not the time you send it

Next: [Accepting a command](/guide/commands).
