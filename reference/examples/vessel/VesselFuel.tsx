import { useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Meter, Stack, Text } from "@ksp-gonogo/ui-kit";

export function VesselFuel() {
  const identity = useTelemetry("vessel.identity");
  const resources = useTelemetry("vessel.resources");
  if (identity.state !== "observed" || resources.state !== "observed") {
    return null;
  }
  const fuel = resources.value.resources.LiquidFuel;
  return (
    <Stack gap="related-compact">
      <Text weight="semibold">{identity.value.name}</Text>
      {fuel ? (
        <Meter label="Liquid fuel" value={fuel.current} capacity={fuel.max} />
      ) : (
        <Text>Carries no liquid fuel</Text>
      )}
    </Stack>
  );
}
