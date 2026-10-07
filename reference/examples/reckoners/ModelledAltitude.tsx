import { useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Stat, Unit } from "@ksp-gonogo/ui-kit";

export function ModelledAltitude() {
  const flight = useTelemetry("vessel.flight");
  const { reckoning } = flight;
  return (
    <Stat
      label="Altitude"
      detail={reckoning.status === "available" ? "From the forward model" : "As last received"}
    >
      <Unit value={reckoning.status === "available" ? reckoning.value.altitudeAsl : flight.altitudeAsl} />
    </Stat>
  );
}
