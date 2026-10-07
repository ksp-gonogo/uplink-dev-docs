import { useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Grid, Stat, Unit } from "@ksp-gonogo/ui-kit";

export function WarpReadout() {
  const warp = useTelemetry("time.warp");
  return (
    <Grid minColWidth="7rem" fit align="stretch" gap="related-compact">
      <Stat label="Time warp">
        <Unit value={warp.warpRate} />
      </Stat>
      <Stat label="State" tone={warp.paused.value ? "caution" : "neutral"}>
        {warp.paused.value ? "Paused" : "Running"}
      </Stat>
    </Grid>
  );
}
