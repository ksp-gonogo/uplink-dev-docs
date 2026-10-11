import {
  defineUplinkClient,
  type AdminBuildingScreenEntry,
} from "@ksp-gonogo/sitrep-sdk";

const uplink = defineUplinkClient({
  id: "admintabs",
  version: "1.0.0",
  name: "Admin Tabs",
  description: "Adds a tab per department to the Admin Building widget.",
});

uplink.registerContribution({
  id: "department-tabs",
  contributes: "admin-building.screens",
  deps: [],
  compute: (): AdminBuildingScreenEntry[] => [
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
