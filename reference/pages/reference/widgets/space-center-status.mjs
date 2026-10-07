export default {
  kind: "widget",
  widget: "space-center-status",
  scene: { fixture: "reference/fixtures/space-center-status.json", w: 8, h: 10 },
  examples: [{ id: "space-center-status" }],
  extensions: {
    "space-center-status.facilities": "reference/examples/space-center-status/facilities.ts",
  },
  stories: {
    states: "widgets/space-center-status.stories.tsx",
    extensions: {
      "space-center-status.facilities": "extensions/slots.stories.tsx#PlantedSlotSpaceCenterStatusFacilities",
      "space-center-status.sections": "extensions/slots.stories.tsx#PlantedSlotSpaceCenterStatusSections",
      "space-center-status.actions": "extensions/slots.stories.tsx#PlantedSlotSpaceCenterStatusActions",
      "space-center-status.badges": "extensions/slots.stories.tsx#PlantedSlotSpaceCenterStatusBadges",
    },
  },
};
