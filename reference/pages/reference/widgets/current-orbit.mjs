export default {
  kind: "widget",
  widget: "current-orbit",
  scene: { fixture: "reference/fixtures/current-orbit.json", w: 9, h: 18 },
  examples: [{ id: "current-orbit" }],
  stories: {
    states: "widgets/current-orbit.stories.tsx",
    extensions: {
      "current-orbit.sections": "extensions/slots.stories.tsx#PlantedSlotCurrentOrbitSections",
      "current-orbit.actions": "extensions/slots.stories.tsx#PlantedSlotCurrentOrbitActions",
      "current-orbit.badges": "extensions/slots.stories.tsx#PlantedSlotCurrentOrbitBadges",
    },
  },
};
