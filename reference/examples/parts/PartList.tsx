import { useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Stack, Stat, Unit } from "@ksp-gonogo/ui-kit";

export function PartList() {
  const vesselParts = useTelemetry("vessel.parts");
  if (vesselParts.state !== "observed") return null;
  return (
    <Stack gap="related-compact">
      {vesselParts.value.parts.map((part) => (
        <Stat key={part.id} label={part.title}>
          <Unit value={part.dryMass} />
        </Stat>
      ))}
    </Stack>
  );
}
