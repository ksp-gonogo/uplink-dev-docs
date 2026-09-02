# Publishing a Topic

A Topic is a named stream carrying one payload shape. You declare it in the manifest and publish onto it.

## Declaring

<<< ../../template/mod/ExampleUplink/ExampleUplink.cs#manifest{cs}

Name Topics `<uplinkId>.<thing>`. The prefix is what keeps you clear of every other Uplink.

Each declaration sets four things:

- **`Delivery`**: `LossyLatest` drops superseded frames under load and is right for anything a later value replaces. `ReliableOrdered` keeps every frame in order, for events you cannot drop
- **`Delay`**: `Delayed` rides the light-time delay, so the operator sees the value at the same time the signal would arrive. `TrueNow` bypasses it. Vessel state is `Delayed`. Ground facts, and bare "is this mod present" flags, are `TrueNow`
- **`Emission`**: how often a frame goes out. `keyframeIntervalUt` is the maximum silence in game seconds; `quantum` is how much the value must move to emit early. `EmissionQuantum.Absolute(0)` emits on any change
- **`Topic`**: the wire name

## The payload

A plain class. Public properties are serialised by name.

<<< ../../template/mod/ExampleUplink/Payloads.cs#payload{cs}

Nothing generates a TypeScript type from this. You declare the matching interface in your client by hand, and keeping them in step is your job.

## Publishing

Reading the game must happen on the Unity main thread; packing and sending must not. `AddSampledSource` gives you both, as a pair.

<<< ../../template/mod/ExampleUplink/ExampleUplink.cs#sampling{cs}

The first function runs on the main thread at snapshot cadence. Read the game there and return **plain data**. Never return a `Vessel`, a `Part`, or anything else live: the second function receives exactly that object, off the main thread, and touching a live game object from there will crash KSP.

The trailing Topic arguments to `AddSampledSource` gate the capture on subscription: with nobody watching `example.status`, neither function runs. Only gate a capture that does nothing but read. If your capture also writes state something else depends on, drop the arguments and check `host.IsAnyTopicSubscribed` at the publish instead; the skip is total and silent.

## The other two shapes

`AddSampledSource` is the general case. Two narrower ones exist:

- **`host.AddChannelSource(topic, map)`**: `map` runs on the courier thread with that tick's snapshot and returns the payload. Use it only for values that need no game access, such as a constant availability flag
- **`host.Publisher(topic).Publish(payload, ut)`**: publish directly, from the main thread, when you have your own event to publish from rather than a cadence to sample on

Next: [Accepting a command](/guide/commands).
