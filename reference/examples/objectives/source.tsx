import {
  defineUplinkClient,
  type ObjectiveSlotItem,
  registerAugment,
  type SlotProps,
  useTelemetry,
  value,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "ascentgoals",
  version: "1.0.0",
  name: "Ascent Goals",
  description: "Adds ascent goals to the Objectives widget as a source of its own.",
});

const SPACE_ALTITUDE = value("m", 70_000);

function AscentGoals({ Section }: SlotProps<"objectives.source">) {
  const flight = useTelemetry("vessel.flight");
  if (flight.state !== "observed") return null;
  const reached = flight.value.altitudeAsl.greaterThanOrEqual(SPACE_ALTITUDE);
  const items: ObjectiveSlotItem[] = [
    {
      id: "ascent-goals:space",
      title: "Cross the edge of space",
      description: "Pass 70 km above sea level",
      state: reached ? "reached" : "active",
      source: "Ascent plan",
    },
  ];
  return <Section items={items} />;
}

registerAugment({
  id: "ascentgoals-source",
  augments: "objectives.source",
  component: AscentGoals,
  channels: ["vessel.flight"],
  owner: uplink,
});
