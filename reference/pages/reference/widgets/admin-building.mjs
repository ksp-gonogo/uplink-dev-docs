export default {
  kind: "widget",
  widget: "admin-building",
  scene: { fixture: "reference/fixtures/admin-building.json", w: 8, h: 16 },
  examples: [{ id: "admin-building" }],
  extensions: {
    "admin-building.screens": "reference/examples/admin-building/screens.ts",
    "admin-building.screen-body": "reference/examples/admin-building/screen-body.tsx",
  },
  stories: {
    states: "widgets/admin-building.stories.tsx",
    extensions: {
      "admin-building.screens": "extensions/slots.stories.tsx#PlantedSlotAdminBuildingScreens",
      "admin-building.screen-body": "extensions/slots.stories.tsx#AdminBuildingScreensAdminBuildingScreenBody",
      "admin-building.sections": "extensions/slots.stories.tsx#PlantedSlotAdminBuildingSections",
      "admin-building.actions": "extensions/slots.stories.tsx#PlantedSlotAdminBuildingActions",
      "admin-building.badges": "extensions/slots.stories.tsx#PlantedSlotAdminBuildingBadges",
    },
  },
};
