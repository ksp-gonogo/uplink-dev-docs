// npm install @ksp-gonogo/sitrep-sdk @ksp-gonogo/ui-kit
import { isLocked, useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Text } from "@ksp-gonogo/ui-kit";

export function PlannedBurns() {
  // A Reading: the latest value and how current it is. Its `state` is "observed" (current now),
  // "held" (the last value received before updates stopped), "pending", "unowned" or "absent";
  // only the first two carry a `value`. This draws only a current value, so a held one draws nothing,
  // by choice. Check for "observed" or "held" before reading `maneuver.value` to draw it anyway.
  const maneuver = useTelemetry("vessel.maneuver");
  if (maneuver.state !== "observed") return null;
  const { nodes } = maneuver.value;
  // A field this save has not unlocked arrives as a LockedValue, whose `locked` lists each missing unlock
  // with its `name`, never as an empty list.
  if (isLocked(nodes)) {
    return <Text>Missing: {nodes.locked.map((unlock) => unlock.name).join(", ")}</Text>;
  }
  return <Text>{nodes.length} planned burns</Text>;
}
