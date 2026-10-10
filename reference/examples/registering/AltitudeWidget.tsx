import {
  defineUplinkClient,
  registerComponent,
  useTelemetry,
} from "@ksp-gonogo/sitrep-sdk";
import { Stat, Unit } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "altitudeboard",
  version: "1.0.0",
  name: "Altitude Board",
  description: "A widget that draws the craft's altitude above sea level.",
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
  id: "altitudeboard-altitude",
  name: "Altitude",
  description: "The active vessel's altitude above sea level.",
  tags: ["telemetry"],
  component: AltitudeWidget,
  channels: ["vessel.flight"],
  defaultSize: { w: 3, h: 2 },
  owner: uplink,
});
