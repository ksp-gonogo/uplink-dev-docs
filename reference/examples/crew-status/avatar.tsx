import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
} from "@ksp-gonogo/sitrep-sdk";
import { Text } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "crew-portraits",
  version: "1.0.0",
  name: "Crew Portraits",
  description: "Reference example: Crew Portraits.",
});

function Initials({ crewName }: SlotProps<"crew-status.avatar">) {
  return (
    <Text size="lg" weight="semibold">
      {crewName.slice(0, 2).toUpperCase()}
    </Text>
  );
}

registerAugment({
  id: "crew-portraits-initials",
  augments: "crew-status.avatar",
  component: Initials,
  owner: uplink,
});
