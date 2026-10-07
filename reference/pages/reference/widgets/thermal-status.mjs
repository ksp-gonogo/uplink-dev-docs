export default {
  kind: "widget",
  widget: "thermal-status",
  scene: { fixture: "reference/fixtures/thermal-status.json", w: 8, h: 8 },
  examples: [{ id: "thermal-status" }],
  stories: {
    states: "widgets/thermal-status.stories.tsx",
    extensions: {
      "thermal-status.sections": "extensions/slots.stories.tsx#PlantedSlotThermalStatusSections",
      "thermal-status.actions": "extensions/slots.stories.tsx#PlantedSlotThermalStatusActions",
      "thermal-status.badges": "extensions/slots.stories.tsx#PlantedSlotThermalStatusBadges",
    },
  },
};
