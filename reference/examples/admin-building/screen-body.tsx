import {
  defineUplinkClient,
  registerAugment,
  type SlotProps,
  type AdminBuildingScreenEntry,
} from "@ksp-gonogo/sitrep-sdk";
import { Section, Text } from "@ksp-gonogo/ui-kit";

const uplink = defineUplinkClient({
  id: "adminnotes",
  version: "1.0.0",
  name: "Admin Notes",
  description: "Adds a Notes screen to the Admin Building widget for the Operations department.",
});

uplink.registerContribution({
  id: "notes-screen",
  contributes: "admin-building.screens",
  deps: [],
  compute: (): AdminBuildingScreenEntry[] => [
    { id: "notes", label: "Notes", departments: ["Operations"] },
  ],
});

function Notes({ screenId }: SlotProps<"admin-building.screen-body">) {
  if (screenId !== "notes") return null;
  return (
    <Section title="Operations notes">
      <Text>Review these before the next launch window.</Text>
    </Section>
  );
}

registerAugment({
  id: "adminnotes-body",
  augments: "admin-building.screen-body",
  component: Notes,
  owner: uplink,
});
