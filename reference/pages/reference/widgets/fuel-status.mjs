export default {
  kind: "widget",
  widget: "fuel-status",
  scene: { fixture: "reference/fixtures/fuel-status.json", w: 8, h: 16 },
  examples: [{ id: "fuel-status" }],
  stories: {
    states: "widgets/fuel-status.stories.tsx",
    extensions: {
      "fuel-status.sections": "extensions/slots.stories.tsx#PlantedSlotFuelStatusSections",
    },
  },
};
