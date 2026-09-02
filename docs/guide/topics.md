# Publishing a Topic

A Topic is a named stream carrying one payload shape. You declare it in the manifest and publish onto it.

## Declaring

<<< ../../template/mod/ExampleUplink/ExampleUplink.cs#manifest{cs}

Name Topics `<uplinkId>.<thing>`. The prefix is what keeps you clear of every other Uplink.

Four of the seven members matter for a first Topic:

- **`Topic`**: the wire name
- **`Delivery`**: `LossyLatest` drops superseded frames under load and is right for anything a later value replaces. `ReliableOrdered` keeps every frame in order, for events you cannot drop
- **`Delay`**: `Delayed` rides the light-time delay, so the operator sees the value at the same time the signal would arrive. `TrueNow` bypasses it. Vessel state is `Delayed`. Ground facts, and bare "is this mod present" flags, are `TrueNow`
- **`Emission`**: how often a frame goes out. `keyframeIntervalUt` is the maximum silence in game seconds; `quantum` is how much the value must move to emit early. `EmissionQuantum.Absolute(0)` emits on any change

The other three change less common behaviour, and one of them decides whether "nothing to report" reaches the client at all. [Channels](/reference/mod/channels) covers all seven.

Emission cadence is denominated in UT, and time warp compresses UT into wall-clock time. A Topic emitting on any change at 100,000x is emitting a hundred thousand times faster than it looks on the page, so give anything that changes continuously a real `quantum`.

## The payload

**A dictionary, not a class of your own.** The mod's serialiser writes dictionaries, arrays, strings, numbers and booleans, plus the payload types the mod itself declares. It has no reflection over your properties, and a frame carrying a shape it cannot write is dropped: no error, no log line, and the client sees the subscribe acknowledgement and then nothing.

<<< ../../template/mod/ExampleUplink/Payloads.cs#payload{cs}

Three rules follow:

- **Keys are written exactly as you supply them**, so use camelCase and match your client
- **Cast an enum to its integer value** before putting it in. A boxed enum is one of the shapes that gets dropped
- **Nest with more dictionaries and lists**, not with objects

Nothing generates a TypeScript type from this. You declare the matching interface in your client by hand, and keeping them in step is your job.

## Publishing

Reading the game must happen on the Unity main thread; packing and sending must not. `AddSampledSource` gives you both, as a pair.

<<< ../../template/mod/ExampleUplink/ExampleUplink.cs#sampling{cs}

The first function runs on the main thread at snapshot cadence, and is handed the tick's [`KspSnapshot`](/reference/mod/host#kspsnapshot) for its UT. Read the game there and return **plain data**. Never return a `Vessel`, a `Part`, or anything else live: the second function receives exactly that object, off the main thread, and touching a live game object from there will crash KSP.

`AddSampledSource` has a second overload taking trailing Topic prefixes, which gates the capture on subscription: with nobody watching, neither function runs. A full Topic name is a prefix of itself, so `"example.status"` and `"example."` are both valid.

**Only gate a capture that does nothing but read.** The skip is total and silent, so a capture that also updates state something else depends on will stop doing it the moment the last subscriber goes. Where a capture writes, leave it ungated and check `host.IsAnyTopicSubscribed` at the publish instead.

## The other two shapes

`AddSampledSource` is the general case. Two narrower ones exist:

- **`host.AddChannelSource(topic, map)`**: `map` runs on the courier thread with that tick's snapshot and returns the payload. Use it only for values that need no game access, such as a constant availability flag
- **`host.Publisher(topic).Publish(payload, ut)`**: publish directly, from the main thread, when you have your own event to publish from rather than a cadence to sample on. `ut` is the time the value was true at, not the time you are sending it. Full signatures in [IUplinkHost](/reference/mod/host)

Next: [Accepting a command](/guide/commands).
