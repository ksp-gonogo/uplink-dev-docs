export default {
  kind: "widget",
  widget: "administration-building",
  scene: { fixture: "reference/fixtures/administration-building.json", w: 8, h: 16 },
  examples: [{ id: "administration-building" }],
  extensions: {
    "administration-building.screens": "reference/examples/administration-building/screens.ts",
    "administration-building.screen-body": "reference/examples/administration-building/screen-body.tsx",
  },
  stories: {
    states: "widgets/administration-building.stories.tsx",
    extensions: {
      "administration-building.screens": "extensions/slots.stories.tsx#PlantedSlotAdministrationBuildingScreens",
      "administration-building.screen-body": "extensions/slots.stories.tsx#AdministrationBuildingScreensAdministrationBuildingScreenBody",
      "administration-building.sections": "extensions/slots.stories.tsx#PlantedSlotAdministrationBuildingSections",
      "administration-building.actions": "extensions/slots.stories.tsx#PlantedSlotAdministrationBuildingActions",
      "administration-building.badges": "extensions/slots.stories.tsx#PlantedSlotAdministrationBuildingBadges",
    },
  },
};
