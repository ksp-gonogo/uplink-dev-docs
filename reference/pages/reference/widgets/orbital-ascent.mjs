export default {
  kind: "widget",
  widget: "orbital-ascent",
  scene: { fixture: "reference/fixtures/orbital-ascent.json", w: 10, h: 8 },
  examples: [{ id: "orbital-ascent" }],
  stories: {
    states: "widgets/orbital-ascent.stories.tsx",
    extensions: {
      "orbital-ascent.sections": "extensions/slots.stories.tsx#PlantedSlotOrbitalAscentSections",
      "orbital-ascent.actions": "extensions/slots.stories.tsx#PlantedSlotOrbitalAscentActions",
      "orbital-ascent.badges": "extensions/slots.stories.tsx#PlantedSlotOrbitalAscentBadges",
    },
  },
};
