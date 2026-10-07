import { isLocked, useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Text } from "@ksp-gonogo/ui-kit";

export function PlannedBurns() {
  // A Reading: the latest value and how current it is. This draws only a value that is current now.
  const maneuver = useTelemetry("vessel.maneuver");
  if (maneuver.state !== "observed") return null;
  const { nodes } = maneuver.value;
  // A field this save has not unlocked arrives as a lock naming what is missing, never as an empty list.
  if (isLocked(nodes)) {
    return <Text>Missing: {nodes.locked.map((unlock) => unlock.name).join(", ")}</Text>;
  }
  return <Text>{nodes.length} planned burns</Text>;
}
