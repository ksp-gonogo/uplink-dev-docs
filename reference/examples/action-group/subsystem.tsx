import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
  useTelemetry,
  value,
} from "@ksp-gonogo/sitrep-sdk";
import { Meter, Section } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "chuteload",
  version: "1.0.0",
  name: "Chute Load",
  description: "Adds a parachute load section to the Action Group widget.",
});

const SAFE_PRESSURE = value("kPa", 25);

function ChuteLoad({ groupId }: SlotProps<"action-group.subsystem">) {
  const flight = useTelemetry("vessel.flight");
  if (groupId !== "AG1" || flight.state !== "observed") return null;
  const pressure = flight.value.dynamicPressureKPa;
  const nearLimit = pressure.greaterThan(SAFE_PRESSURE.scaled(0.75));
  return (
    <Section title="Chute load">
      <Meter
        label="Dynamic pressure"
        value={pressure}
        capacity={SAFE_PRESSURE}
        tone={nearLimit ? "warn" : "go"}
      />
    </Section>
  );
}

registerAugment({
  id: "chuteload-section",
  augments: "action-group.subsystem",
  component: ChuteLoad,
  channels: ["vessel.flight"],
  owner: uplink,
});
