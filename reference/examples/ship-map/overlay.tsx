import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
} from "@ksp-gonogo/sitrep-sdk";
import { Badge, Box } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "enginestages",
  version: "1.0.0",
  name: "Engine Stages",
  description: "Marks the engines of each stage on the Ship Map.",
});

/**
 * One mark for the whole diagram: how many stages still hold an engine, in
 * the corner. The overlay does not follow the operator's zoom or pan, so a
 * mark belongs to the diagram as a whole; one tied to a part is a
 * `ship-map.part-meters` or `ship-map.part-meta` contribution instead.
 */
function EngineStages({ parts }: SlotProps<"ship-map.overlay">) {
  const stages = new Set(parts.filter((part) => part.type === "engine").map((part) => part.stage));
  if (stages.size === 0) return null;
  return (
    <Box style={{ position: "absolute", top: 8, right: 8 }}>
      <Badge tone="info" size="sm">
        {stages.size === 1 ? "1 engine stage" : `${stages.size} engine stages`}
      </Badge>
    </Box>
  );
}

registerAugment({
  id: "enginestages-marks",
  augments: "ship-map.overlay",
  component: EngineStages,
  owner: uplink,
});
