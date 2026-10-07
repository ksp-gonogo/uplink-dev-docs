# Connecting

`@ksp-gonogo/sitrep-sdk` types the wire and validates incoming frames. It does not open the socket, hold subscriptions, or track requests. That client is yours, and it is small.

## Imports

<<< ../../template/client/src/stream.ts#imports

`parseServerMessage` is the only runtime export you need. It parses the JSON and rejects an envelope whose `type` is not one the server sends, so everything downstream can switch on `message.type` and be narrowed by the compiler.

## The client

Two types it carries:

<<< ../../template/client/src/stream.ts#types

<<< ../../template/client/src/stream.ts#class

Subscribing sends a `subscribe` frame the first time a Topic gets a listener, and an `unsubscribe` frame when the last one goes.

The server acknowledges a successful subscribe with an `event` frame named `subscribed`, and answers a Topic it does not know with an `error` frame, code `unknown-topic`, whose message says whether the Uplink behind it is loaded at all. `onEvent` and `onError` are how you see each:

```ts
stream.onEvent("example.status", (name) => {
  if (name === "subscribed") markTopicReal();
});
stream.onError("example.status", (code, message) => showProblem(code, message));
```

The mod sends every frame as a binary WebSocket message, JSON included, which is why the constructor sets `binaryType` and hands each message to `readFrame` before parsing. [Binary lane](/reference/client/binary-lane) covers the other lane.

If the Topic already has a value, it is delivered immediately on subscribe rather than at the next emission.

## Routing

<<< ../../template/client/src/stream.ts#dispatch

Four message types arrive:

| `type` | Carries |
| --- | --- |
| `stream-data` | A payload on a Topic, plus `meta` |
| `command-response` | The result for a `requestId` you sent |
| `error` | A failure, with `code` and `message`, plus `requestId` when it answers a command or `topic` when it concerns a Topic |
| `event` | A named occurrence on a Topic, with no payload. `subscribed` is one. |

`requestId` is yours to choose and yours to correlate. Nothing else in the protocol pairs a request with its answer.

## Sending

A socket that has not finished its handshake throws on `send`, and React will subscribe on mount long before that. Everything written early waits in a backlog:

<<< ../../template/client/src/stream.ts#send

## Settling

<<< ../../template/client/src/stream.ts#settle

A `Delayed` command can be in flight for minutes, which is long enough for the socket to go away underneath it. Reject everything outstanding when it does, or the UI stays pending forever with nothing coming.

## The whole file

::: details stream.ts
<<< ../../template/client/src/stream.ts
:::

Next: [Reading a Topic](/guide/client-topics).
