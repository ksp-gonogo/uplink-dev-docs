import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
} from "@ksp-gonogo/sitrep-sdk";
import { Badge, Section, Text } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "crewcheck",
  version: "1.0.0",
  name: "Crew Check",
  description: "Warns in the Launch Director preflight when no crew is picked.",
});

function CrewCheck({ selectedCrew }: SlotProps<"launch-director.preflight">) {
  if (selectedCrew.length > 0) return null;
  return (
    <Section title="Crew check">
      <Badge tone="warn">No crew picked</Badge>
      <Text>The craft will launch with nobody aboard.</Text>
    </Section>
  );
}

registerAugment({
  id: "crewcheck-preflight",
  augments: "launch-director.preflight",
  component: CrewCheck,
  owner: uplink,
});
