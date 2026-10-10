import { defineUplinkClient, useProcessor, value } from "@ksp-gonogo/sitrep-sdk";
import { Stat, Unit } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "descent",
  version: "1.0.0",
  name: "Descent",
  description: "Derives the rate a craft is descending at from its vertical speed.",
});

const DESCENT_RATE = uplink.registerProcessor({
  id: "rate",
  deps: ["vessel.flight"],
  // verticalSpeed is a Value, so it is tested and turned positive by its own methods rather than as a bare number.
  compute: ([flight]) =>
    flight
      ? flight.verticalSpeed.isNegative()
        ? flight.verticalSpeed.abs()
        : value("m/s", 0)
      : undefined,
});

export function DescentRate() {
  const rate = useProcessor(DESCENT_RATE);
  return (
    <Stat label="Descent rate">
      {rate === undefined ? "Waiting for flight data" : rate.isZero() ? "Not descending" : <Unit value={rate} />}
    </Stat>
  );
}
