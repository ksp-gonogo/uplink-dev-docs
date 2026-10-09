import {
  defineUplinkClient,
  registerAugment,
  useTelemetry,
} from "@ksp-gonogo/sitrep-sdk";
import { Grid, Stat, Unit } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "crew-seats",
  version: "1.0.0",
  name: "Crew Seats",
  description: "Reference example: Crew Seats.",
});

function Seats() {
  const crew = useTelemetry("vessel.crew");
  return (
    <Grid minColWidth="7rem" fit align="stretch" gap="related-compact">
      <Stat label="Aboard">
        <Unit value={crew.count} />
      </Stat>
      <Stat label="Seats">
        <Unit value={crew.capacity} />
      </Stat>
    </Grid>
  );
}

registerAugment({
  id: "crew-seats-summary",
  augments: "crew-status.summary",
  component: Seats,
  channels: ["vessel.crew"],
  owner: uplink,
});
