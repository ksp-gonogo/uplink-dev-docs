import { useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Badge, Stack, Stat, Text, Unit } from "@ksp-gonogo/ui-kit";

export function Crew() {
  const crew = useTelemetry("vessel.crew");
  if (crew.state !== "observed") return null;
  return (
    <Stack gap="related-compact">
      <Stat label="Seats filled">
        <Unit value={crew.value.count} /> of <Unit value={crew.value.capacity} />
      </Stat>
      {crew.value.crew.map((kerbal) => (
        <Text key={kerbal.name}>
          {kerbal.name} <Badge size="sm">{kerbal.trait}</Badge>
        </Text>
      ))}
    </Stack>
  );
}
