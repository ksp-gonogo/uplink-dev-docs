export default {
  kind: "widget",
  widget: "resource-ops",
  scene: {
    fixture: "reference/fixtures/resource-ops.json",
    w: 6,
    h: 11,
  },
  examples: [{ id: "resource-ops" }],
  stories: {
    states: "widgets/resource-ops.stories.tsx",
    extensions: {
      "resource-ops.sections": "extensions/slots.stories.tsx#PlantedSlotResourceOpsSections",
      "resource-ops.actions": "extensions/slots.stories.tsx#PlantedSlotResourceOpsActions",
      "resource-ops.badges": "extensions/slots.stories.tsx#PlantedSlotResourceOpsBadges",
    },
  },
};
