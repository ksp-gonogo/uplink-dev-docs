export default {
  kind: "widget",
  widget: "atmosphere-profile",
  scene: { fixture: "reference/fixtures/atmosphere-profile.json", w: 8, h: 8 },
  examples: [{ id: "atmosphere-profile" }],
  stories: {
    states: "widgets/atmosphere-profile.stories.tsx",
    extensions: {
      "atmosphere-profile.sections": "extensions/slots.stories.tsx#PlantedSlotAtmosphereProfileSections",
      "atmosphere-profile.actions": "extensions/slots.stories.tsx#PlantedSlotAtmosphereProfileActions",
      "atmosphere-profile.badges": "extensions/slots.stories.tsx#PlantedSlotAtmosphereProfileBadges",
    },
  },
};
