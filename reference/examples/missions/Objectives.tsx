import { MissionObjectiveState, useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Badge, NullValue, Stack, Text } from "@ksp-gonogo/ui-kit";

export function Objectives() {
  const mission = useTelemetry("missions.active");
  // The game says there is no mission: no mission game, none set up, or the expansion not installed.
  if (mission.state === "absent") return <Text>No mission running</Text>;
  if (mission.state !== "observed") return null;
  return (
    <Stack gap="related-compact">
      <Text weight="semibold">{mission.value.name ?? <NullValue />}</Text>
      {mission.value.objectives?.map((objective) => (
        <Text key={objective.id}>
          {objective.title}{" "}
          {/* A state that could not be read is said as unknown, never shown as the first member, Pending. */}
          <Badge
            size="sm"
            tone={objective.state === MissionObjectiveState.Reached ? "go" : "info"}
          >
            {objective.state == null ? "Unknown" : MissionObjectiveState[objective.state]}
          </Badge>
        </Text>
      ))}
    </Stack>
  );
}
