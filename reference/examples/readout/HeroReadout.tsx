import { useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Readout, ReadoutCaption, Unit } from "@ksp-gonogo/ui-kit";

export function HeroReadout() {
  const flight = useTelemetry("vessel.flight");
  return (
    <Readout size="hero">
      <Unit value={flight.altitudeAsl} />
      <ReadoutCaption>Altitude</ReadoutCaption>
    </Readout>
  );
}
