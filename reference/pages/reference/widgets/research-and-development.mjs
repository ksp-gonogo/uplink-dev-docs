export default {
  kind: "widget",
  widget: "research-and-development",
  scene: { fixture: "reference/fixtures/research-and-development.json", w: 8, h: 10 },
  examples: [{ id: "research-and-development" }],
  extensions: {
  },
  stories: {
    states: "widgets/research-and-development.stories.tsx",
    extensions: {
      "research-and-development.sections": "extensions/slots.stories.tsx#PlantedSlotResearchAndDevelopmentSections",
      "research-and-development.actions": "extensions/slots.stories.tsx#PlantedSlotResearchAndDevelopmentActions",
      "research-and-development.badges": "extensions/slots.stories.tsx#PlantedSlotResearchAndDevelopmentBadges",
    },
  },
};
