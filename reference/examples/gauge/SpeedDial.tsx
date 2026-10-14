import { useTelemetry, value } from "@ksp-gonogo/sitrep-sdk";
import { TONE_MARK, Dial } from "@ksp-gonogo/ui-kit";

export function SpeedDial() {
  const flight = useTelemetry("vessel.flight");
  return (
    <Dial
      aria-label="Surface speed"
      value={flight.surfaceSpeed}
      min={value("m/s", 0)}
      max={value("m/s", 2400)}
      startAngle={225}
      sweep={270}
      // TONE_MARK maps a tone to the colour a mark in that tone is drawn in, so the zone follows the theme.
      zones={[{ from: value("m/s", 1800), to: value("m/s", 2400), color: TONE_MARK.warn }]}
    />
  );
}
