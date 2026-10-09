import { TONE_MARK, LineGraph } from "@ksp-gonogo/ui-kit";

const climb = Array.from({ length: 24 }, (_, i) => ({
  x: i * 10,
  y: 70 * (1 - Math.exp(-i / 8)),
}));

export function AltitudeTrend() {
  return (
    <LineGraph
      aria-label="Altitude over the last four minutes"
      height={120}
      series={[{ id: "altitude", color: TONE_MARK.go, points: climb }]}
      thresholds={[{ id: "karman", value: 70, valueText: "70 km" }]}
      thresholdStyle="marker"
    />
  );
}
