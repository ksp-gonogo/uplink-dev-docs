# Messages

Every frame is a JSON object with a `type` discriminant.

<<< ../../../template/client/src/sdkSurface.ts#messages

## Server messages

```ts
type ServerMessage =
  | StreamData<unknown>
  | EventMsg
  | CommandResponse<unknown>
  | CommandAccepted
  | ErrorMsg
  | StreamBinaryMessage;
```

```ts
interface StreamData<T> {
  type: "stream-data";
  topic: string;
  payload: T;
  meta: Meta;
}

interface EventMsg {
  type: "event";
  topic: string;
  name: string;
  meta: Meta;
}

interface CommandResponse<TResult> {
  type: "command-response";
  requestId: string;
  result: TResult;
  meta: Meta;
}

interface CommandAccepted {
  type: "command-accepted";
  requestId: string;
  oneWaySeconds: number;
}

interface ErrorMsg {
  type: "error";
  requestId?: string;
  topic?: string;
  code: string;
  message: string;
}
```

`topic` is typed `string`, not `TopicId`, because an Uplink's own Topics are not in the map. Narrow it yourself with `isTopicId` when you need the built-in payload type.

`EventMsg` carries no payload. The one you will meet is `name: "subscribed"`, acknowledging a subscribe.

`CommandAccepted` arrives the moment a command sets off on the light-time delay, carrying the one-way delay it will travel to the vessel it is addressed to, fixed at dispatch. It means the command is on its way and when to expect an answer, never that anything ran. It is absent for a command that does not ride the delay or whose delay is zero, and for a refusal, which sends an `ErrorMsg` instead, so treat "not accepted yet" as ordinary. Size a timeout from `oneWaySeconds` rather than from the delay you can see: the command's delay depends on the vessel it addresses, not the one you are flying.

`StreamBinaryMessage` never arrives as text. It is a [binary frame](/reference/client/binary-frames) already decoded, in the union so an exhaustive switch has to handle it.

## Client messages

```ts
type ClientMessage = Subscribe | Unsubscribe | SetVantage | CommandRequest<unknown>;
```

```ts
interface Subscribe {
  type: "subscribe";
  topic: string;
}

interface Unsubscribe {
  type: "unsubscribe";
  topic: string;
}

interface SetVantage {
  type: "set-vantage";
  centreId: string;
}

interface CommandRequest<TArgs> {
  type: "command-request";
  requestId: string;
  command: string;
  label: string;
  topic: string;
  vantage?: string;
  args: TArgs;
  sentAt: number;
}
```

<<< ../../../template/client/src/sdkSurface.ts#client-messages

`requestId` is yours to generate and yours to correlate.

`label` and `topic` are carried verbatim onto the command's entry on `system.uplink.pending`, and never read by the mod. `label` is what that entry shows, falling back to the command name when empty; `topic` is what the command is about. Send `""` for either when you have nothing to say.

`vantage` sends this one command from a different command centre than the connection's own. Omit it to use the connection's.

`sentAt` is **UT seconds** (KSP universal time), the same base as `Meta.validAt` — not a
wall-clock timestamp. Send `0`. You have no UT to hand at dispatch that the server would not
know better, and the server stamps the response's `Meta.deliveredAt` off its own clock, so
measure a round trip against your own view time rather than reading this back.

The value is carried onto the response's `Meta.validAt`. Putting a millisecond epoch here
therefore makes that field read as a UT roughly 1.7 trillion seconds in the future, and
`Meta.validAt` is the field you are told to show rather than the arrival time.

`set-vantage` picks the command centre this connection observes and commands from, which decides the delay on everything it receives and sends. `centreId` must name an active command centre, or the server answers with an `unknown-vantage` error and keeps the vantage it had. A connection that never sends one uses the home command centre and follows it if home moves. Every frame's `meta.vantage` says which is in force.

## parseServerMessage

```ts
function parseServerMessage(raw: string): ServerMessage;
```

`ErrorMsg.code` is an open string. No set of values is published, so treat it as a label to log and show `message` to the operator.

Parses the JSON and checks the `type` tag against the five the server sends as text, throwing on anything else, including `stream-binary`, which only ever arrives on the binary lane. That check is what lets the `switch` above narrow exhaustively.

## Meta

```ts
interface Meta {
  source: string;
  validAt: number;
  seq: number;
  deliveredAt: number;
  vantage: string;
  quality: Quality;
  active: boolean;
  staleness: Staleness;
  timelineEpoch: number;
  gapSinceUt?: number;
}
```

| Field | Meaning |
| --- | --- |
| `validAt` | UT the value was true at. Show this, not the arrival time. |
| `deliveredAt` | UT it reached the client. Differs from `validAt` by the light-time delay. |
| `staleness` | `Fresh`, `Held`, `LastBeforeBlackout`, or `Recorded` |
| `quality` | `Loaded` when the vessel is physically simulated, `OnRails` otherwise |
| `active` | Whether the source is currently producing |
| `seq` | Per-Topic sequence number. A gap means frames were dropped, which `LossyLatest` does deliberately. |
| `vantage` | The command centre the frame was delayed for |
| `timelineEpoch` | Changes when the game's timeline is rewound. Compare it against your last-seen value and discard cached history when it differs. |
| `source` | Which producer emitted the frame |
| `gapSinceUt` | Set only on the first sample after a known break in the record: the `validAt` of the last sample before it. Draw a break there rather than joining across it |

`LastBeforeBlackout` is the last thing you heard before the link dropped. It is not current and must not be shown as though it were.

`Recorded` is exact as of its `validAt`, but it did not travel when it was taken: the vessel held it through a loss of signal and replayed it on reacquisition, so it arrives long after the moment it describes and `deliveredAt` is the real arrival. It is never the state of the vessel now.

Detect a rewind from `timelineEpoch`, not from `validAt` going backwards. Deliveries can be reordered or coalesced, which hides the backward jump; the epoch changes atomically.

## Enums

```ts
enum Quality { OnRails = 0, Loaded = 1 }
enum Staleness { Fresh = 0, Held = 1, LastBeforeBlackout = 2, Recorded = 3 }
```

<<< ../../../template/client/src/sdkSurface.ts#enums
