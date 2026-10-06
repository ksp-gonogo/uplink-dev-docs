import {
  defineUplinkClient,
  registerAugment,
  useTelemetry,
} from "@ksp-gonogo/sitrep-sdk";
import { Button } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "crew-copy",
  version: "1.0.0",
  name: "Crew Copy",
});

function CopyNames() {
  const crew = useTelemetry("vessel.crew");
  if (crew.state !== "observed") return null;
  const names = crew.value.crew.map((kerbal) => kerbal.name).join("\n");
  return (
    <Button onClick={() => navigator.clipboard.writeText(names)}>
      Copy names
    </Button>
  );
}

registerAugment({
  id: "crew-copy-names",
  augments: "crew-status.actions",
  component: CopyNames,
  channels: ["vessel.crew"],
  owner: uplink,
});
