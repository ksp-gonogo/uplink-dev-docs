import { isLocked, useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Text } from "@ksp-gonogo/ui-kit";

export function PlannedBurns() {
  const maneuver = useTelemetry("vessel.maneuver");
  if (maneuver.state !== "observed") return null;
  const { nodes } = maneuver.value;
  if (isLocked(nodes)) {
    return <Text>Missing: {nodes.locked.map((unlock) => unlock.name).join(", ")}</Text>;
  }
  return <Text>{nodes.length} planned burns</Text>;
}
