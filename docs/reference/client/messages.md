# Messages

Every frame is a JSON object with a `type` discriminant.

<<< ../../../template/client/src/sdkSurface.ts#messages

## Server messages

```ts
type ServerMessage =
  | StreamData<unknown>
  | EventMsg
  | CommandResponse<unknown>
  | ErrorMsg;
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

## Client messages

```ts
type ClientMessage = Subscribe | Unsubscribe | CommandRequest<unknown>;
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

interface CommandRequest<TArgs> {
  type: "command-request";
  requestId: string;
  command: string;
  args: TArgs;
  sentAt: number;
}
```

<<< ../../../template/client/src/sdkSurface.ts#client-messages

`requestId` is yours to generate and yours to correlate. `sentAt` is a wall-clock millisecond timestamp.

The server also accepts a `set-vantage` message, which this union does not include and this documentation does not specify. Nothing published describes its shape.

## parseServerMessage

```ts
function parseServerMessage(raw: string): ServerMessage;
```

`ErrorMsg.code` is an open string. No set of values is published, so treat it as a label to log and show `message` to the operator.

Parses the JSON and checks the `type` tag against the four the server sends, throwing on anything else. That check is what lets the `switch` above narrow exhaustively.

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
  confidence?: number;
}
```

| Field | Meaning |
| --- | --- |
| `validAt` | UT the value was true at. Show this, not the arrival time. |
| `deliveredAt` | UT it reached the client. Differs from `validAt` by the light-time delay. |
| `staleness` | `Fresh`, `HeldStale`, or `LastBeforeBlackout` |
| `quality` | `Loaded` when the vessel is physically simulated, `OnRails` otherwise |
| `active` | Whether the source is currently producing |
| `seq` | Per-Topic sequence number. A gap means frames were dropped, which `LossyLatest` does deliberately. |
| `vantage` | The command centre the frame was delayed for |
| `timelineEpoch` | Changes when the game's timeline is rewound. Compare it against your last-seen value and discard cached history when it differs. |
| `source` | Which producer emitted the frame |
| `confidence` | Optional, present only where the producer estimates one |

`LastBeforeBlackout` is the last thing you heard before the link dropped. It is not current and must not be shown as though it were.

Detect a rewind from `timelineEpoch`, not from `validAt` going backwards. Deliveries can be reordered or coalesced, which hides the backward jump; the epoch changes atomically.

## Enums

```ts
enum Quality { OnRails = 0, Loaded = 1 }
enum Staleness { Fresh = 0, HeldStale = 1, LastBeforeBlackout = 2 }
```

<<< ../../../template/client/src/sdkSurface.ts#enums
