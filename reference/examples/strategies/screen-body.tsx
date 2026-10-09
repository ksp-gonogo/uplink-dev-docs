import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
  type StrategiesScreenEntry,
} from "@ksp-gonogo/sitrep-sdk";
import { Section, Text } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "admin-notes",
  version: "1.0.0",
  name: "Admin Notes",
  description: "Reference example: Admin Notes.",
});

uplink.registerContribution({
  id: "notes-screen",
  contributes: "strategies.screens",
  deps: [],
  compute: (): StrategiesScreenEntry[] => [
    { id: "notes", label: "Notes", departments: ["Operations"] },
  ],
});

function Notes({ screenId }: SlotProps<"strategies.screen-body">) {
  if (screenId !== "notes") return null;
  return (
    <Section title="Operations notes">
      <Text>Review these before the next launch window.</Text>
    </Section>
  );
}

registerAugment({
  id: "admin-notes-body",
  augments: "strategies.screen-body",
  component: Notes,
  owner: uplink,
});
