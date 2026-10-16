import { Graph, TONE_MARK } from "@ksp-gonogo/ui-kit";

const x = Array.from({ length: 24 }, (_, i) => i * 10);
const y = x.map((_, i) => 70 * (1 - Math.exp(-i / 8)));

export function ClimbGraph() {
  return (
    <Graph
      aria-label="Altitude over the last four minutes"
      series={[{ id: "altitude", label: "Altitude", axis: "primary", color: TONE_MARK.go, data: { x, y } }]}
      xDomain={[0, 230]}
      yAxisLabel="Altitude (km)"
      xAxisLabel="Elapsed (s)"
    />
  );
}
