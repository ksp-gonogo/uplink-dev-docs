# Topics

The SDK maps every Topic the Gonogo mod declares to the payload it carries.

<<< ../../../template/client/src/sdkSurface.ts#topics

```ts
type TopicId = keyof TopicPayloadMap;
type TopicPayload<T extends TopicId> = TopicPayloadMap[T];

declare const TOPIC_IDS: readonly TopicId[];
declare function isTopicId(value: string): value is TopicId;
```

`TopicPayload<"vessel.orbit">` is the payload interface for that Topic. Misspell the name and it is a compile error, which matters here more than usual: **an unknown Topic is only refused at runtime**, with an `unknown-topic` error frame.

## The Topics

54 built-in Topics at `0.0.1`.

| Prefix | Topics |
| --- | --- |
| `career.` | `mode`, `status` |
| `comms.` | `connectivity`, `controlState`, `dataRate`, `delay`, `linkMargin`, `linkQuality`, `network`, `path`, `signalStrength` |
| `crash.` | `lastCrash` |
| `dv.` | `stages`, `summary` |
| `game.` | `dlc` |
| `kos.` | `processors` |
| `ksp.` | `revertAvailability` |
| `parts.` | `power`, `robotics` |
| `robotics.` | `available` |
| `scansat.` | `available`, `scanningVessels`, `science` |
| `science.` | `deployed`, `experiments`, `instruments`, `lab`, `sensors` |
| `spaceCenter.` | `crewRoster`, `launchSites`, `partsAvailable`, `savedShips`, `scene` |
| `system.` | `bodies`, `vessels` |
| `time.` | `warp` |
| `vessel.` | `attitude`, `comms`, `control`, `crew`, `dock`, `flight`, `identity`, `maneuver`, `orbit`, `orbit.truth`, `parts`, `physics.mode`, `propulsion`, `resources`, `structure`, `surface`, `target`, `thermal` |

Read `TOPIC_IDS` for the authoritative list at the version you installed.

## Topics the map does not include

Two kinds are missing from `TopicPayloadMap`, and neither is a mistake you can work around by casting `TopicId`:

- Your Uplink's own Topics (below)
- A `system.uplinks` Topic, which reports each installed Uplink's availability and health

Subscribe to those by string.

## Topics under a computed prefix

Some namespaces are keyed at runtime: one sub-topic per processor, per body, per vessel. Those names are not fixed, so they have no member in the union and `isTopicId` returns false for them. Subscribe by string and type the payload yourself.

## Your own Topics

Not here, and not generated. Declare the payload interface in your client, next to the Topic name:

<<< ../../../template/client/src/topics.ts#own

Nothing checks it against the C# class it mirrors.

## Narrowing a frame

<<< ../../../template/client/src/topics.ts#core

`StreamData.topic` is `string`, so a frame arrives untyped by Topic. `payloadOf` trades the runtime check for the compile-time type.
