# Connecting

`@ksp-gonogo/sitrep-sdk` types the wire and validates incoming frames. It does not open the socket, hold subscriptions, or track requests. That client is yours, and it is small.

## Imports

<<< ../../template/client/src/stream.ts#imports

`parseServerMessage` is the only runtime export you need. It parses the JSON and rejects an envelope whose `type` is not one the server sends, so everything downstream can switch on `message.type` and be narrowed by the compiler.

## The client

<<< ../../template/client/src/stream.ts#class

Subscribing sends a `subscribe` frame the first time a Topic gets a listener, and an `unsubscribe` frame when the last one goes.

The server acknowledges a successful subscribe with an `event` frame named `subscribed`, and answers a Topic it does not know with nothing at all. Watch for that acknowledgement if you want to distinguish "no data yet" from "wrong name".

If the Topic already has a value, it is delivered immediately on subscribe rather than at the next emission.

## Routing

<<< ../../template/client/src/stream.ts#dispatch

Four message types arrive:

| `type` | Carries |
| --- | --- |
| `stream-data` | A payload on a Topic, plus `meta` |
| `command-response` | The result for a `requestId` you sent |
| `error` | A failure, with `code` and `message`, and `requestId` when it answers a command |
| `event` | A named occurrence on a Topic, with no payload. `subscribed` is one. |

`requestId` is yours to choose and yours to correlate. Nothing else in the protocol pairs a request with its answer.

Next: [Reading a Topic](/guide/client-topics).
