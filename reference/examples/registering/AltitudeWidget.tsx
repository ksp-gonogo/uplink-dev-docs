// npm install @ksp-gonogo/sitrep-sdk @ksp-gonogo/ui-kit
import {
  defineUplinkClient,
  registerComponent,
  useTelemetry,
} from "@ksp-gonogo/sitrep-sdk";
// Stat and Unit are documented on the ui-kit Readout and Unit pages
import { Stat, Unit } from "@ksp-gonogo/ui-kit";

// The id must match the id the Uplink's mod declares with [SitrepUplink]. The client also needs that mod
// half and a built bundle to load; `uplink-tools new` writes all three together.
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
