import { useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Stack, Text, Unit } from "@ksp-gonogo/ui-kit";

/**
 * A list drawn item by item from the reading, not from its bare payload:
 * `crew.crew[index].experienceLevel` is a reading with the Topic's state, so a
 * held list draws every level with the held mark.
 */
export function CrewLevels() {
  const crew = useTelemetry("vessel.crew");
  if (crew.state !== "observed" && crew.state !== "held") return null;
  return (
    <Stack gap="related-compact">
      {crew.value.crew.map((member, index) => (
        <Text key={member.name ?? index}>
          {member.name} <Unit value={crew.crew[index].experienceLevel} />
        </Text>
      ))}
    </Stack>
  );
}
