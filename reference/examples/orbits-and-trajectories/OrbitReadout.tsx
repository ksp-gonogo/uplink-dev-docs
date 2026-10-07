import { useTelemetry } from "@ksp-gonogo/sitrep-sdk";
import { Grid, Stat, Unit } from "@ksp-gonogo/ui-kit";

export function OrbitReadout() {
  const orbit = useTelemetry("vessel.orbit");
  return (
    <Grid minColWidth="7rem" fit align="stretch" gap="related-compact">
      <Stat label="Eccentricity">
        <Unit value={orbit.ecc} />
      </Stat>
      <Stat label="Inclination">
        <Unit value={orbit.inc} />
      </Stat>
      <Stat label="Time to apoapsis">
        <Unit value={orbit.timeToAp} />
      </Stat>
      <Stat label="Time to periapsis">
        <Unit value={orbit.timeToPe} />
      </Stat>
    </Grid>
  );
}
