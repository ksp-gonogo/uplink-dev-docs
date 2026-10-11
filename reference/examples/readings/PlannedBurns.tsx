import { isLocked, useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Text } from "@ksp-gonogo/ui-kit";

export function PlannedBurns() {
  // A Reading: the latest value and how current it is. This draws only a value that is current now,
  // so a held value (the last one received before updates stopped) draws nothing, by choice.
  // Read `maneuver.value` after checking for "observed" or "held" to draw it anyway.
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
