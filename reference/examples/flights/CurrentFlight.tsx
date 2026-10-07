import { SITUATION_NAMES, useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Badge, Cluster, Text } from "@ksp-gonogo/ui-kit";

export function CurrentFlight() {
  const flight = useTelemetry("flight.current");
  if (flight.state !== "observed") return <Text>No flight under way</Text>;
  return (
    <Cluster>
      <Text weight="semibold">{flight.value.vesselName}</Text>
      <Badge tone="info">{SITUATION_NAMES[flight.value.phase]}</Badge>
    </Cluster>
  );
}
