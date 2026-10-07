import {
  defineUplinkClient,
  registerAugment,
  useTelemetry,
} from "@ksp-gonogo/sitrep-sdk";
import { Section, Text } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "crew-pilots",
  version: "1.0.0",
  name: "Crew Pilots",
});

function Pilots() {
  const crew = useTelemetry("vessel.crew");
  if (crew.state !== "observed") return null;
  const pilots = crew.value.crew.filter((kerbal) => kerbal.trait === "Pilot");
  return (
    <Section title="Pilots aboard">
      <Text>{pilots.map((kerbal) => kerbal.name).join(", ")}</Text>
    </Section>
  );
}

registerAugment({
  id: "crew-pilots-section",
  augments: "crew-status.sections",
  component: Pilots,
  channels: ["vessel.crew"],
  owner: uplink,
});
