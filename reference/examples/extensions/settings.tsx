import {
  defineUplinkClient,
  registerAugment,
  useTelemetry,
} from "@ksp-gonogo/sitrep-sdk";
import { Section, Text, useAugmentSettings } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "crewnames",
  version: "1.0.0",
  name: "Crew Names",
  description: "Adds a crew names section to Crew Status with a setting for first names only.",
});

function Names() {
  const crew = useTelemetry("vessel.crew");
  const { values } = useAugmentSettings("crewnames-section");
  if (crew.state !== "observed") return null;
  const short = values.short !== false;
  return (
    <Section title="Aboard">
      <Text>
        {crew.value.crew
          .map((kerbal) => (short ? kerbal.name?.split(" ")[0] : kerbal.name))
          .join(", ")}
      </Text>
    </Section>
  );
}

registerAugment({
  id: "crewnames-section",
  augments: "crew-status.sections",
  component: Names,
  channels: ["vessel.crew"],
  settings: [{ key: "short", type: "boolean", label: "First names only", default: true }],
  owner: uplink,
});
