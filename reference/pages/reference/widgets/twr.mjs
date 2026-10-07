export default {
  kind: "widget",
  widget: "twr",
  scene: { fixture: "reference/fixtures/twr.json", w: 6, h: 6 },
  examples: [{ id: "twr" }],
  stories: {
    states: "widgets/twr.stories.tsx",
    extensions: {
      "twr.sections": "extensions/slots.stories.tsx#PlantedSlotTwrSections",
      "twr.actions": "extensions/slots.stories.tsx#PlantedSlotTwrActions",
      "twr.badges": "extensions/slots.stories.tsx#PlantedSlotTwrBadges",
    },
  },
};
