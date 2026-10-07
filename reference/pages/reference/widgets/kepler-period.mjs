export default {
  kind: "widget",
  widget: "kepler-period",
  scene: { fixture: "reference/fixtures/kepler-period.json", w: 10, h: 8 },
  examples: [{ id: "kepler-period" }],
  stories: {
    states: "widgets/kepler-period.stories.tsx",
    extensions: {
      "kepler-period.sections": "extensions/slots.stories.tsx#PlantedSlotKeplerPeriodSections",
      "kepler-period.actions": "extensions/slots.stories.tsx#PlantedSlotKeplerPeriodActions",
      "kepler-period.badges": "extensions/slots.stories.tsx#PlantedSlotKeplerPeriodBadges",
    },
  },
};
