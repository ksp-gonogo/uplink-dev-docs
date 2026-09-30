# Reading a Topic

## The built-in Topics are typed

The SDK ships a map from every Topic the Gonogo mod declares to the payload it carries, so a Topic name and its payload type are checked together.

<<< ../../template/client/src/topics.ts#core

`TopicId` is a union of every built-in Topic name. `TopicPayload<T>` is the payload for one of them. A misspelled name is a compile error, not an empty widget.

`isTopicId` is the runtime half, for narrowing a string that came from outside your code. Use it: a Topic the mod does not declare is only refused at runtime, with an `unknown-topic` error, so a typo costs a round trip to find.

Topics under a computed prefix are deliberately absent from both. A per-processor or per-body sub-topic has no fixed name, so it has no member in the union.

## Your own Topics are not

Nothing generates a type from your plugin's payload class. Declare it in the client, next to the Topic name and the command it pairs with:

<<< ../../template/client/src/topics.ts#own

Keep this file and your C# payload class in step by hand. Nothing checks that they agree.

## Subscribing from a component

<<< ../../template/client/src/useExampleStatus.ts#hook

`subscribe` returns its own unsubscribe function, so returning it from `useEffect` is the whole of the cleanup.

`status` is `undefined` until the first frame arrives. If the Topic already has a value the server sends it on subscribe, so that is usually one round trip rather than a full emission interval. Render an empty state rather than a zero: a value you have not received is not a value of zero, and the two mean opposite things to an operator.

## Reading meta

Every `stream-data` frame carries a `meta` block alongside the payload:

| Field | Meaning |
| --- | --- |
| `validAt` | The UT the value was true at |
| `deliveredAt` | The UT it reached the client |
| `staleness` | `Fresh`, `Held`, `LastBeforeBlackout`, or `Recorded` |
| `quality` | `Loaded` when the vessel is physically simulated, `OnRails` otherwise |
| `active` | Whether the source is currently producing |
| `seq` | Per-Topic sequence number |
| `vantage` | The command centre the frame was delayed for |

`validAt` and `deliveredAt` differ by the light-time delay. Show `validAt` when you show a time, and use `staleness` to decide whether a reading should be dimmed rather than displayed as current.

Next: [Sending a command](/guide/client-commands).
