import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
} from "@ksp-gonogo/sitrep-sdk";
import { Badge, Box } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "dock-angles",
  version: "1.0.0",
  name: "Dock Angles",
  description: "Reads out the docking approach angles over the Targeting view.",
});

function AngleReadout({
  reticleOffset,
  reticleTravelPx,
  aligned,
  ax,
  ay,
}: SlotProps<"targeting.overlay">) {
  if (ax === undefined || ay === undefined) return null;
  return (
    <Box
      style={{
        position: "absolute",
        left: `calc(50% + ${reticleOffset.x * reticleTravelPx}px)`,
        top: `calc(50% + ${reticleOffset.y * reticleTravelPx}px)`,
        transform: "translate(-50%, calc(-100% - 1rem))",
      }}
    >
      <Badge tone={aligned ? "go" : "warn"} size="sm">
        {ax.toFixed(1)}° / {ay.toFixed(1)}°
      </Badge>
    </Box>
  );
}

registerAugment({
  id: "dock-angles-readout",
  augments: "targeting.overlay",
  component: AngleReadout,
  owner: uplink,
});
