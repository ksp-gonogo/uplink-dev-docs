export default {
  kind: "widget",
  widget: "navball",
  scene: { fixture: "reference/fixtures/navball.json", w: 8, h: 11 },
  examples: [{ id: "navball" }],
  stories: {
    states: "widgets/navball.stories.tsx",
    extensions: {
      "navball.sections": "extensions/slots.stories.tsx#PlantedSlotNavballSections",
      "navball.actions": "extensions/slots.stories.tsx#PlantedSlotNavballActions",
      "navball.badges": "extensions/slots.stories.tsx#PlantedSlotNavballBadges",
    },
  },
};
