import {
  defineUplinkClient,
  registerAugment,
  useTelemetry,
} from "@ksp-gonogo/sitrep-sdk";
import { Section, Text } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "crew-traits",
  version: "1.0.0",
  name: "Crew Traits",
  description: "Adds a section of crew traits to Crew Status.",
});

function Traits() {
  const crew = useTelemetry("vessel.crew");
  if (crew.state !== "observed") return null;
  const traits = new Set(crew.value.crew.map((kerbal) => kerbal.trait));
  return (
    <Section title="Traits aboard">
      <Text>{[...traits].join(", ")}</Text>
    </Section>
  );
}

registerAugment({
  id: "crew-traits-section",
  augments: "crew-status.sections",
  component: Traits,
  channels: ["vessel.crew"],
  owner: uplink,
});
