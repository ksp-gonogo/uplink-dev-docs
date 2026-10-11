export default {
  kind: "widget",
  widget: "strategies",
  scene: { fixture: "reference/fixtures/strategies.json", w: 8, h: 16 },
  examples: [{ id: "strategies" }],
  extensions: {
    "strategies.screens": "reference/examples/strategies/screens.ts",
    "strategies.screen-body": "reference/examples/strategies/screen-body.tsx",
  },
  stories: {
    states: "widgets/strategies.stories.tsx",
    extensions: {
      "strategies.screens": "extensions/slots.stories.tsx#PlantedSlotStrategiesScreens",
      "strategies.screen-body": "extensions/slots.stories.tsx#StrategiesScreensStrategiesScreenBody",
      "strategies.sections": "extensions/slots.stories.tsx#PlantedSlotStrategiesSections",
      "strategies.actions": "extensions/slots.stories.tsx#PlantedSlotStrategiesActions",
      "strategies.badges": "extensions/slots.stories.tsx#PlantedSlotStrategiesBadges",
    },
  },
};
