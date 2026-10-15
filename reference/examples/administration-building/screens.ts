import {
  defineUplinkClient,
  type AdministrationBuildingScreenEntry,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "admintabs",
  version: "1.0.0",
  name: "Admin Tabs",
  description: "Adds a tab per department to the Administration Building widget.",
});

uplink.registerContribution({
  id: "department-tabs",
  contributes: "administration-building.screens",
  deps: [],
  compute: (): AdministrationBuildingScreenEntry[] => [
    {
      id: "operations",
      label: "Operations",
      order: 1,
      departments: ["Operations"],
    },
    {
      id: "money-and-image",
      label: "Money and image",
      order: 2,
      departments: ["Finances", "Public Relations"],
    },
  ],
});
