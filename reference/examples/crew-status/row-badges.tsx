import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
  useTelemetry,
} from "@ksp-gonogo/sitrep-sdk";
import { Badge, Unit } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "crew-levels",
  version: "1.0.0",
  name: "Crew Levels",
  description: "Adds each kerbal's level as a badge on their Crew Status row.",
});

function LevelBadge({ crewIndex }: SlotProps<"crew-status.row-badges">) {
  const crew = useTelemetry("vessel.crew");
  if (crew.state !== "observed") return null;
  const level = crew.value.crew[crewIndex]?.experienceLevel;
  if (!level) return null;
  return (
    <Badge tone="info" size="sm">
      Level <Unit value={level} />
    </Badge>
  );
}

registerAugment({
  id: "crew-levels-badge",
  augments: "crew-status.row-badges",
  component: LevelBadge,
  channels: ["vessel.crew"],
  owner: uplink,
});
