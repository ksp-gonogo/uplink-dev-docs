import { MissionObjectiveState, useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Badge, Stack, Text } from "@ksp-gonogo/ui-kit";

export function Objectives() {
  const mission = useTelemetry("missions.active");
  if (mission.state !== "observed") return <Text>No mission running</Text>;
  return (
    <Stack gap="related-compact">
      <Text weight="semibold">{mission.value.name}</Text>
      {mission.value.objectives?.map((objective) => (
        <Text key={objective.id}>
          {objective.title}{" "}
          <Badge
            size="sm"
            tone={objective.state === MissionObjectiveState.Reached ? "go" : "info"}
          >
            {MissionObjectiveState[objective.state ?? 0]}
          </Badge>
        </Text>
      ))}
    </Stack>
  );
}
