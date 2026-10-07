import {
  type CommandResult,
  registerTopicUnits,
  registerTypeUnits,
  registerUplinkCommand,
} from "@ksp-gonogo/sitrep-sdk";
import type { ExampleHeartbeat, ExampleResetArgs } from "./__generated__/contract.js";
import {
  GENERATED_TOPIC_SHAPES,
  GENERATED_TOPIC_UNITS,
  GENERATED_TYPE_SHAPES,
  GENERATED_TYPE_UNITS,
} from "./__generated__/units.js";

// #region maps
declare module "@ksp-gonogo/sitrep-sdk" {
  interface TopicPayloadMap {
    "example.heartbeat": ExampleHeartbeat;
  }
  interface CommandArgsMap {
    "example.reset": ExampleResetArgs;
  }
  interface CommandReplyMap {
    "example.reset": CommandResult;
  }
}
// #endregion maps

for (const [topic, units] of Object.entries(GENERATED_TOPIC_UNITS)) {
  registerTopicUnits(topic, units, GENERATED_TOPIC_SHAPES[topic] ?? {});
}
for (const [typeName, units] of Object.entries(GENERATED_TYPE_UNITS)) {
  registerTypeUnits(typeName, units, GENERATED_TYPE_SHAPES[typeName] ?? {});
}

// #region command
// The plugin declares example.reset TrueNow and returns a CommandResult, so it runs on arrival and replies.
registerUplinkCommand("example.reset", { replies: true, delayed: false });
// #endregion command

export type { ExampleHeartbeat, ExampleResetArgs };
