export default {
  kind: "widget",
  widget: "power-systems",
  scene: {
    fixture: "reference/fixtures/power-systems.json",
    w: 8,
    h: 12,
  },
  examples: [{ id: "power-systems" }],
  stories: {
    states: "widgets/power-systems.stories.tsx",
    extensions: {
      "power-systems.sections": "extensions/slots.stories.tsx#PlantedSlotPowerSystemsSections",
      "power-systems.actions": "extensions/slots.stories.tsx#PlantedSlotPowerSystemsActions",
      "power-systems.badges": "extensions/slots.stories.tsx#PlantedSlotPowerSystemsBadges",
    },
  },
};
