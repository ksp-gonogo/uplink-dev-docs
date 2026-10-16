import { Sparkline } from "@ksp-gonogo/ui-kit";

const climb = Array.from({ length: 24 }, (_, i) => 70 * (1 - Math.exp(-i / 8)));

export function ClimbTrend() {
  return (
    <Sparkline
      aria-label="Altitude over the last four minutes"
      values={climb}
      width={160}
      height={40}
    />
  );
}
