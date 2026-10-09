import {
  defineUplinkClient,
  registerComponent,
  useTelemetry,
} from "@ksp-gonogo/sitrep-sdk";
import { Stat, Unit } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "altitude-board",
  version: "1.0.0",
  name: "Altitude Board",
  description: "Reference example: Altitude Board.",
});

export function AltitudeWidget() {
  const flight = useTelemetry("vessel.flight");
  return (
    <Stat label="Altitude">
      <Unit value={flight.altitudeAsl} />
    </Stat>
  );
}

registerComponent({
  id: "altitude-board-altitude",
  name: "Altitude",
  description: "The active vessel's altitude above sea level.",
  tags: ["telemetry"],
  component: AltitudeWidget,
  channels: ["vessel.flight"],
  defaultSize: { w: 3, h: 2 },
  owner: uplink,
});
