import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
} from "@ksp-gonogo/sitrep-sdk";
import { Badge, Box } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "engine-stages",
  version: "1.0.0",
  name: "Engine Stages",
});

function EngineStages({
  parts,
  width,
  height,
  bounds,
  baseScale,
}: SlotProps<"ship-map.overlay">) {
  return parts
    .filter((part) => part.type === "engine")
    .map((part) => (
      <Box
        key={part.flightId}
        style={{
          position: "absolute",
          left: width / 2 + (part.lat - bounds.cx) * baseScale,
          top: height / 2 - (part.axial - bounds.cy) * baseScale,
        }}
      >
        <Badge tone="info" size="sm">
          Stage {part.stage}
        </Badge>
      </Box>
    ));
}

registerAugment({
  id: "engine-stages-marks",
  augments: "ship-map.overlay",
  component: EngineStages,
  owner: uplink,
});
