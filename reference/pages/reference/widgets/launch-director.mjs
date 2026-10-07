export default {
  kind: "widget",
  widget: "launch-director",
  scene: { fixture: "reference/fixtures/launch-director.json", w: 8, h: 12 },
  examples: [{ id: "launch-director" }],
  extensions: {
    "launch-director.pad": "reference/examples/launch-director/pad.tsx",
    "launch-director.preflight": "reference/examples/launch-director/preflight.tsx",
  },
  stories: {
    states: "widgets/launch-director.stories.tsx",
    extensions: {
      "launch-director.pad": "extensions/slots.stories.tsx#PlantedSlotLaunchDirectorPad",
      "launch-director.preflight": "extensions/slots.stories.tsx#PlantedSlotLaunchDirectorPreflight",
      "launch-director.sections": "extensions/slots.stories.tsx#PlantedSlotLaunchDirectorSections",
      "launch-director.actions": "extensions/slots.stories.tsx#PlantedSlotLaunchDirectorActions",
      "launch-director.badges": "extensions/slots.stories.tsx#PlantedSlotLaunchDirectorBadges",
    },
  },
};
