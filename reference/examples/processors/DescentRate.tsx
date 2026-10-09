import { defineUplinkClient, useProcessor } from "@ksp-gonogo/sitrep-sdk";
import { Stat, Unit } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "descent",
  version: "1.0.0",
  name: "Descent",
  description: "Reference example: Descent.",
});

const DESCENT_RATE = uplink.registerProcessor({
  id: "rate",
  deps: ["vessel.flight"],
  // verticalSpeed is a Value, so it is tested and turned positive by its own methods rather than as a bare number.
  compute: ([flight]) =>
    flight && flight.verticalSpeed.isNegative()
      ? flight.verticalSpeed.abs()
      : undefined,
});

export function DescentRate() {
  const rate = useProcessor(DESCENT_RATE);
  return (
    <Stat label="Descent rate">{rate ? <Unit value={rate} /> : "Not descending"}</Stat>
  );
}
