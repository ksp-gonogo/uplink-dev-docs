/**
 * Touches every SDK export the reference documents, so the signatures there are
 * compiled rather than transcribed. Nothing imports this file.
 */
// #region messages
import {
  CommandErrorCode,
  Quality,
  SDK_VERSION,
  Staleness,
  TOPIC_IDS,
  isTopicId,
  parseServerMessage,
  type ClientMessage,
  type CommandAccepted,
  type CommandRequest,
  type CommandResponse,
  type ErrorMsg,
  type EventMsg,
  type GameState,
  type Meta,
  type ServerMessage,
  type SetVantage,
  type StreamBinaryMessage,
  type StreamData,
  type Subscribe,
  type TopicId,
  type TopicPayload,
  type TopicPayloadMap,
  type Unsubscribe,
} from "@ksp-gonogo/sitrep-sdk";

export function describe(raw: string): string {
  const message: ServerMessage = parseServerMessage(raw);
  switch (message.type) {
    case "stream-data": {
      const frame: StreamData<unknown> = message;
      const meta: Meta = frame.meta;
      const gap = meta.gapSinceUt == null ? "" : `, nothing since ${meta.gapSinceUt}`;
      return `${frame.topic} valid at ${meta.validAt}${gap}`;
    }
    case "stream-binary": {
      const frame: StreamBinaryMessage = message;
      return `${frame.topic}: ${frame.segments.length} segments`;
    }
    case "command-accepted": {
      const accepted: CommandAccepted = message;
      return `${accepted.requestId} arrives in ${accepted.oneWaySeconds}s`;
    }
    case "command-response": {
      const response: CommandResponse<unknown> = message;
      return `answer to ${response.requestId}`;
    }
    case "error": {
      const failure: ErrorMsg = message;
      return `${failure.code}: ${failure.message}`;
    }
    case "event": {
      const event: EventMsg = message;
      return `${event.topic} ${event.name}`;
    }
    case "game-state": {
      const game: GameState = message;
      return `${game.scene} ${game.state}`;
    }
  }
}
// #endregion messages

// #region client-messages
export const outbound: ClientMessage[] = [
  { type: "subscribe", topic: "vessel.orbit" } satisfies Subscribe,
  { type: "unsubscribe", topic: "vessel.orbit" } satisfies Unsubscribe,
  { type: "set-vantage", centreId: "ground:Kerbal Space Center" } satisfies SetVantage,
  {
    type: "command-request",
    requestId: "req-0",
    command: "example.setMode",
    label: "",
    topic: "",
    args: { mode: 1 },
    sentAt: 0,
  } satisfies CommandRequest<{ mode: number }>,
];
// #endregion client-messages

// #region topics
export const topicCount: number = TOPIC_IDS.length;

export function isKnown(topic: string): topic is TopicId {
  return isTopicId(topic);
}

/** The payload of a Topic, keyed by the Topic's own name. */
export type OrbitPayload = TopicPayload<"vessel.orbit">;
export type EveryPayload = TopicPayloadMap;
// #endregion topics

// #region enums
export const enums = {
  fresh: Staleness.Fresh,
  held: Staleness.Held,
  lastBeforeBlackout: Staleness.LastBeforeBlackout,
  recorded: Staleness.Recorded,
  loaded: Quality.Loaded,
  onRails: Quality.OnRails,
  outOfRange: CommandErrorCode.Range,
  version: SDK_VERSION,
};
// #endregion enums
