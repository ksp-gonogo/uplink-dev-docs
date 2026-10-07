export default {
  kind: "widget",
  widget: "escape-profile",
  scene: { fixture: "reference/fixtures/escape-profile.json", w: 10, h: 8 },
  examples: [{ id: "escape-profile" }],
  stories: {
    states: "widgets/escape-profile.stories.tsx",
    extensions: {
      "escape-profile.sections": "extensions/slots.stories.tsx#PlantedSlotEscapeProfileSections",
      "escape-profile.actions": "extensions/slots.stories.tsx#PlantedSlotEscapeProfileActions",
      "escape-profile.badges": "extensions/slots.stories.tsx#PlantedSlotEscapeProfileBadges",
    },
  },
};
