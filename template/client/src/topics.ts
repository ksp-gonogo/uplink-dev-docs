// #region core
import {
  isTopicId,
  type StreamData,
  type TopicId,
  type TopicPayload,
} from "@ksp-gonogo/sitrep-sdk";

/** Narrows a frame from any Topic to a frame from the Topic you asked for. */
export function payloadOf<T extends TopicId>(
  topic: T,
  frame: StreamData<unknown>,
): TopicPayload<T> | undefined {
  return frame.topic === topic ? (frame.payload as TopicPayload<T>) : undefined;
}

/** Rejects a Topic string the mod does not declare. */
export function assertCoreTopic(topic: string): TopicId {
  if (!isTopicId(topic)) {
    throw new Error(`Unknown Topic: ${topic}`);
  }
  return topic;
}
// #endregion core

// #region own
/**
 * Your Uplink's own Topics are not in the SDK's generated map, declare the
 * payload here, matching the C# class you publish.
 */
export interface ExampleStatus {
  mode: number;
  enabled: boolean;
}

export const EXAMPLE_STATUS_TOPIC = "example.status";
export const EXAMPLE_SET_MODE_COMMAND = "example.setMode";

export interface SetModeArgs {
  mode: number;
}
// #endregion own
