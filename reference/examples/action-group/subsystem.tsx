// npm install @ksp-gonogo/sitrep-sdk @ksp-gonogo/ui-kit
import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
  useTelemetry,
  value,
} from "@ksp-gonogo/sitrep-sdk";
import { Meter, Section } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "gearload",
  version: "1.0.0",
  name: "Gear Load",
  description: "Adds a dynamic pressure section to the gear group of the Action Group widget.",
});

// An example figure for this Uplink, not a limit from the game: the dynamic pressure the gear is drawn against.
const SAFE_PRESSURE = value("kPa", 25);

function GearLoad({ groupId }: SlotProps<"action-group.subsystem">) {
  const flight = useTelemetry("vessel.flight");
  // The stock group names are "SAS", "RCS", "Light", "Gear", "Brake", "Abort", "Precision Control" and "Stage".
  if (groupId !== "Gear" || flight.state !== "observed") return null;
  const pressure = flight.value.dynamicPressureKPa;
  const nearLimit = pressure.greaterThan(SAFE_PRESSURE.scaled(0.75));
  return (
    <Section title="Gear load">
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
  id: "gearload-section",
  augments: "action-group.subsystem",
  component: GearLoad,
  channels: ["vessel.flight"],
  owner: uplink,
});
