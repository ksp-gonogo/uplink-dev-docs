import { magnitudeOf, value } from "@ksp-gonogo/sitrep-sdk";
import { Grid, Stat, Unit } from "@ksp-gonogo/ui-kit";

const altitude = value("m", 71420);
const speed = value("m/s", 1604.2);

export function Distances() {
  return (
    <Grid minColWidth="7rem" fit align="stretch" gap="related-compact">
      <Stat label="Altitude">
        <Unit value={altitude} />
      </Stat>
      <Stat label="Speed">
        <Unit value={speed} />
      </Stat>
      <Stat label="Altitude in metres">{magnitudeOf(altitude)}</Stat>
    </Grid>
  );
}
