import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
  type AdministrationBuildingScreenEntry,
} from "@ksp-gonogo/sitrep-sdk";
import { Section, Text } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "adminnotes",
  version: "1.0.0",
  name: "Admin Notes",
  description: "Adds a Notes screen to the Administration Building widget for the Operations department.",
});

uplink.registerContribution({
  id: "notes-screen",
  contributes: "administration-building.screens",
  deps: [],
  compute: (): AdministrationBuildingScreenEntry[] => [
    { id: "notes", label: "Notes", departments: ["Operations"] },
  ],
});

function Notes({ screenId }: SlotProps<"administration-building.screen-body">) {
  if (screenId !== "notes") return null;
  return (
    <Section title="Operations notes">
      <Text>Review these before the next launch window.</Text>
    </Section>
  );
}

registerAugment({
  id: "adminnotes-body",
  augments: "administration-building.screen-body",
  component: Notes,
  owner: uplink,
});
