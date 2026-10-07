import { useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Grid, NullValue, Stat, Unit } from "@ksp-gonogo/ui-kit";

export function WarpReadout() {
  const warp = useTelemetry("time.warp");
  const paused = warp.state === "observed" ? warp.value.paused : null;
  return (
    <Grid minColWidth="7rem" fit align="stretch" gap="related-compact">
      <Stat label="Time warp">
        <Unit value={warp.warpRate} />
      </Stat>
      <Stat label="State" tone={paused ? "caution" : "neutral"}>
        {paused === null ? <NullValue /> : paused ? "Paused" : "Running"}
      </Stat>
    </Grid>
  );
}
