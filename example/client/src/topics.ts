// #region maps
import { registerTopicUnits, registerTypeUnits, registerUplinkCommand } from "@ksp-gonogo/sitrep-sdk";
import {
  GENERATED_COMMAND_IDS,
  GENERATED_COMMAND_RAIL,
  type GeneratedCommandArgsMap,
  type GeneratedCommandReplyMap,
} from "./__generated__/command-map.js";
import type { ExampleHeartbeat, ExampleResetArgs } from "./__generated__/contract.js";
import {
  GENERATED_TOPIC_SHAPES,
  GENERATED_TOPIC_UNITS,
  GENERATED_TYPE_SHAPES,
  GENERATED_TYPE_UNITS,
} from "./__generated__/units.js";

// Tells the sdk what each of this Uplink's Topics carries, so useTelemetry("example.heartbeat") is typed. Add a line for every Topic the contract slice declares.
declare module "@ksp-gonogo/sitrep-sdk" {
  interface TopicPayloadMap {
    "example.heartbeat": ExampleHeartbeat;
  }
  // Every command the contract slice declares, from the command map codegen writes, so useCommand("example.reset") is typed.
  interface CommandArgsMap extends GeneratedCommandArgsMap {}
  interface CommandReplyMap extends GeneratedCommandReplyMap {}
}
// #endregion maps

// The unit of each field, from the [SitrepUnit] attributes in the contract slice. It is what lets <Unit> write a value with its unit.
for (const [topic, units] of Object.entries(GENERATED_TOPIC_UNITS)) {
  registerTopicUnits(topic, units, GENERATED_TOPIC_SHAPES[topic] ?? {});
}
for (const [typeName, units] of Object.entries(GENERATED_TYPE_UNITS)) {
  registerTypeUnits(typeName, units, GENERATED_TYPE_SHAPES[typeName] ?? {});
}

// #region command
// How each command travels, as its [SitrepCommand] in the slice declares it, so the app draws a sent command right.
for (const id of GENERATED_COMMAND_IDS) {
  registerUplinkCommand(id, GENERATED_COMMAND_RAIL[id]);
}
// #endregion command

/**
 * What `example.heartbeat` carries. The fields and their descriptions are generated
 * from the C# type of the same name in `mod-contract/`, which is the one place
 * to change them.
 *
 * @example
 * ```tsx
 * function Ticks() {
 *   const heartbeat = useTelemetry("example.heartbeat");
 *   if (heartbeat.state !== "observed") return null;
 *   return <Unit value={heartbeat.value.ticks} />;
 * }
 * ```
 */
export type { ExampleHeartbeat, ExampleResetArgs };
