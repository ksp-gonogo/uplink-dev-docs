import {
  defineUplinkClient,
  registerAugment,
  useTelemetry,
} from "@ksp-gonogo/sitrep-sdk";
import { Section, Stat, Unit } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "crew-budget",
  version: "1.0.0",
  name: "Crew Budget",
});

function Budget() {
  const complex = useTelemetry("spaceCenter.astronautComplex");
  if (complex.state !== "observed") return null;
  const { applicants, nextHireCost } = complex.value;
  return (
    <Section title="Hiring budget">
      <Stat label="Next hire">
        <Unit value={nextHireCost} />
      </Stat>
      <Stat label="Applicants">{applicants.length}</Stat>
    </Section>
  );
}

registerAugment({
  id: "crew-budget-tab",
  augments: "astronaut-complex.tab",
  label: "Budget",
  component: Budget,
  channels: ["spaceCenter.astronautComplex"],
  owner: uplink,
});
