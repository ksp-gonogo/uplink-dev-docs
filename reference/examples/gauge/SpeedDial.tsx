import { useTelemetry, value } from "@ksp-gonogo/sitrep-sdk";
import { Dial } from "@ksp-gonogo/ui-kit";

export function SpeedDial() {
  const flight = useTelemetry("vessel.flight");
  return (
    <Dial
      ariaLabel="Surface speed"
      value={flight.surfaceSpeed}
      min={value("m/s", 0)}
      max={value("m/s", 2400)}
      startAngle={225}
      sweep={270}
      zones={[{ from: value("m/s", 1800), to: value("m/s", 2400), color: "var(--color-warn-mark)" }]}
    />
  );
}
