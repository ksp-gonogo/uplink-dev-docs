import { useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Cluster, Unit } from "@ksp-gonogo/ui-kit";

export function Altitude() {
  const flight = useTelemetry("vessel.flight");
  return (
    <Cluster gap="related-compact">
      <Unit value={flight.altitudeAsl} />
      <Unit value={flight.surfaceSpeed} format="km/h" />
    </Cluster>
  );
}
