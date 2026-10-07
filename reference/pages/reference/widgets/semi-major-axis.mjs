export default {
  kind: "widget",
  widget: "semi-major-axis",
  scene: { fixture: "reference/fixtures/semi-major-axis.json", w: 4, h: 4 },
  examples: [{ id: "semi-major-axis" }],
  stories: {
    states: "widgets/semi-major-axis.stories.tsx",
    extensions: {
      "semi-major-axis.sections": "extensions/slots.stories.tsx#PlantedSlotSemiMajorAxisSections",
      "semi-major-axis.actions": "extensions/slots.stories.tsx#PlantedSlotSemiMajorAxisActions",
      "semi-major-axis.badges": "extensions/slots.stories.tsx#PlantedSlotSemiMajorAxisBadges",
    },
  },
};
